#!/bin/bash
# Run all quality checks locally before pushing.
# Runs automatically on every git push (via .githooks/pre-push).
# Usage: ./scripts/validate.sh
set -e

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

# ── Helpers ───────────────────────────────────────────────────────────────────
step() { echo -e "\n${BLUE}▶ $1${NC}"; }

result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}  ✓ $2${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}  ✗ $2${NC}"
    FAIL=$((FAIL + 1))
  fi
}

echo -e "${YELLOW}╔══════════════════════════════════╗"
echo -e "║   Pre-push validation checks    ║"
echo -e "╚══════════════════════════════════╝${NC}"

# ── 1. Lint ───────────────────────────────────────────────────────────────────
step "ESLint"
npm run lint --silent && result 0 "Lint" || result 1 "Lint — run 'npm run lint:fix' to auto-fix"

# ── 2. TypeScript ─────────────────────────────────────────────────────────────
step "TypeScript type check"
npm run typecheck --silent && result 0 "Type check" || result 1 "Type check — fix type errors before pushing"

# ── 3. Unit tests ─────────────────────────────────────────────────────────────
step "Unit tests"
npm test --silent && result 0 "Unit tests" || result 1 "Unit tests — fix failing tests before pushing"

# ── 4. Security audit ─────────────────────────────────────────────────────────
step "Security audit (production deps)"
npm audit --audit-level=high --production --silent && result 0 "Security audit" || result 1 "Security audit — run 'npm audit' for details"

# ── 5. IaC validation ─────────────────────────────────────────────────────────
step "Serverless package (IaC validation)"
npx serverless package --stage dev 2>/dev/null && result 0 "Serverless package" || result 1 "Serverless package — fix serverless.yml errors"

# ── Summary ───────────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}────────────────────────────────────"
echo -e " Results: ${GREEN}${PASS} passed${YELLOW} / ${RED}${FAIL} failed${YELLOW}"
echo -e "────────────────────────────────────${NC}"

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}Push blocked — fix the errors above before pushing.${NC}\n"
  exit 1
fi

echo -e "${GREEN}All checks passed — safe to push.${NC}\n"
