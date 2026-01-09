#!/bin/bash
# Script to create test database (no password version)

echo "Creating test database 'streamscene_test'..."
echo ""

# Create database without password
mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS streamscene_test;
SHOW DATABASES LIKE 'streamscene_test';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test database 'streamscene_test' created successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Make sure .env.test has DB_PASS= (empty password)"
    echo "2. Run: npm run test:setup init"
    echo "3. Run: npm test"
else
    echo ""
    echo "❌ Failed to create test database"
    echo "Make sure MySQL is running and root user has no password set"
    echo ""
    echo "If you get an access denied error, you may need to:"
    echo "  - Set a password for root: sudo mysqladmin -u root password"
    echo "  - Or configure MySQL to allow passwordless root access"
fi

