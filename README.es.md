# Task Manager API

API REST serverless para gestión de tareas construida con AWS Lambda, API Gateway y DynamoDB usando Serverless Framework y TypeScript.

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Prerrequisitos](#prerrequisitos)
- [Inicio Rápido](#inicio-rápido)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Referencia de la API](#referencia-de-la-api)
- [Modelo de Datos](#modelo-de-datos)
- [Configuración](#configuración)
- [Pruebas](#pruebas)
- [Despliegue](#despliegue)
- [Pipeline de CI/CD](#pipeline-de-cicd)
- [Variables de Entorno](#variables-de-entorno)
- [Contribuir](#contribuir)

## Descripción General

`task-manager-api` es una API serverless lista para producción que permite crear, leer, actualizar y eliminar tareas. Aprovecha los servicios administrados de AWS para ofrecer una solución escalable y de bajo mantenimiento con autenticación integrada mediante API keys.

Características principales:

- Operaciones CRUD completas para gestión de tareas
- Autenticación con API key y planes de uso con límites de tasa
- Ambientes de despliegue separados: `dev` y `prod`
- Compuertas de calidad automatizadas: linting, verificación de tipos, pruebas unitarias y auditorías de seguridad
- Hooks de pre-push para evitar que código con problemas llegue al repositorio
- Pipeline de CI/CD con GitHub Actions para despliegues automatizados

## Arquitectura

```
Cliente
  │
  ▼
API Gateway (REST API + Autenticación con API Key)
  │
  ├── POST   /tasks          ──► Lambda: createTask
  ├── GET    /tasks          ──► Lambda: listTasks
  ├── GET    /tasks/{id}     ──► Lambda: getTask
  ├── PUT    /tasks/{id}     ──► Lambda: updateTask
  └── DELETE /tasks/{id}     ──► Lambda: deleteTask
                                       │
                                       ▼
                                  Tabla DynamoDB
                              (task-manager-api-{stage}-tasks)
```

Cada función Lambda se empaqueta individualmente con esbuild y tiene su propio rol IAM siguiendo el principio de mínimo privilegio.

## Stack Tecnológico

| Categoría | Tecnología |
|---|---|
| Runtime | Node.js 20.x |
| Lenguaje | TypeScript 5.5 |
| Framework | Serverless Framework v3 |
| Cómputo | AWS Lambda |
| Capa de API | AWS API Gateway (REST) |
| Base de datos | AWS DynamoDB (PAY_PER_REQUEST) |
| Bundler | esbuild via serverless-esbuild |
| Pruebas | Jest 29 + ts-jest |
| Linting | ESLint 9 + @typescript-eslint |
| CI/CD | GitHub Actions |

## Prerrequisitos

- [Node.js](https://nodejs.org/) >= 20.x
- [npm](https://www.npmjs.com/) >= 10.x
- [AWS CLI](https://aws.amazon.com/cli/) configurado con credenciales válidas
- [Serverless Framework](https://www.serverless.com/) v3 instalado globalmente (opcional, disponible vía npx)

```bash
npm install -g serverless
aws configure
```

## Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd challenge-guru
```

### 2. Instalar dependencias

```bash
npm install
```

> El script `prepare` configura automáticamente la ruta de los hooks de Git a `.githooks/`, habilitando el hook de validación pre-push.

### 3. Ejecutar pruebas localmente

```bash
# Pruebas unitarias con cobertura
npm test

# Pruebas de integración (requiere un ambiente dev desplegado)
API_URL=<url-api-dev> API_KEY=<api-key-dev> npm run test:integration
```

### 4. Desplegar a dev

```bash
npm run deploy:dev
```

## Estructura del Proyecto

```
challenge-guru/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Pipeline CI/CD de GitHub Actions
├── .githooks/
│   └── pre-push                # Hook de validación pre-push
├── functions/                  # Definiciones de funciones Serverless (YAML)
│   ├── createTask.yml
│   ├── listTasks.yml
│   ├── getTask.yml
│   ├── updateTask.yml
│   └── deleteTask.yml
├── resources/
│   └── dynamodb.yml            # Recurso CloudFormation para DynamoDB
├── scripts/
│   ├── deploy.sh               # Script de despliegue manual
│   └── validate.sh             # Script de validación de calidad
├── src/
│   ├── handlers/               # Implementaciones de los handlers Lambda
│   │   ├── createTask.ts
│   │   ├── listTasks.ts
│   │   ├── getTask.ts
│   │   ├── updateTask.ts
│   │   └── deleteTask.ts
│   ├── types/
│   │   └── task.ts             # Interfaces y enums de TypeScript
│   └── utils/
│       ├── dynamodb.ts         # Cliente DynamoDB y nombre de tabla
│       └── response.ts         # Helpers de respuestas HTTP
├── tests/
│   ├── handlers/               # Pruebas unitarias de los handlers
│   ├── utils/                  # Pruebas unitarias de utilidades
│   ├── integration/            # Pruebas de integración end-to-end
│   └── helpers/
│       └── event.ts            # Fábrica de eventos mock de API Gateway
├── eslint.config.mjs           # Configuración ESLint (flat config)
├── jest.config.js              # Configuración Jest para pruebas unitarias
├── jest.integration.config.js  # Configuración Jest para pruebas de integración
├── serverless.yml              # Configuración principal de Serverless Framework
├── tsconfig.json               # Opciones del compilador TypeScript
└── package.json
```

## Referencia de la API

Todos los endpoints son **privados** y requieren el header `x-api-key`.

### URL Base

```
https://<api-id>.execute-api.us-east-1.amazonaws.com/{stage}
```

### Autenticación

Incluir la API key en cada solicitud:

```
x-api-key: <tu-api-key>
```

---

### Crear una Tarea

```
POST /tasks
```

**Cuerpo de la solicitud:**

```json
{
  "title": "Diseñar esquema de base de datos",
  "description": "Definir tablas, índices y relaciones",
  "status": "pending",
  "priority": "high"
}
```

| Campo | Tipo | Requerido | Valor por defecto |
|---|---|---|---|
| `title` | string | Sí | — |
| `description` | string | No | `""` |
| `status` | `pending` \| `in_progress` \| `completed` | No | `"pending"` |
| `priority` | `low` \| `medium` \| `high` | No | `"medium"` |

**Respuesta `201 Created`:**

```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Diseñar esquema de base de datos",
  "description": "Definir tablas, índices y relaciones",
  "status": "pending",
  "priority": "high",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Listar Todas las Tareas

```
GET /tasks
```

**Respuesta `200 OK`:**

```json
[
  {
    "taskId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Diseñar esquema de base de datos",
    "status": "pending",
    "priority": "high",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### Obtener una Tarea

```
GET /tasks/{id}
```

**Respuesta `200 OK`:** Objeto tarea (ver arriba)

**Respuesta `404 Not Found`:**

```json
{ "error": "Task not found" }
```

---

### Actualizar una Tarea

```
PUT /tasks/{id}
```

**Cuerpo de la solicitud** (todos los campos son opcionales):

```json
{
  "title": "Título actualizado",
  "status": "in_progress",
  "priority": "low"
}
```

**Respuesta `200 OK`:** Atributos actualizados de la tarea

**Respuesta `404 Not Found`:**

```json
{ "error": "Task not found" }
```

---

### Eliminar una Tarea

```
DELETE /tasks/{id}
```

**Respuesta `200 OK`:**

```json
{ "message": "Task deleted successfully" }
```

**Respuesta `404 Not Found`:**

```json
{ "error": "Task not found" }
```

---

### Respuestas de Error

| Código de Estado | Descripción |
|---|---|
| `400 Bad Request` | Campos requeridos faltantes (ej: `title`) |
| `404 Not Found` | Tarea con el ID especificado no existe |
| `500 Internal Server Error` | Error inesperado del servidor |

## Modelo de Datos

### Tarea (Task)

```typescript
interface Task {
  taskId: string;        // UUID v4, generado automáticamente
  title: string;         // Requerido
  description: string;   // Opcional, default ""
  status: Status;        // "pending" | "in_progress" | "completed"
  priority: Priority;    // "low" | "medium" | "high"
  createdAt: string;     // Timestamp ISO 8601
  updatedAt: string;     // Timestamp ISO 8601, actualizado en cada PUT
}
```

### Tabla DynamoDB

| Atributo | Tipo | Rol |
|---|---|---|
| `taskId` | String | Partition Key |

- **Modo de facturación:** PAY_PER_REQUEST (bajo demanda)
- **Nombre de la tabla:** `task-manager-api-{stage}-tasks`

## Configuración

### Ambientes (Stages)

La API soporta dos ambientes de despliegue:

| Stage | Rama | Descripción |
|---|---|---|
| `dev` | `develop` | Desarrollo y pruebas de integración |
| `prod` | `main` | Ambiente de producción |

### Plan de Uso de API Gateway

| Configuración | Valor |
|---|---|
| Cuota diaria | 100 solicitudes |
| Límite de burst | 3 solicitudes |
| Límite de tasa | 3 solicitudes/seg |

### Empaquetado con esbuild

- **Bundle:** habilitado (tree-shaking, inclusión de dependencias)
- **Minify:** deshabilitado (facilita el debugging en Lambda)
- **Source maps:** habilitados
- **Target:** node20
- **Excluidos:** `@aws-sdk/*` (provistos por el runtime de Lambda)

## Pruebas

### Pruebas Unitarias

```bash
npm test
```

Ejecuta todas las pruebas unitarias en `tests/` (excluyendo integración) con Jest y genera un reporte de cobertura en `coverage/`.

```bash
# Modo watch durante el desarrollo
npm test -- --watch
```

### Pruebas de Integración

Las pruebas de integración se ejecutan contra un ambiente desplegado. Requiere que el stage `dev` esté desplegado.

```bash
export API_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/dev
export API_KEY=<tu-api-key>

npm run test:integration
```

### Linting y Verificación de Tipos

```bash
# ESLint
npm run lint

# Verificación de tipos TypeScript (sin emitir)
npm run typecheck
```

### Auditoría de Seguridad

```bash
npm audit --audit-level=high --omit=dev
```

## Despliegue

### Automatizado (vía CI/CD)

Push a `develop` → despliega a `dev`
Push a `main` → despliega a `prod`

### Manual

Usar el script de despliegue para un despliegue con compuertas de calidad completas:

```bash
# Desplegar a dev
./scripts/deploy.sh dev

# Desplegar a prod
./scripts/deploy.sh prod
```

El script ejecuta estos pasos en orden:

1. ESLint
2. Verificación de tipos TypeScript
3. Pruebas unitarias
4. Auditoría de seguridad
5. Serverless package
6. Serverless deploy
7. Pruebas de integración (solo en dev)

### CLI de Serverless

```bash
# Desplegar
npm run deploy:dev
npm run deploy:prod

# Eliminar stack
npm run remove:dev
npm run remove:prod
```

## Pipeline de CI/CD

El workflow de GitHub Actions (`.github/workflows/deploy.yml`) se activa en push a `develop` o `main`.

```
push a develop / main
         │
         ├─► lint        (ESLint + tsc --noEmit)
         ├─► test        (Pruebas unitarias Jest + cobertura)
         ├─► security    (npm audit --audit-level=high)
         └─► deploy      ──► dev  (rama develop)
                          └─► prod (rama main)
                                │
                                └─► integration-tests (solo dev)
```

### Secrets Requeridos en GitHub

| Secret | Descripción |
|---|---|
| `AWS_ACCESS_KEY_ID` | Credenciales AWS para despliegue |
| `AWS_SECRET_ACCESS_KEY` | Credenciales AWS para despliegue |
| `DEV_API_URL` | URL base de la API en dev (para pruebas de integración) |
| `DEV_API_KEY` | API key de dev (para pruebas de integración) |

## Variables de Entorno

| Variable | Descripción | Establecida por |
|---|---|---|
| `TASKS_TABLE` | Nombre de la tabla DynamoDB | Serverless Framework (ref CloudFormation) |
| `API_URL` | URL base de la API para pruebas de integración | Manual / GitHub Secret |
| `API_KEY` | API key de API Gateway para pruebas de integración | Manual / GitHub Secret |
| `AWS_ACCESS_KEY_ID` | Credenciales AWS | GitHub Secret |
| `AWS_SECRET_ACCESS_KEY` | Credenciales AWS | GitHub Secret |

## Contribuir

1. Hacer fork del repositorio y crear una rama desde `develop`
2. Realizar los cambios siguiendo el estilo de código existente
3. Ejecutar la suite de validación completa antes de hacer push:
   ```bash
   npm run validate
   ```
4. Hacer push de la rama — el hook pre-push se ejecutará automáticamente
5. Abrir un Pull Request apuntando a `develop`

El hook pre-push y el pipeline de CI garantizan que:

- No existan errores de ESLint
- TypeScript compile sin errores
- Todas las pruebas unitarias pasen
- No haya vulnerabilidades de alta severidad en npm
- El paquete de Serverless se construya correctamente
