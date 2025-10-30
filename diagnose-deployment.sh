#!/bin/bash
# Deployment diagnostic script

echo "🔍 StreamScene Deployment Diagnostics"
echo "====================================="

# Check local build size
echo "📊 Local Repository Analysis:"
du -sh . 2>/dev/null | head -1 || echo "Cannot read directory size"
echo "  - node_modules: $(du -sh node_modules 2>/dev/null | cut -f1 || echo 'Not found')"
echo "  - public: $(du -sh public 2>/dev/null | cut -f1 || echo 'Not found')"
echo "  - dist: $(du -sh dist 2>/dev/null | cut -f1 || echo 'Not found')"

# Check if bundles exist
echo ""
echo "📦 Bundle Analysis:"
if [ -d "public" ]; then
    echo "  - Bundle count: $(ls public/*.js 2>/dev/null | wc -l)"
    echo "  - Largest bundles:"
    ls -lh public/*.js 2>/dev/null | head -3 | awk '{print "    " $9 ": " $5}' || echo "    No bundles found"
else
    echo "  - No public directory found"
fi

# Test network connectivity (if SERVER_HOST is available)
echo ""
echo "🌐 Network Connectivity Test:"
if [ -n "$1" ]; then
    SERVER_HOST="$1"
    echo "  Testing connection to $SERVER_HOST..."
    
    # Test ping
    ping -c 3 "$SERVER_HOST" >/dev/null 2>&1 && {
        echo "  ✅ Ping successful"
    } || {
        echo "  ❌ Ping failed - server may be unreachable"
    }
    
    # Test SSH port
    timeout 10 nc -zv "$SERVER_HOST" 22 >/dev/null 2>&1 && {
        echo "  ✅ SSH port (22) is open"
    } || {
        echo "  ❌ SSH port (22) is closed or filtered"
    }
    
else
    echo "  ⚠️  No server host provided (usage: $0 <server-host>)"
fi

# Check GitHub Actions secrets (if running in CI)
echo ""
echo "🔑 Environment Check:"
[ -n "$GITHUB_ACTIONS" ] && {
    echo "  ✅ Running in GitHub Actions"
    echo "  - Secrets available: $(env | grep -c '^[A-Z_]*=' || echo '0')"
} || {
    echo "  ℹ️  Running locally"
}

echo ""
echo "💡 Recommendations:"
echo "  1. Ensure server firewall allows connections from GitHub Actions IPs"
echo "  2. Verify SSH key has proper permissions"
echo "  3. Test manual SCP to server before deployment"
echo "  4. Consider using smaller deployment packages"

# Create minimal test package
echo ""
echo "📦 Creating test deployment package..."
mkdir -p test-deploy
echo "console.log('StreamScene Test Deploy');" > test-deploy/test.js
echo "Hello from StreamScene" > test-deploy/README.txt

cd test-deploy
tar -czf ../test-deploy.tar.gz .
cd ..
rm -rf test-deploy

echo "  ✅ Test package created: $(ls -lh test-deploy.tar.gz | awk '{print $5}')"
echo ""
echo "🚀 Use this for manual testing:"
echo "   scp test-deploy.tar.gz user@server:/tmp/"