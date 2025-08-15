#!/bin/bash

# Manual deployment script for stream-scene
# Run this script on your server if GitHub Actions fails

echo "🚀 Starting manual deployment..."

# Navigate to app directory
cd /var/www/stream-scene || exit 1

# Install PM2 if not available
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

echo "📋 PM2 version: $(pm2 --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Stop existing processes
echo "🛑 Stopping existing processes..."
pm2 stop stream-scene 2>/dev/null || echo "No existing process found"
pm2 delete stream-scene 2>/dev/null || echo "No existing process to delete"

# Start the application
echo "🎯 Starting application..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Show status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment complete!"
