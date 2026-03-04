"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import "./tasks.css";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  due_date: string | null;
}

export default function TasksAPI() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Deployed Cloudflare Worker URL
  const API_URL = process.env.NEXT_PUBLIC_TASK_API!;

  useEffect(() => {
    loadTasks();
  }, [filterStatus, filterPriority]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/tasks?`;
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterPriority) url += `priority=${filterPriority}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load tasks');

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const task = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        due_date: dueDate || null
      };

      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });

      if (!response.ok) throw new Error('Failed to create task');

      // Reset form
      setTitle('');
      setDescription('');
      setStatus('pending');
      setPriority('medium');
      setDueDate('');

      // Reload tasks
      loadTasks();
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete task');

      loadTasks();
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  const completeTask = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      if (!response.ok) throw new Error('Failed to update task');

      loadTasks();
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError('Failed to update task. Please try again.');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="tasks-page">
      <div className="tasks-container">
        {/* Header */}
        <header className="tasks-header">
          <h1>📝 Task Manager</h1>
          <p>Powered by <span className="badge">Cloudflare Workers + D1</span></p>
        </header>

        {/* Add Task Form */}
        <div className="add-task-card">
          <h2>Add New Task</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Task'}
            </button>
          </form>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button onClick={loadTasks} className="btn-secondary">
            Refresh
          </button>
        </div>

        {/* Tasks List */}
        <div className="tasks-list-card">
          <h2>Tasks</h2>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No tasks found</h3>
              <p>Create your first task above!</p>
            </div>
          ) : (
            <div>
              {tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <div className="task-title">{task.title}</div>
                    <div className="task-actions">
                      {task.status !== 'completed' && (
                        <button
                          className="btn-small btn-complete"
                          onClick={() => completeTask(task.id)}
                        >
                          ✓ Complete
                        </button>
                      )}
                      <button
                        className="btn-small btn-delete"
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <div className="task-description">{task.description}</div>
                  )}
                  <div className="task-meta">
                    <span className={`status-badge status-${task.status}`}>
                      {task.status}
                    </span>
                    <span className={`status-badge priority-${task.priority}`}>
                      {task.priority} priority
                    </span>
                    {task.due_date && (
                      <span className="date-meta">Due: {formatDate(task.due_date)}</span>
                    )}
                    <span className="date-meta">
                      Created: {formatDate(task.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
