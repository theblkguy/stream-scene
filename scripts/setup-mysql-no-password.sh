#!/bin/bash
# Script to configure MySQL for passwordless root access (for local testing only)

echo "⚠️  WARNING: This will configure MySQL to allow passwordless root access."
echo "This is ONLY recommended for local development/testing environments!"
echo ""
read -p "Continue? (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Configuring MySQL for passwordless root access..."

# Use sudo mysql to run commands as root
sudo mysql << EOF
-- Create database
CREATE DATABASE IF NOT EXISTS streamscene_test;

-- Option 1: Set root password to empty (not recommended but works)
-- ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
-- FLUSH PRIVILEGES;

-- Option 2: Create a test user without password (better)
CREATE USER IF NOT EXISTS 'testuser'@'localhost' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON streamscene_test.* TO 'testuser'@'localhost';
FLUSH PRIVILEGES;

-- Show databases
SHOW DATABASES LIKE 'streamscene_test';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test database 'streamscene_test' created successfully!"
    echo ""
    echo "✅ Test user 'testuser' created with no password"
    echo ""
    echo "Next steps:"
    echo "1. Update .env.test with:"
    echo "   DB_USER=testuser"
    echo "   DB_PASS="
    echo ""
    echo "2. Run: npm run test:setup init"
    echo "3. Run: npm test"
else
    echo ""
    echo "❌ Failed to configure MySQL"
    echo "You may need to run this script with sudo or configure MySQL manually"
fi


