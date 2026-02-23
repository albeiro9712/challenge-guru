#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ── Helpers ────────────────────────────────────────────────────────────────────
step() { echo -e "\n${BLUE}[$1/$TOTAL_STEPS] $2${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

# ── Arguments ─────────────────────────────────────────────────────────────────
STAGE=${1:-dev}
TOTAL_STEPS=6

if [[ "$STAGE" != "dev" && "$STAGE" != "prod" ]]; then
  echo -e "${RED}Error: Invalid stage '$STAGE'. Usage: ./scripts/deploy.sh [dev|prod]${NC}"
  exit 1
fi

echo -e "${YELLOW}========================================"
echo -e " Deploying task-manager-api → $STAGE"
echo -e "========================================${NC}"

# ── Step 1: Lint ──────────────────────────────────────────────────────────────
step 1 "Running ESLint..."
npm run lint || fail "Lint failed"
ok "Lint passed"

# ── Step 2: Unit tests ────────────────────────────────────────────────────────
step 2 "Running unit tests..."
npm test || fail "Unit tests failed"
ok "Unit tests passed"

# ── Step 3: Type check ────────────────────────────────────────────────────────
step 3 "TypeScript type check..."
npm run typecheck || fail "Type check failed"
ok "Type check passed"

# ── Step 4: Security audit ────────────────────────────────────────────────────
step 4 "Security audit (production deps)..."
npm audit --audit-level=high --production || fail "Security audit failed — run 'npm audit' for details"
ok "Security audit passed"

# ── Step 5: Package (build check) ────────────────────────────────────────────
step 5 "Packaging for stage: $STAGE..."
npx serverless package --stage "$STAGE" || fail "Serverless package failed"
ok "Package built successfully"

# ── Step 6: Deploy ────────────────────────────────────────────────────────────
step 6 "Deploying to $STAGE..."
npx serverless deploy --stage "$STAGE" || fail "Deployment failed"
ok "Deployed to $STAGE"

# ── Step 7 (optional): Integration tests — dev only ──────────────────────────
if [[ "$STAGE" == "dev" ]]; then
  if [[ -n "$API_URL" && -n "$API_KEY" ]]; then
    echo -e "\n${BLUE}[+] Running integration tests against $STAGE...${NC}"
    npm run test:integration || fail "Integration tests failed"
    ok "Integration tests passed"
  else
    echo -e "\n${YELLOW}[!] Skipping integration tests — set API_URL and API_KEY to enable them${NC}"
  fi
fi

echo -e "\n${GREEN}========================================"
echo -e " Done! task-manager-api deployed to $STAGE"
echo -e "========================================${NC}"
