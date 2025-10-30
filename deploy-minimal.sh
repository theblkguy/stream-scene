#!/bin/bash
# Emergency minimal deployment script

echo "🚀 Creating emergency lightweight deployment..."

# Create minimal package
mkdir -p emergency-deploy
cp -r dist/ emergency-deploy/
cp ecosystem.config.cjs emergency-deploy/
cp package-server.json emergency-deploy/package.json

# Create tiny client bundle (just index.html)
mkdir -p emergency-deploy/public
cp public/index.html emergency-deploy/public/

# Create minimal tar (should be under 5MB)
cd emergency-deploy
tar -czf ../emergency-streamscene.tar.gz .
cd ..

echo "📦 Emergency package size: $(ls -lh emergency-streamscene.tar.gz)"
echo "🆙 Upload this file manually via SCP or server file manager"
echo "📁 Extract to: /var/www/stream-scene/"