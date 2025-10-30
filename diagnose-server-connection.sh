#!/bin/bash
# Server Connection Diagnostic Script

echo "🔍 StreamScene Server Connection Diagnostics"
echo "============================================"

# Check if we can reach the server from different locations
echo ""
echo "📡 Testing GitHub Actions IP Ranges Access..."

# GitHub Actions uses these IP ranges (as of 2024)
GITHUB_IPS=(
    "20.201.28.151"
    "20.207.73.82" 
    "20.27.177.113"
    "20.29.134.17"
    "4.208.26.196"
    "4.221.82.252"
)

echo "Testing connectivity from GitHub's known IP ranges..."
for ip in "${GITHUB_IPS[@]}"; do
    echo -n "  Testing from $ip vicinity: "
    # This is a simulation - we can't actually test from GitHub's IPs locally
    echo "⚠️  Cannot test directly (requires GitHub Actions environment)"
done

echo ""
echo "🌐 Local Network Tests (for comparison):"

# Test if SSH port is open
SERVER_HOST="${1:-your-server-host}"
SERVER_PORT="${2:-22}"

if [ "$SERVER_HOST" = "your-server-host" ]; then
    echo "❌ Please provide your server details:"
    echo "Usage: $0 <server-host> [ssh-port]"
    echo ""
    echo "🔧 Manual tests you can run:"
    echo "1. Test from your local machine: ssh user@your-server"
    echo "2. Check server firewall: sudo ufw status"
    echo "3. Check SSH config: sudo systemctl status ssh"
    echo "4. Check server logs: sudo tail -f /var/log/auth.log"
    exit 1
fi

echo "Testing connection to $SERVER_HOST:$SERVER_PORT..."

# Test basic connectivity
echo -n "  Port $SERVER_PORT open: "
timeout 10 nc -zv "$SERVER_HOST" "$SERVER_PORT" >/dev/null 2>&1 && {
    echo "✅ Yes"
} || {
    echo "❌ No - Port may be closed or filtered"
}

# Test SSH banner (what GitHub Actions is failing on)
echo -n "  SSH banner exchange: "
timeout 10 ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_HOST" -p "$SERVER_PORT" exit >/dev/null 2>&1 && {
    echo "✅ Success"
} || {
    echo "❌ Failed - Same issue as GitHub Actions"
}

# Test with verbose SSH to see what's happening
echo ""
echo "🔍 Verbose SSH test (first few lines):"
timeout 10 ssh -v -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_HOST" -p "$SERVER_PORT" exit 2>&1 | head -10

echo ""
echo "📊 Common Causes When This Breaks:"
echo "1. 🔥 Server firewall changed (ufw, iptables)"
echo "2. 🌐 Network/router configuration changed" 
echo "3. 🔑 SSH daemon configuration changed"
echo "4. ☁️  Cloud provider security group changed"
echo "5. 🏢 GitHub Actions IP ranges updated (rare)"
echo ""

echo "🔧 Recommended Checks:"
echo "On your server, run:"
echo "  sudo ufw status verbose"
echo "  sudo systemctl status ssh" 
echo "  sudo tail -20 /var/log/auth.log"
echo "  sudo netstat -tlnp | grep :$SERVER_PORT"
echo ""

echo "If using cloud provider (AWS/DigitalOcean/etc):"
echo "  - Check security groups allow port $SERVER_PORT from 0.0.0.0/0"
echo "  - Check network ACLs aren't blocking connections"
echo "  - Check if server IP changed"