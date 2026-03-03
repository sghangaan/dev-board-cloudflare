/**
 * Task/Notes API - Cloudflare Workers + D1 Database
 * Full CRUD API for managing tasks
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling
    try {
      // Serve frontend HTML
      if (path === '/' || path === '/index.html') {
        return new Response(HTML_TEMPLATE, {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // API Routes
      if (path.startsWith('/api/tasks')) {
        return await handleTasksAPI(request, env, path, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);

    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({ error: error.message }, 500, corsHeaders);
    }
  },
};

/**
 * Handle all /api/tasks routes
 */
async function handleTasksAPI(request, env, path, corsHeaders) {
  const method = request.method;

  // GET /api/tasks - List all tasks
  if (path === '/api/tasks' && method === 'GET') {
    return await getAllTasks(env, request.url, corsHeaders);
  }

  // GET /api/tasks/:id - Get single task
  if (path.match(/^\/api\/tasks\/\d+$/) && method === 'GET') {
    const id = parseInt(path.split('/')[3]);
    return await getTask(env, id, corsHeaders);
  }

  // POST /api/tasks - Create new task
  if (path === '/api/tasks' && method === 'POST') {
    const body = await request.json();
    return await createTask(env, body, corsHeaders);
  }

  // PUT /api/tasks/:id - Update task
  if (path.match(/^\/api\/tasks\/\d+$/) && method === 'PUT') {
    const id = parseInt(path.split('/')[3]);
    const body = await request.json();
    return await updateTask(env, id, body, corsHeaders);
  }

  // DELETE /api/tasks/:id - Delete task
  if (path.match(/^\/api\/tasks\/\d+$/) && method === 'DELETE') {
    const id = parseInt(path.split('/')[3]);
    return await deleteTask(env, id, corsHeaders);
  }

  return jsonResponse({ error: 'Invalid route' }, 404, corsHeaders);
}

/**
 * Get all tasks with optional filtering
 */
async function getAllTasks(env, url, corsHeaders) {
  const urlObj = new URL(url);
  const status = urlObj.searchParams.get('status');
  const priority = urlObj.searchParams.get('priority');

  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }

  query += ' ORDER BY created_at DESC';

  const { results } = await env.DB.prepare(query).bind(...params).all();

  return jsonResponse({
    tasks: results,
    count: results.length
  }, 200, corsHeaders);
}

/**
 * Get single task by ID
 */
async function getTask(env, id, corsHeaders) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(id).all();

  if (results.length === 0) {
    return jsonResponse({ error: 'Task not found' }, 404, corsHeaders);
  }

  return jsonResponse({ task: results[0] }, 200, corsHeaders);
}

/**
 * Create new task
 */
async function createTask(env, data, corsHeaders) {
  const { title, description, status, priority, due_date } = data;

  if (!title) {
    return jsonResponse({ error: 'Title is required' }, 400, corsHeaders);
  }

  const result = await env.DB.prepare(`
    INSERT INTO tasks (title, description, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    title,
    description || null,
    status || 'pending',
    priority || 'medium',
    due_date || null
  ).run();

  // Get the created task
  const { results } = await env.DB.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(result.meta.last_row_id).all();

  return jsonResponse({
    message: 'Task created successfully',
    task: results[0]
  }, 201, corsHeaders);
}

/**
 * Update existing task
 */
async function updateTask(env, id, data, corsHeaders) {
  // Check if task exists
  const { results: existing } = await env.DB.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(id).all();

  if (existing.length === 0) {
    return jsonResponse({ error: 'Task not found' }, 404, corsHeaders);
  }

  const { title, description, status, priority, due_date } = data;

  await env.DB.prepare(`
    UPDATE tasks
    SET title = ?,
        description = ?,
        status = ?,
        priority = ?,
        due_date = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    title || existing[0].title,
    description !== undefined ? description : existing[0].description,
    status || existing[0].status,
    priority || existing[0].priority,
    due_date !== undefined ? due_date : existing[0].due_date,
    id
  ).run();

  // Get updated task
  const { results } = await env.DB.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(id).all();

  return jsonResponse({
    message: 'Task updated successfully',
    task: results[0]
  }, 200, corsHeaders);
}

/**
 * Delete task
 */
async function deleteTask(env, id, corsHeaders) {
  const result = await env.DB.prepare(
    'DELETE FROM tasks WHERE id = ?'
  ).bind(id).run();

  if (result.meta.changes === 0) {
    return jsonResponse({ error: 'Task not found' }, 404, corsHeaders);
  }

  return jsonResponse({
    message: 'Task deleted successfully'
  }, 200, corsHeaders);
}

/**
 * Helper: JSON response
 */
function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
  });
}

/**
 * Embedded HTML Frontend
 */
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Manager - Cloudflare D1</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
        }

        header {
            background: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        h1 {
            color: #333;
            margin-bottom: 10px;
        }

        .badge {
            display: inline-block;
            padding: 5px 15px;
            background: #667eea;
            color: white;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 600;
        }

        .add-task {
            background: white;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .form-group {
            margin-bottom: 15px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: 500;
        }

        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
        }

        textarea {
            resize: vertical;
            min-height: 80px;
        }

        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
        }

        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }

        button:hover {
            transform: translateY(-2px);
        }

        .filters {
            background: white;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            display: flex;
            gap: 15px;
            align-items: center;
        }

        .filters select {
            flex: 1;
        }

        .tasks-list {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .task-card {
            border: 2px solid #f0f0f0;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            transition: all 0.3s;
        }

        .task-card:hover {
            border-color: #667eea;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
        }

        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 10px;
        }

        .task-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }

        .task-actions {
            display: flex;
            gap: 8px;
        }

        .btn-small {
            padding: 6px 12px;
            font-size: 12px;
        }

        .btn-delete {
            background: #f44336;
        }

        .btn-complete {
            background: #4CAF50;
        }

        .task-description {
            color: #666;
            margin-bottom: 10px;
        }

        .task-meta {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            font-size: 12px;
        }

        .status-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 600;
        }

        .status-pending {
            background: #fff3cd;
            color: #856404;
        }

        .status-in-progress {
            background: #cfe2ff;
            color: #084298;
        }

        .status-completed {
            background: #d1e7dd;
            color: #0f5132;
        }

        .priority-high {
            background: #f8d7da;
            color: #842029;
        }

        .priority-medium {
            background: #fff3cd;
            color: #856404;
        }

        .priority-low {
            background: #d1e7dd;
            color: #0f5132;
        }

        .empty-state {
            text-align: center;
            padding: 40px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📝 Task Manager</h1>
            <p>Powered by <span class="badge">Cloudflare Workers + D1</span></p>
        </header>

        <div class="add-task">
            <h2 style="margin-bottom: 20px; color: #333;">Add New Task</h2>
            <form id="taskForm">
                <div class="form-group">
                    <label>Title *</label>
                    <input type="text" id="title" required placeholder="Enter task title">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="description" placeholder="Enter task description"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Status</label>
                        <select id="status">
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Priority</label>
                        <select id="priority">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Due Date</label>
                        <input type="date" id="dueDate">
                    </div>
                </div>
                <button type="submit">Add Task</button>
            </form>
        </div>

        <div class="filters">
            <select id="filterStatus" onchange="loadTasks()">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
            </select>
            <select id="filterPriority" onchange="loadTasks()">
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>
            <button onclick="loadTasks()">Refresh</button>
        </div>

        <div class="tasks-list">
            <h2 style="margin-bottom: 20px; color: #333;">Tasks</h2>
            <div id="tasksList"></div>
        </div>
    </div>

    <script>
        // Load tasks on page load
        loadTasks();

        // Form submission
        document.getElementById('taskForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const task = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                status: document.getElementById('status').value,
                priority: document.getElementById('priority').value,
                due_date: document.getElementById('dueDate').value || null
            };

            try {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task)
                });

                if (response.ok) {
                    document.getElementById('taskForm').reset();
                    loadTasks();
                }
            } catch (error) {
                alert('Error creating task');
            }
        });

        // Load tasks
        async function loadTasks() {
            const status = document.getElementById('filterStatus').value;
            const priority = document.getElementById('filterPriority').value;

            let url = '/api/tasks?';
            if (status) url += 'status=' + status + '&';
            if (priority) url += 'priority=' + priority;

            try {
                const response = await fetch(url);
                const data = await response.json();

                renderTasks(data.tasks);
            } catch (error) {
                console.error('Error loading tasks:', error);
            }
        }

        // Render tasks
        function renderTasks(tasks) {
            const container = document.getElementById('tasksList');

            if (tasks.length === 0) {
                container.innerHTML = '<div class="empty-state">No tasks found. Create your first task!</div>';
                return;
            }

            container.innerHTML = tasks.map(task => \`
                <div class="task-card">
                    <div class="task-header">
                        <div class="task-title">\${task.title}</div>
                        <div class="task-actions">
                            \${task.status !== 'completed' ?
                                \`<button class="btn-small btn-complete" onclick="completeTask(\${task.id})">✓ Complete</button>\` :
                                ''
                            }
                            <button class="btn-small btn-delete" onclick="deleteTask(\${task.id})">Delete</button>
                        </div>
                    </div>
                    \${task.description ? \`<div class="task-description">\${task.description}</div>\` : ''}
                    <div class="task-meta">
                        <span class="status-badge status-\${task.status}">\${task.status}</span>
                        <span class="status-badge priority-\${task.priority}">\${task.priority} priority</span>
                        \${task.due_date ? \`<span>Due: \${new Date(task.due_date).toLocaleDateString()}</span>\` : ''}
                        <span>Created: \${new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            \`).join('');
        }

        // Delete task
        async function deleteTask(id) {
            if (!confirm('Are you sure you want to delete this task?')) return;

            try {
                await fetch(\`/api/tasks/\${id}\`, { method: 'DELETE' });
                loadTasks();
            } catch (error) {
                alert('Error deleting task');
            }
        }

        // Complete task
        async function completeTask(id) {
            try {
                await fetch(\`/api/tasks/\${id}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'completed' })
                });
                loadTasks();
            } catch (error) {
                alert('Error updating task');
            }
        }
    </script>
</body>
</html>`;
