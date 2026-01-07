#!/bin/bash
# Helper script to open the HTML test report in your default browser

REPORT_FILE="test-results/test-report.html"

if [ ! -f "$REPORT_FILE" ]; then
    echo "❌ Test report not found. Run 'npm run test:html' first."
    exit 1
fi

echo "📊 Opening test report: $REPORT_FILE"

# Try different commands based on OS
if command -v xdg-open > /dev/null; then
    # Linux/WSL
    xdg-open "$REPORT_FILE"
elif command -v open > /dev/null; then
    # macOS
    open "$REPORT_FILE"
elif command -v start > /dev/null; then
    # Windows (Git Bash)
    start "$REPORT_FILE"
else
    echo "⚠️  Could not automatically open browser."
    echo "Please open this file manually: $(pwd)/$REPORT_FILE"
    echo ""
    echo "Or copy this path:"
    echo "file://$(pwd)/$REPORT_FILE"
fi

