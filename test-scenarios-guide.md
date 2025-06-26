# Tea Inventory System - Comprehensive Test Scenarios Guide

## Overview
This guide documents all the test scenarios covered by the comprehensive test suite (`manual-test-comprehensive.js`). The tests simulate real user interactions and validate the system's behavior under various conditions.

## Test Scenarios

### 1. Production Workflow Test
**Purpose**: Validates the complete production cycle from raw materials to finished products.

**Steps**:
1. **Admin Setup**
   - Admin logs in with credentials
   - Creates raw materials (teas, packaging materials)
   - Creates products (different tea varieties and formats)
   - Sets up Bill of Materials (BOM) linking products to raw materials

2. **Production Process**
   - Production manager logs in
   - Creates production request for specific products
   - System checks material availability
   - Production manager completes the request
   - System automatically updates inventory levels

**Expected Results**:
- Raw materials are deducted according to BOM
- Product inventory increases by production quantity
- All transactions are logged properly

### 2. Fulfillment Workflow Test
**Purpose**: Tests the order fulfillment process and inventory management.

**Steps**:
1. **Inventory Check**
   - Fulfillment manager logs in
   - Views available products and their stock levels
   - Identifies products available for fulfillment

2. **Order Processing**
   - Simulates customer order
   - Checks stock availability
   - Deducts inventory for fulfilled orders
   - Creates replenishment requests when stock is low

**Expected Results**:
- Stock levels decrease correctly after fulfillment
- Low stock alerts trigger when threshold is reached
- Replenishment requests are created automatically

### 3. Edge Cases & Validation Test
**Purpose**: Ensures system handles error conditions gracefully.

**Test Cases**:

1. **Insufficient Materials**
   - Attempts production with insufficient raw materials
   - System should prevent production completion

2. **Negative Stock Prevention**
   - Attempts to fulfill orders exceeding available stock
   - System should prevent negative inventory

3. **Concurrent Operations**
   - Multiple simultaneous inventory updates
   - System should handle race conditions properly

4. **Input Validation**
   - Invalid product data (empty names, negative values)
   - Invalid raw material data
   - Invalid production requests
   - System should reject all invalid inputs

**Expected Results**:
- All invalid operations are blocked
- Clear error messages are provided
- Data integrity is maintained

### 4. Performance Testing
**Purpose**: Validates system performance under load.

**Test Areas**:
1. **Pagination & Filtering**
   - Tests product pagination
   - Search functionality
   - Category filtering

2. **Bulk Operations**
   - Creates multiple production requests rapidly
   - Tests system handling of bulk operations

3. **Dashboard Performance**
   - Measures dashboard stats loading time
   - Validates statistics accuracy

**Expected Results**:
- Pagination works correctly
- Search and filters return accurate results
- Dashboard loads within acceptable time
- Bulk operations complete successfully

## Running the Tests

### Prerequisites
1. Backend server running on port 3001
2. Database properly initialized with seed data
3. All default users created (admin, production, fulfillment)

### Execution
```bash
# Make the script executable
chmod +x run-comprehensive-test.sh

# Run the comprehensive test
./run-comprehensive-test.sh
```

### Test Output
The test suite provides:
- Real-time console output with ✅/❌ indicators
- Detailed step-by-step progress
- Performance metrics
- Final summary report

### Results File
After completion, check `comprehensive-test-results.json` for:
- Detailed test results
- Error logs
- Performance metrics
- Test execution timeline

## Interpreting Results

### Success Indicators
- ✅ Green checkmarks indicate passed tests
- Clear confirmation messages for each operation
- High success rate (>90%) in final summary

### Failure Indicators
- ❌ Red X marks indicate failed tests
- Error messages explain the failure reason
- Failed tests are listed in the final report

### Common Issues
1. **Server not running**: Start backend server first
2. **Database not seeded**: Run database seed script
3. **Rate limiting**: Tests include delays to prevent this
4. **Existing data conflicts**: Tests handle existing data gracefully

## Test Coverage

The comprehensive test suite covers:
- ✓ User authentication (all roles)
- ✓ CRUD operations for all entities
- ✓ Business logic validation
- ✓ Inventory management workflows
- ✓ Error handling and edge cases
- ✓ Performance under load
- ✓ Data integrity constraints
- ✓ Role-based access control

## Customization

To modify test scenarios:
1. Edit `manual-test-comprehensive.js`
2. Add new test functions following the pattern
3. Include proper error handling
4. Add rate limit protection with `await wait(ms)`
5. Update this guide with new scenarios

## Troubleshooting

### Test Fails to Start
- Check server is running: `curl http://localhost:3001/api`
- Verify database connection
- Check for port conflicts

### Authentication Errors
- Ensure default users exist
- Check credentials match seed data
- Verify session handling

### Inventory Calculation Errors
- Check BOM is properly configured
- Verify raw material units
- Ensure proper decimal handling

### Performance Issues
- Increase delays between operations
- Reduce bulk operation size
- Check database indexes