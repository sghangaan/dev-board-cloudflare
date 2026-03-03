-- Tasks/Notes Database Schema

DROP TABLE IF EXISTS tasks;

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'completed')),
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME
);

-- Index for faster queries
CREATE INDEX idx_status ON tasks(status);
CREATE INDEX idx_priority ON tasks(priority);
CREATE INDEX idx_created_at ON tasks(created_at DESC);

-- Insert sample data
INSERT INTO tasks (title, description, status, priority, due_date) VALUES
    ('Learn Cloudflare Workers', 'Complete the URL shortener tutorial', 'completed', 'high', '2024-03-01'),
    ('Build Task API', 'Create CRUD API with D1 database', 'in-progress', 'high', '2024-03-05'),
    ('Deploy to Production', 'Deploy the task API to Cloudflare', 'pending', 'medium', '2024-03-10'),
    ('Add Authentication', 'Implement user authentication', 'pending', 'low', NULL);
