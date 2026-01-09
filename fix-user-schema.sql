-- Fix User table schema to match User model
-- Add missing columns for Threads integration and social features

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS threads_access_token VARCHAR(500) NULL AFTER google_id,
ADD COLUMN IF NOT EXISTS threads_user_id VARCHAR(100) NULL AFTER threads_access_token,
ADD COLUMN IF NOT EXISTS username VARCHAR(20) UNIQUE NULL AFTER threads_user_id,
ADD COLUMN IF NOT EXISTS bio TEXT NULL AFTER username,
ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500) NULL AFTER bio,
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) NULL AFTER profile_picture_url,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL AFTER contact_email,
ADD COLUMN IF NOT EXISTS social_links TEXT NULL AFTER phone;

-- Add index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_username ON users(username);