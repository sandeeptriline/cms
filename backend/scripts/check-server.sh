#!/bin/bash

echo "=========================================="
echo "  Backend Server Status Check"
echo "=========================================="
echo ""

# Check if port is in use
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "✅ Port 3001 is in use"
    PORT_PID=$(lsof -ti:3001)
    echo "   Process ID: $PORT_PID"
else
    echo "❌ Port 3001 is NOT in use"
fi
echo ""

# Check for node processes
NODE_PROCESSES=$(ps aux | grep -E "node.*nest|nest start" | grep -v grep | wc -l)
if [ "$NODE_PROCESSES" -gt 0 ]; then
    echo "✅ NestJS processes found: $NODE_PROCESSES"
    ps aux | grep -E "node.*nest|nest start" | grep -v grep | head -2
else
    echo "❌ No NestJS processes found"
fi
echo ""

# Test server connection
echo "Testing server connection..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>&1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "✅ Server is responding (HTTP $HTTP_CODE)"
    echo ""
    echo "Server is ready for testing!"
    echo ""
    echo "Next steps:"
    echo "1. Run tests: ./scripts/test-auth.sh"
    echo "2. Open Swagger: http://localhost:3001/api/docs"
else
    echo "❌ Server is NOT responding (HTTP $HTTP_CODE)"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if server is starting: tail -f logs/*.log (if logs exist)"
    echo "2. Check for errors in terminal where 'npm run start:dev' was run"
    echo "3. Verify .env file exists and has correct values"
    echo "4. Check database connection"
    echo ""
    echo "To start the server manually:"
    echo "  cd backend"
    echo "  npm run start:dev"
fi
echo ""
