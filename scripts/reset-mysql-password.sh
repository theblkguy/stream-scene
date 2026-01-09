#!/bin/bash
# Script to reset MySQL root password (last resort solution)

echo "⚠️  MySQL Root Password Reset Script"
echo "===================================="
echo ""
echo "This script will help you reset MySQL root password."
echo "You'll need to stop MySQL, start it in safe mode, reset password, then restart."
echo ""

read -p "Do you want to proceed? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Step 1: Stopping MySQL..."
sudo systemctl stop mysql || sudo service mysql stop

echo ""
echo "Step 2: Starting MySQL in safe mode (skip-grant-tables)..."
echo "⚠️  WARNING: This makes MySQL insecure temporarily!"
echo ""
echo "Run these commands in a NEW terminal window:"
echo ""
echo "  sudo mysqld_safe --skip-grant-tables --skip-networking &"
echo ""
echo "Then in the original terminal, connect and reset password:"
echo "  mysql -u root"
echo "  FLUSH PRIVILEGES;"
echo "  ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';"
echo "  CREATE DATABASE IF NOT EXISTS streamscene_test;"
echo "  CREATE USER 'testuser'@'localhost' IDENTIFIED BY '';"
echo "  GRANT ALL PRIVILEGES ON streamscene_test.* TO 'testuser'@'localhost';"
echo "  FLUSH PRIVILEGES;"
echo "  exit;"
echo ""
echo "Then kill the safe mode MySQL and restart normally:"
echo "  sudo pkill mysqld"
echo "  sudo systemctl start mysql"
echo ""
echo "Or use the automated script below..."

read -p "Run automated reset? (y/N): " auto
if [ "$auto" = "y" ] || [ "$auto" = "Y" ]; then
    echo ""
    echo "⚠️  Automated reset starting..."
    echo "This will stop MySQL temporarily."
    
    sudo systemctl stop mysql
    
    echo "Starting MySQL in safe mode..."
    sudo mysqld_safe --skip-grant-tables --skip-networking &
    sleep 5
    
    echo "Resetting root password..."
    mysql -u root << MYSQL_SCRIPT
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
CREATE DATABASE IF NOT EXISTS streamscene_test;
CREATE USER IF NOT EXISTS 'testuser'@'localhost' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON streamscene_test.* TO 'testuser'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

    echo "Stopping safe mode MySQL..."
    sudo pkill mysqld
    sleep 2
    
    echo "Starting MySQL normally..."
    sudo systemctl start mysql
    
    echo ""
    echo "✅ Done! Try connecting now:"
    echo "  mysql -u testuser"
    echo ""
    echo "Update .env.test:"
    echo "  DB_USER=testuser"
    echo "  DB_PASS="
fi

