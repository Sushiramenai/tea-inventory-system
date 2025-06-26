#!/bin/bash

echo "🧪 TEA INVENTORY SYSTEM - COMPREHENSIVE MANUAL TEST"
echo "=================================================="
echo ""
echo "This script will run a comprehensive test suite that simulates"
echo "real user interactions across all major workflows."
echo ""
echo "Prerequisites:"
echo "1. Make sure the backend server is running on port 3001"
echo "2. Make sure the database is properly set up"
echo ""
echo "The test will cover:"
echo "✓ Complete production workflow (admin → raw materials → products → BOM → production)"
echo "✓ Fulfillment workflow (view inventory → process orders → create replenishment requests)"
echo "✓ Edge cases (insufficient materials, negative stock prevention, validation)"
echo "✓ Performance testing (pagination, bulk operations, concurrent updates)"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Check if server is accessible
echo ""
echo "🔍 Checking server status..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api | grep -q "200\|404"; then
    echo "✅ Server is running!"
else
    echo "❌ Server is not accessible at http://localhost:3001"
    echo "Please start the server first with:"
    echo "  cd backend && npm start"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing test dependencies..."
    npm install axios
fi

# Run the comprehensive test
echo ""
echo "🚀 Starting comprehensive test suite..."
echo ""
node manual-test-comprehensive.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests completed successfully!"
    echo "📊 Check comprehensive-test-results.json for detailed results"
else
    echo ""
    echo "❌ Some tests failed. Check the output above for details."
    echo "📊 Check comprehensive-test-results.json for detailed results"
fi