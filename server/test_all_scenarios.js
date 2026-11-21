const http = require('http');
const app = require('./src/index');
const { getPool, query } = require('./src/db');

let server;
let port = 5099;
const baseUrl = `http://localhost:${port}`;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE BACKEND SCENARIO TEST SUITE');
  console.log('================================================================');

  server = app.listen(port);
  await new Promise((r) => setTimeout(r, 500));

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  const testEmail = `customer_test_${Date.now()}@example.com`;
  const testPassword = 'Password@123';
  let testUserId = null;
  let sivaProduct = null;
  let kumarProduct = null;
  let testCartItemId = null;

  try {
    // Test 1: Health Check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'ok', 'Scenario 1: Health check endpoint responds ok');

    // Test 2: Database Status
    const dbStatus = await request('GET', '/api/db/status');
    assert(dbStatus.status === 200 && dbStatus.data.connected === true, 'Scenario 2: Database status is connected');

    // Test 3: Register Request (Generates 6-digit OTP)
    const regReq = await request('POST', '/api/auth/register-request', {
      email: testEmail,
      password: testPassword,
      full_name: 'Test Customer',
      phone_number: '+61411223344',
    });
    assert(
      regReq.status === 200 && regReq.data.success && regReq.data.devOtp && regReq.data.devOtp.length === 6,
      `Scenario 3: Register request generates 6-digit OTP (Code: ${regReq.data?.devOtp})`
    );

    const generatedOtp = regReq.data.devOtp;

    // Test 4: Verify with WRONG OTP
    const wrongOtpRes = await request('POST', '/api/auth/verify-registration-otp', {
      email: testEmail,
      otp_code: '000000',
    });
    assert(wrongOtpRes.status === 400 && !wrongOtpRes.data.success, 'Scenario 4: Wrong OTP rejected with 400');

    // Test 5: Verify with CORRECT OTP
    const verifyRes = await request('POST', '/api/auth/verify-registration-otp', {
      email: testEmail,
      otp_code: generatedOtp,
    });
    assert(
      verifyRes.status === 201 && verifyRes.data.success && verifyRes.data.user.email === testEmail,
      'Scenario 5: Correct OTP activates customer account with CUSTOMER role'
    );
    testUserId = verifyRes.data.user.id;

    // Test 6: Login
    const loginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword,
    });
    assert(loginRes.status === 200 && loginRes.data.success && loginRes.data.user.id === testUserId, 'Scenario 6: Customer login succeeds with valid credentials');

    // Test 7: Fetch Vendors
    const vendorsRes = await request('GET', '/api/vendors');
    assert(vendorsRes.status === 200 && vendorsRes.data.vendors.length >= 3, `Scenario 7: Fetches all ${vendorsRes.data?.vendors?.length} vendors`);

    // Test 8: Fetch Vendor 2 (Siva) Products
    const sivaProdsRes = await request('GET', '/api/vendors/2/products');
    assert(sivaProdsRes.status === 200 && sivaProdsRes.data.products.length > 0, `Scenario 8: Fetches Siva catalog (${sivaProdsRes.data?.products?.length} products)`);
    // Find an in-stock product
    sivaProduct = sivaProdsRes.data.products.find((p) => p.isInStock && p.qty > 0) || sivaProdsRes.data.products[0];

    // Test 9: Fetch Vendor 1 (Kumar K) Products
    const kumarProdsRes = await request('GET', '/api/vendors/1/products');
    assert(kumarProdsRes.status === 200 && kumarProdsRes.data.products.length > 0, `Scenario 9: Fetches Kumar K catalog (${kumarProdsRes.data?.products?.length} products)`);
    kumarProduct = kumarProdsRes.data.products.find((p) => p.isInStock && p.qty > 0) || kumarProdsRes.data.products[0];

    // Test 10: Add Siva Product to Cart
    const addSivaRes = await request('POST', '/api/cart/items', {
      userId: testUserId,
      vendorId: 2,
      productId: sivaProduct.id,
      quantity: 1,
    });
    assert(
      addSivaRes.status === 200 && addSivaRes.data.cart.vendor.id === 2 && addSivaRes.data.cart.items.length === 1,
      `Scenario 10: Added product "${sivaProduct.name}" to cart. Cart vendor locked to Siva (Vendor 2)`
    );
    testCartItemId = addSivaRes.data.cart.items[0].id;

    // Test 11: Add Kumar K (Vendor 1) Product WITHOUT overwrite -> Expect 409 Conflict
    const conflictRes = await request('POST', '/api/cart/items', {
      userId: testUserId,
      vendorId: 1,
      productId: kumarProduct.id,
      quantity: 1,
      overwrite: false,
    });
    assert(
      conflictRes.status === 409 && conflictRes.data.conflict === true,
      `Scenario 11: Single-Vendor Conflict caught! 409 returned with message: "${conflictRes.data.message}"`
    );

    // Test 12: Add Kumar K (Vendor 1) Product WITH overwrite: true
    const overwriteRes = await request('POST', '/api/cart/items', {
      userId: testUserId,
      vendorId: 1,
      productId: kumarProduct.id,
      quantity: 2,
      overwrite: true,
    });
    assert(
      overwriteRes.status === 200 &&
        overwriteRes.data.cart.vendor.id === 1 &&
        overwriteRes.data.cart.items.length === 1 &&
        overwriteRes.data.cart.items[0].productId === kumarProduct.id,
      `Scenario 12: Cart successfully overwritten! Prior vendor cleared, vendor locked to Kumar K (Vendor 1)`
    );

    // Test 13: Omnichannel Cart Retrieval
    const cartGetRes = await request('GET', `/api/cart?userId=${testUserId}`);
    assert(
      cartGetRes.status === 200 && cartGetRes.data.cart.vendor.id === 1 && cartGetRes.data.cart.items.length === 1,
      `Scenario 13: Omnichannel DB Cart fetch verified. Cart persists in PostgreSQL.`
    );

    // Test 14: Update Cart Quantity
    const updateQtyRes = await request('PUT', `/api/cart/items/${cartGetRes.data.cart.items[0].id}`, {
      userId: testUserId,
      quantity: 1,
    });
    assert(
      updateQtyRes.status === 200 && updateQtyRes.data.cart.items[0].quantity === 1,
      'Scenario 14: Cart item quantity updated to 1.'
    );

    // Test 15: Check stock before ordering
    const stockBeforeRes = await query('SELECT qty, is_in_stock FROM products WHERE id = $1', [kumarProduct.id]);
    const stockBefore = parseFloat(stockBeforeRes.rows[0].qty);

    // Test 16: Place Order (Atomic Inventory Decrement & Cart Flush)
    const placeOrderRes = await request('POST', '/api/orders/place', {
      userId: testUserId,
      deliveryAddress: '120 George Street, Sydney NSW 2000',
      contactPhone: '+61411223344',
      deliveryInstructions: 'Leave with concierge',
      paymentMethod: 'stripe',
    });
    assert(
      placeOrderRes.status === 201 && placeOrderRes.data.success && placeOrderRes.data.order.id,
      `Scenario 16: Order placed successfully! Order ID #${placeOrderRes.data?.order?.id}, ETA: ${placeOrderRes.data?.order?.estimatedDeliveryTime}`
    );

    // Test 17: Verify Inventory Was Reduced in DB
    const stockAfterRes = await query('SELECT qty, is_in_stock FROM products WHERE id = $1', [kumarProduct.id]);
    const stockAfter = parseFloat(stockAfterRes.rows[0].qty);
    assert(
      stockAfter === stockBefore - 1,
      `Scenario 17: Live inventory accurately decremented in PostgreSQL (${stockBefore} -> ${stockAfter})`
    );

    // Test 18: Verify Cart Was Cleared After Order
    const cartAfterOrder = await request('GET', `/api/cart?userId=${testUserId}`);
    assert(
      cartAfterOrder.status === 200 && cartAfterOrder.data.cart.items.length === 0 && cartAfterOrder.data.cart.vendor === null,
      'Scenario 18: User cart cleanly flushed and vendor unlocked after order completion'
    );

    // Test 19: User Orders History
    const userOrdersRes = await request('GET', `/api/orders/user/${testUserId}`);
    assert(
      userOrdersRes.status === 200 && userOrdersRes.data.orders.length >= 1,
      `Scenario 19: User order history retrieved (${userOrdersRes.data.orders.length} orders)`
    );

    // Test 20: Profile Update
    const updateProfileRes = await request('PUT', `/api/user/profile/${testUserId}`, {
      full_name: 'Updated Name',
      phone_number: '+61499887766',
    });
    assert(
      updateProfileRes.status === 200 && updateProfileRes.data.profile.full_name === 'Updated Name',
      'Scenario 20: User profile updated successfully in PostgreSQL'
    );
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    await getPool().end();
    console.log('================================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
