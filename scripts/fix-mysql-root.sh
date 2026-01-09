#!/bin/bash
# Script to configure MySQL root user for passwordless access

echo "Attempting to configure MySQL for passwordless root access..."
echo ""

# Try method 1: Direct access via sudo mysql (no user specified)
echo "Method 1: Using sudo mysql (system root)"
sudo mysql << 'MYSQL_SCRIPT'
CREATE DATABASE IF NOT EXISTS streamscene_test;
ALTER USER 'root'@'localhost' IDENTIFIED WITH auth_socket;
FLUSH PRIVILEGES;
SHOW DATABASES LIKE 'streamscene_test';
MYSQL_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Database created using auth_socket"
    echo ""
    echo "Update .env.test with:"
    echo "  DB_USER=root"
    echo "  DB_PASS="
    exit 0
fi

# Try method 2: Create test user
echo ""
echo "Method 2: Creating testuser with no password"
sudo mysql << 'MYSQL_SCRIPT'
CREATE DATABASE IF NOT EXISTS streamscene_test;
CREATE USER IF NOT EXISTS 'testuser'@'localhost';
GRANT ALL PRIVILEGES ON streamscene_test.* TO 'testuser'@'localhost';
FLUSH PRIVILEGES;
SHOW DATABASES LIKE 'streamscene_test';
MYSQL_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Created testuser"
    echo ""
    echo "Update .env.test with:"
    echo "  DB_USER=testuser"
    echo "  DB_PASS="
    exit 0
fi

echo ""
echo "❌ Failed to configure MySQL"
echo ""
echo "Manual steps:"
echo "1. Connect to MySQL: sudo mysql"
echo "2. Run these commands:"
echo "   CREATE DATABASE IF NOT EXISTS streamscene_test;"
echo "   CREATE USER IF NOT EXISTS 'testuser'@'localhost';"
echo "   GRANT ALL PRIVILEGES ON streamscene_test.* TO 'testuser'@'localhost';"
echo "   FLUSH PRIVILEGES;"
echo "   exit;"
echo "3. Update .env.test: DB_USER=testuser, DB_PASS="


