# Task/Notes API - Cloudflare Worker

This directory contains the Cloudflare Worker that powers the Task Manager API using Cloudflare D1 (SQLite database at the edge).

## Deployed Worker

**URL:** `https://task-notes-api.sghangaan.workers.dev`

## Files

- `index.js` - Main worker code handling CRUD operations
- `wrangler.toml` - Cloudflare Worker configuration with D1 binding
- `schema.sql` - Database schema and sample data

## D1 Database Binding

The worker uses Cloudflare D1 through the `DB` binding configured in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "tasks-db"
database_id = "YOUR_D1_DATABASE_ID_HERE"
```

## Database Schema

### Tasks Table

```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME
);
```

**Status Values:** `pending`, `in-progress`, `completed`
**Priority Values:** `low`, `medium`, `high`

## API Endpoints

### GET /api/tasks
List all tasks with optional filtering

**Query Parameters:**
- `status` - Filter by status (pending, in-progress, completed)
- `priority` - Filter by priority (low, medium, high)

**Example:**
```bash
GET /api/tasks?status=pending&priority=high
```

**Response:**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Learn Cloudflare Workers",
      "description": "Complete the tutorial",
      "status": "pending",
      "priority": "high",
      "created_at": "2024-03-01T12:00:00Z",
      "updated_at": "2024-03-01T12:00:00Z",
      "due_date": "2024-03-05T00:00:00Z"
    }
  ],
  "count": 1
}
```

### GET /api/tasks/:id
Get a single task by ID

**Response:**
```json
{
  "task": {
    "id": 1,
    "title": "Learn Cloudflare Workers",
    ...
  }
}
```

### POST /api/tasks
Create a new task

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "pending",
  "priority": "medium",
  "due_date": "2024-03-10"
}
```

**Response:**
```json
{
  "message": "Task created successfully",
  "task": { ... }
}
```

### PUT /api/tasks/:id
Update an existing task

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "completed"
}
```

**Response:**
```json
{
  "message": "Task updated successfully",
  "task": { ... }
}
```

### DELETE /api/tasks/:id
Delete a task

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

## Setup Instructions

### 1. Configure Wrangler

Copy the example configuration file and add your credentials:

```bash
cd workers/task-api
cp wrangler.jsonc.example wrangler.jsonc
```

**Important:** The `wrangler.jsonc` file is gitignored to keep your database IDs private. Never commit this file to a public repository.

### 2. Create D1 Database

```bash
wrangler d1 create tasks-db
```

This will output a database ID. Update `wrangler.jsonc` with your new database ID:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "tasks-db",
      "database_id": "your-actual-database-id-here"
    }
  ]
}
```

### 3. Run Database Migrations

```bash
# Apply schema
wrangler d1 execute tasks-db --file=./schema.sql

# Or for local development
wrangler d1 execute tasks-db --local --file=./schema.sql
```

### 4. Deploy Worker

```bash
wrangler deploy
```

## Local Development

```bash
# Run locally with local D1 database
wrangler dev

# Execute SQL queries locally
wrangler d1 execute tasks-db --local --command="SELECT * FROM tasks"
```

## Database Operations

### Execute SQL Commands

```bash
# List all tasks
wrangler d1 execute tasks-db --command="SELECT * FROM tasks"

# Add a task manually
wrangler d1 execute tasks-db --command="INSERT INTO tasks (title, priority) VALUES ('Test Task', 'high')"

# Clear all tasks
wrangler d1 execute tasks-db --command="DELETE FROM tasks"
```

### Backup and Export

```bash
# Export database
wrangler d1 export tasks-db --output=backup.sql

# Import database
wrangler d1 execute tasks-db --file=backup.sql
```

## Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ SQLite database at the edge (Cloudflare D1)
- ✅ Filtering by status and priority
- ✅ Task metadata (created_at, updated_at, due_date)
- ✅ RESTful API design
- ✅ CORS enabled
- ✅ Global distribution with low latency

## Data Model

Each task includes:
- **id**: Auto-incrementing unique identifier
- **title**: Task title (required)
- **description**: Detailed description (optional)
- **status**: Current status (pending/in-progress/completed)
- **priority**: Task priority (low/medium/high)
- **created_at**: Timestamp when task was created
- **updated_at**: Timestamp when task was last modified
- **due_date**: Optional deadline for the task

## Performance Notes

- D1 is SQLite running on Cloudflare's global network
- Queries are executed at the edge, close to users
- Read operations are fast (cached at edge locations)
- Write operations are propagated globally
- Suitable for applications with moderate write volume

## Migration from Other Databases

To migrate from another database:

1. Export your data to SQL format
2. Modify the schema if needed to match D1's SQLite syntax
3. Use `wrangler d1 execute` to import the data
4. Update your worker configuration with the new database ID

## Troubleshooting

**Database not found:**
- Ensure `wrangler.jsonc` has the correct `database_id`
- Run `wrangler d1 list` to see all databases
- Make sure you copied `wrangler.jsonc.example` to `wrangler.jsonc`

**Schema errors:**
- Check SQL syntax is compatible with SQLite
- Ensure schema.sql is properly formatted

**CORS errors:**
- Worker includes CORS headers by default
- Check browser console for specific CORS issues
