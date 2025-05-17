-- Initialize the entire math e-learning database structure
CREATE SCHEMA IF NOT EXISTS learn;
SET search_path TO learn;

-- Create ENUM types
CREATE TYPE content_type AS ENUM ('markdown', 'question', 'video');
CREATE TYPE question_format AS ENUM ('multiple_choice', 'short_answer');
CREATE TYPE auth_provider AS ENUM ('email', 'google', 'github', 'apple', 'microsoft');

CREATE TYPE content_type AS ENUM ('markdown', 'question', 'video');
CREATE TYPE question_format AS ENUM ('multiple_choice', 'short_answer');

-- Users table with authentication support
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20) UNIQUE,
    phone_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- User authentication providers (for external auth)
CREATE TABLE user_auth_providers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider auth_provider NOT NULL,
    provider_id VARCHAR(255) NOT NULL,  -- Unique ID from provider
    provider_email VARCHAR(255),
    provider_data JSONB,  -- Additional provider-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider, provider_id)
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Course creators (users with edit access to specific courses)
CREATE TABLE course_creators (
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    can_edit BOOLEAN DEFAULT TRUE,
    can_publish BOOLEAN DEFAULT FALSE,
    can_manage_users BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (course_id, user_id)
);

-- Course students (users who have participated in courses)
CREATE TABLE course_students (
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    progress INTEGER DEFAULT 0,  -- 0-100 percentage
    last_accessed TIMESTAMP,
    PRIMARY KEY (course_id, user_id)
);

-- System administrators (global admins)
CREATE TABLE system_admins (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Course-Tags junction table
CREATE TABLE course_tags (
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, tag_id)
);

-- Chapters (Units) table
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lessons table
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson Contents table
CREATE TABLE lesson_contents (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    content_type content_type NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Markdown Contents table
CREATE TABLE markdown_contents (
    content_id INTEGER PRIMARY KEY REFERENCES lesson_contents(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    format VARCHAR(20) NOT NULL
);

-- Questions table
CREATE TABLE questions (
    content_id INTEGER PRIMARY KEY REFERENCES lesson_contents(id) ON DELETE CASCADE,
    question_format question_format NOT NULL,
    question_text TEXT NOT NULL,
    explanation TEXT,
    visualization BOOLEAN DEFAULT FALSE
);

-- Question Options table
CREATE TABLE question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(content_id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    sort_order INTEGER
);

-- Short Answer Questions table
CREATE TABLE short_answer_questions (
    question_id INTEGER PRIMARY KEY REFERENCES questions(content_id) ON DELETE CASCADE,
    correct_answer TEXT NOT NULL
);

-- Insert sample data
INSERT INTO courses (title, description, image_url) VALUES
('Foundational Algebra', 'Master core algebraic concepts', '/assets/algebra.jpeg');

INSERT INTO tags (name) VALUES 
('algebra'), ('math'), ('beginner');

INSERT INTO course_tags (course_id, tag_id) VALUES
(1, 1), (1, 2), (1, 3);

INSERT INTO chapters (course_id, title, description, image_url, sort_order) VALUES
(1, 'Variables & Expressions', 'Introduction to algebraic variables', '/images/algebra-variables.jpg', 1);

INSERT INTO lessons (chapter_id, course_id, title, description, sort_order) VALUES
(1, 1, 'Algebraic Variables', 'Understanding variables in algebra', 1);

-- Insert lesson content
WITH content AS (
  INSERT INTO lesson_contents (lesson_id, content_type, sort_order)
  VALUES (1, 'markdown', 1) RETURNING id
)
INSERT INTO markdown_contents (content_id, text, format)

SELECT id, 'In algebra, variables (like $x$ or $y$) represent unknown values...', 'latex'
FROM content;

WITH content AS (
  INSERT INTO lesson_contents (lesson_id, content_type, sort_order)
  VALUES (1, 'question', 2) RETURNING id
),
q AS (
  INSERT INTO questions (content_id, question_format, question_text, explanation)
  SELECT id, 'multiple_choice', 'What does $3x + 2x$ simplify to when $x=4$?', 'Combine like terms: $3x + 2x = 5x$. When $x=4$, $5x = 20$.'
  FROM content RETURNING content_id
)
INSERT INTO question_options (question_id, option_text, is_correct, sort_order)
VALUES 
((SELECT content_id FROM q), '20', TRUE, 1),
((SELECT content_id FROM q), '24', FALSE, 2),
((SELECT content_id FROM q), '80', FALSE, 3),
((SELECT content_id FROM q), '16', FALSE, 4);

COMMIT;

-- Create indexes for performance
CREATE INDEX idx_course_tags_course ON course_tags(course_id);
CREATE INDEX idx_course_tags_tag ON course_tags(tag_id);
CREATE INDEX idx_chapters_course ON chapters(course_id);
CREATE INDEX idx_lessons_chapter ON lessons(chapter_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_contents_lesson ON lesson_contents(lesson_id);