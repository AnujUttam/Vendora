/**
 * Vendora Comprehensive Test Suite
 * In-process unit & integration tests for API routes, auth, commissions, and lifecycle.
 */

const assert = require("assert");
const { Readable } = require("stream");
const { EventEmitter } = require("events");
const app = require("../app");
const { calculateSplitCommissions, verifyRazorpayPayment } = require("../services/paymentService");

class MockReq extends Readable {
  constructor(method, url, body = null, headers = {}) {
    super();
    this.method = method.toUpperCase();
    this.url = url;
    this.originalUrl = url;
    this.path = url.split("?")[0];
    this.headers = { ...headers };
    this.query = {};
    this.params = {};

    const data = body ? JSON.stringify(body) : null;
    if (data) {
      this.headers["content-type"] = "application/json";
      this.headers["content-length"] = String(Buffer.byteLength(data));
      this.push(data);
    }
    this.push(null);
  }
  _read() {}
}

const dispatch = (method, url, body = null, headers = {}) => {
  return new Promise((resolve) => {
    const req = new MockReq(method, url, body, headers);
    const res = new EventEmitter();
    let resData = "";
    let statusCode = 200;
    const resHeaders = {};

    res.statusCode = 200;
    res.setHeader = (name, val) => {
      resHeaders[name.toLowerCase()] = val;
    };
    res.getHeader = (name) => resHeaders[name.toLowerCase()];
    res.status = (code) => {
      statusCode = code;
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      resolve({ status: statusCode, body: data, headers: resHeaders });
    };
    res.send = (data) => {
      resolve({ status: statusCode, body: data, headers: resHeaders });
    };
    res.write = (chunk) => {
      resData += chunk;
    };
    res.end = (chunk) => {
      if (chunk) resData += chunk;
      let parsed = resData;
      try {
        parsed = JSON.parse(resData);
      } catch (e) {}
      resolve({ status: statusCode, body: parsed, headers: resHeaders });
    };

    app.handle(req, res, (err) => {
      if (err) {
        resolve({ status: 500, body: { error: err.message }, headers: resHeaders });
      }
    });
  });
};

const runTests = async () => {
  console.log("==================================================");
  console.log("  Running Vendora Comprehensive API Test Suite    ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    -> ${err.message}`);
      failed++;
    }
  };

  // 1. Root & Health Check
  await test("GET / returns 200 with Marketplace API metadata", async () => {
    const res = await dispatch("GET", "/");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.message.includes("Vendora"));
  });

  await test("GET /api/health reports healthy system and fallback states", async () => {
    const res = await dispatch("GET", "/api/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "healthy");
    assert.ok(res.body.services);
    assert.ok(res.body.services.redis);
    assert.ok(res.body.services.elasticsearch);
    assert.ok(res.body.services.storage);
  });

  // 2. Auth Endpoint Validation
  await test("POST /api/auth/register fails with 400 when missing credentials", async () => {
    const res = await dispatch("POST", "/api/auth/register", {});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes("required"));
  });

  await test("POST /api/auth/register validates minimum password length", async () => {
    const res = await dispatch("POST", "/api/auth/register", {
      name: "Test User",
      email: "test@example.com",
      password: "123"
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.message.includes("8 characters"));
  });

  await test("POST /api/auth/login fails with 400 on empty credentials", async () => {
    const res = await dispatch("POST", "/api/auth/login", {});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  // 3. Security & Protected Endpoints (JWT Verification)
  await test("GET /api/auth/me returns 401 without Bearer token", async () => {
    const res = await dispatch("GET", "/api/auth/me");
    assert.strictEqual(res.status, 401);
  });

  await test("GET /api/cart returns 401 without Bearer token", async () => {
    const res = await dispatch("GET", "/api/cart");
    assert.strictEqual(res.status, 401);
  });

  await test("POST /api/orders/checkout returns 401 without Bearer token", async () => {
    const res = await dispatch("POST", "/api/orders/checkout", {});
    assert.strictEqual(res.status, 401);
  });

  await test("GET /api/admin/analytics returns 401 without Admin privileges", async () => {
    const res = await dispatch("GET", "/api/admin/analytics");
    assert.strictEqual(res.status, 401);
  });

  // 4. Multi-Vendor Split Payment & Commission Calculation Engine
  await test("Commission engine accurately calculates vendor payouts and platform fee", async () => {
    const mockVendorId1 = "650000000000000000000001";
    const mockVendorId2 = "650000000000000000000002";

    const items = [
      { vendorId: mockVendorId1, price: 1000, quantity: 2, commissionRate: 10 },
      { vendorId: mockVendorId2, price: 500, quantity: 1, commissionRate: 12 }
    ];

    const result = await calculateSplitCommissions(items);
    assert.strictEqual(result.totalPlatformCommission, 260); // 200 + 60

    const vendor1 = result.vendorPayouts.find((v) => v.vendorId === mockVendorId1);
    const vendor2 = result.vendorPayouts.find((v) => v.vendorId === mockVendorId2);

    assert.strictEqual(vendor1.amount, 1800);
    assert.strictEqual(vendor1.commission, 200);
    assert.strictEqual(vendor2.amount, 440);
    assert.strictEqual(vendor2.commission, 60);
  });

  // 5. Razorpay Signature Verification
  await test("Razorpay test verification accepts simulated test signatures", async () => {
    const verified = verifyRazorpayPayment("order_mock_12345", "pay_mock_12345", "test_signature");
    assert.strictEqual(verified, true);
  });

  // 6. 404 Not Found Route
  await test("GET /api/unknown-endpoint returns 404 response", async () => {
    const res = await dispatch("GET", "/api/unknown-endpoint");
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
  });

  console.log("==================================================");
  console.log(`Test Execution Finished: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
