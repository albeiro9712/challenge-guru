# Task Manager API

A serverless REST API for task management built with AWS Lambda, API Gateway, and DynamoDB using the Serverless Framework and TypeScript.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

## Overview

`task-manager-api` is a production-ready serverless API that allows users to create, read, update, and delete tasks. It leverages AWS managed services to provide a scalable, low-maintenance solution with built-in authentication via API keys.

Key highlights:

- Full CRUD operations for task management
- API key authentication with usage plans and rate limiting
- Separate `dev` and `prod` deployment stages
- Automated quality gates: linting, type checking, unit tests, and security audits
- Pre-push hooks to prevent broken code from reaching the repository
- GitHub Actions CI/CD pipeline for automated deployments

## Architecture

```
Client
  │
  ▼
API Gateway (REST API + API Key Auth)
  │
  ├── POST   /tasks          ──► Lambda: createTask
  ├── GET    /tasks          ──► Lambda: listTasks
  ├── GET    /tasks/{id}     ──► Lambda: getTask
  ├── PUT    /tasks/{id}     ──► Lambda: updateTask
  └── DELETE /tasks/{id}     ──► Lambda: deleteTask
                                       │
                                       ▼
                                  DynamoDB Table
                              (task-manager-api-{stage}-tasks)
```

Each Lambda function is packaged individually using esbuild and has its own IAM role following the principle of least privilege.

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js 20.x |
| Language | TypeScript 5.5 |
| Framework | Serverless Framework v3 |
| Compute | AWS Lambda |
| API Layer | AWS API Gateway (REST) |
| Database | AWS DynamoDB (PAY_PER_REQUEST) |
| Bundler | esbuild via serverless-esbuild |
| Testing | Jest 29 + ts-jest |
| Linting | ESLint 9 + @typescript-eslint |
| CI/CD | GitHub Actions |

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20.x
- [npm](https://www.npmjs.com/) >= 10.x
- [AWS CLI](https://aws.amazon.com/cli/) configured with valid credentials
- [Serverless Framework](https://www.serverless.com/) v3 installed globally (optional, available via npx)

```bash
npm install -g serverless
aws configure
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd challenge-guru
```

### 2. Install dependencies

```bash
npm install
```

> The `prepare` script automatically configures the Git hooks path to `.githooks/`, enabling the pre-push validation hook.

### 3. Run tests locally

```bash
# Unit tests with coverage
npm test

# Integration tests (requires a deployed dev environment)
API_URL=<your-dev-api-url> API_KEY=<your-dev-api-key> npm run test:integration
```

### 4. Deploy to dev

```bash
npm run deploy:dev
```

## Project Structure

```
challenge-guru/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD pipeline
├── .githooks/
│   └── pre-push                # Pre-push validation hook
├── functions/                  # Serverless function definitions (YAML)
│   ├── createTask.yml
│   ├── listTasks.yml
│   ├── getTask.yml
│   ├── updateTask.yml
│   └── deleteTask.yml
├── resources/
│   └── dynamodb.yml            # DynamoDB CloudFormation resource
├── scripts/
│   ├── deploy.sh               # Manual deployment script
│   └── validate.sh             # Quality gate validation script
├── src/
│   ├── handlers/               # Lambda handler implementations
│   │   ├── createTask.ts
│   │   ├── listTasks.ts
│   │   ├── getTask.ts
│   │   ├── updateTask.ts
│   │   └── deleteTask.ts
│   ├── types/
│   │   └── task.ts             # TypeScript interfaces and enums
│   └── utils/
│       ├── dynamodb.ts         # DynamoDB client and table name
│       └── response.ts         # HTTP response helpers
├── tests/
│   ├── handlers/               # Unit tests for Lambda handlers
│   ├── utils/                  # Unit tests for utilities
│   ├── integration/            # End-to-end integration tests
│   └── helpers/
│       └── event.ts            # Mock API Gateway event factory
├── eslint.config.mjs           # ESLint flat config
├── jest.config.js              # Unit test Jest config
├── jest.integration.config.js  # Integration test Jest config
├── serverless.yml              # Main Serverless Framework config
├── tsconfig.json               # TypeScript compiler options
└── package.json
```

## API Reference

All endpoints are **private** and require an `x-api-key` header.

### Base URL

```
https://<api-id>.execute-api.us-east-1.amazonaws.com/{stage}
```

### Authentication

Include the API key in every request:

```
x-api-key: <your-api-key>
```

---

### Create a Task

```
POST /tasks
```

**Request body:**

```json
{
  "title": "Design database schema",
  "description": "Define tables, indexes, and relationships",
  "status": "pending",
  "priority": "high"
}
```

| Field | Type | Required | Default |
|---|---|---|---|
| `title` | string | Yes | — |
| `description` | string | No | `""` |
| `status` | `pending` \| `in_progress` \| `completed` | No | `"pending"` |
| `priority` | `low` \| `medium` \| `high` | No | `"medium"` |

**Response `201 Created`:**

```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Design database schema",
  "description": "Define tables, indexes, and relationships",
  "status": "pending",
  "priority": "high",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### List All Tasks

```
GET /tasks
```

**Response `200 OK`:**

```json
[
  {
    "taskId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Design database schema",
    "status": "pending",
    "priority": "high",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### Get a Task

```
GET /tasks/{id}
```

**Response `200 OK`:** Task object (see above)

**Response `404 Not Found`:**

```json
{ "error": "Task not found" }
```

---

### Update a Task

```
PUT /tasks/{id}
```

**Request body** (all fields optional):

```json
{
  "title": "Updated title",
  "status": "in_progress",
  "priority": "low"
}
```

**Response `200 OK`:** Updated task attributes

**Response `404 Not Found`:**

```json
{ "error": "Task not found" }
```

---

### Delete a Task

```
DELETE /tasks/{id}
```

**Response `200 OK`:**

```json
{ "message": "Task deleted successfully" }
```

**Response `404 Not Found`:**

```json
{ "error": "Task not found" }
```

---

### Error Responses

| Status Code | Description |
|---|---|
| `400 Bad Request` | Missing required fields (e.g., `title`) |
| `404 Not Found` | Task with the given ID does not exist |
| `500 Internal Server Error` | Unexpected server error |

## Data Model

### Task

```typescript
interface Task {
  taskId: string;        // UUID v4, auto-generated
  title: string;         // Required
  description: string;   // Optional, default ""
  status: Status;        // "pending" | "in_progress" | "completed"
  priority: Priority;    // "low" | "medium" | "high"
  createdAt: string;     // ISO 8601 timestamp
  updatedAt: string;     // ISO 8601 timestamp, updated on every PUT
}
```

### DynamoDB Table

| Attribute | Type | Role |
|---|---|---|
| `taskId` | String | Partition Key |

- **Billing mode:** PAY_PER_REQUEST (on-demand)
- **Table name:** `task-manager-api-{stage}-tasks`

## Configuration

### Stages

The API supports two deployment stages:

| Stage | Branch | Description |
|---|---|---|
| `dev` | `develop` | Development and integration testing |
| `prod` | `main` | Production environment |

### API Gateway Usage Plan

| Setting | Value |
|---|---|
| Daily quota | 100 requests |
| Burst limit | 3 requests |
| Rate limit | 3 requests/sec |

### esbuild Bundling

- **Bundle:** enabled (tree-shaking, dependency inclusion)
- **Minify:** disabled (easier debugging in Lambda)
- **Source maps:** enabled
- **Target:** node20
- **Excluded:** `@aws-sdk/*` (provided by Lambda runtime)

## Testing

### Unit Tests

```bash
npm test
```

Runs all unit tests in `tests/` (excluding integration) with Jest and generates a coverage report in `coverage/`.

```bash
# Watch mode during development
npm test -- --watch
```

### Integration Tests

Integration tests run against a live deployed environment. Requires the `dev` stage to be deployed.

```bash
export API_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/dev
export API_KEY=<your-api-key>

npm run test:integration
```

### Linting and Type Checking

```bash
# ESLint
npm run lint

# TypeScript type check (no emit)
npm run typecheck
```

### Security Audit

```bash
npm audit --audit-level=high --omit=dev
```

## Deployment

### Automated (via CI/CD)

Push to `develop` → deploys to `dev`
Push to `main` → deploys to `prod`

### Manual

Use the deployment script for a full quality-gated deployment:

```bash
# Deploy to dev
./scripts/deploy.sh dev

# Deploy to prod
./scripts/deploy.sh prod
```

The script runs these steps in order:

1. ESLint
2. TypeScript type check
3. Unit tests
4. Security audit
5. Serverless package
6. Serverless deploy
7. Integration tests (dev only)

### Serverless CLI

```bash
# Deploy
npm run deploy:dev
npm run deploy:prod

# Remove stack
npm run remove:dev
npm run remove:prod
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) is triggered on push to `develop` or `main`.

```
push to develop / main
         │
         ├─► lint        (ESLint + tsc --noEmit)
         ├─► test        (Jest unit tests + coverage)
         ├─► security    (npm audit --audit-level=high)
         └─► deploy      ──► dev  (develop branch)
                          └─► prod (main branch)
                                │
                                └─► integration-tests (dev only)
```

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS credentials for deployment |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for deployment |
| `DEV_API_URL` | Dev API base URL (for integration tests) |
| `DEV_API_KEY` | Dev API key (for integration tests) |

## Environment Variables

| Variable | Description | Set By |
|---|---|---|
| `TASKS_TABLE` | DynamoDB table name | Serverless Framework (CloudFormation ref) |
| `API_URL` | API base URL for integration tests | Manual / GitHub Secret |
| `API_KEY` | API Gateway key for integration tests | Manual / GitHub Secret |
| `AWS_ACCESS_KEY_ID` | AWS credentials | GitHub Secret |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials | GitHub Secret |

## Contributing

1. Fork the repository and create a branch from `develop`
2. Make your changes following the existing code style
3. Run the full validation suite before pushing:
   ```bash
   npm run validate
   ```
4. Push your branch — the pre-push hook will run automatically
5. Open a Pull Request targeting `develop`

The pre-push hook and CI pipeline enforce:

- No ESLint errors
- TypeScript compiles without errors
- All unit tests pass
- No high-severity npm vulnerabilities
- Serverless package builds successfully
