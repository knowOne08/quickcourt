// backend/src/verify_all_endpoints.js
const API_URL = 'http://localhost:4000/api';
const BASE_URL = 'http://localhost:4000';

async function runTests() {
  console.log('🚀 ========================================== 🚀');
  console.log('🚀  QUICKCOURT END-TO-END ENDPOINT VERIFIER   🚀');
  console.log('🚀 ========================================== 🚀\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` ✅ ${message}`);
      passed++;
    } else {
      console.error(` ❌ ${message}`);
      failed++;
    }
  }

  // 1. Health check
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    assert(res.status === 200 && data.status === 'OK', `Health Check (Status: ${res.status}, statusText: ${data.status})`);
  } catch (err) {
    assert(false, `Health Check failed: ${err.message}`);
  }

  // 2. Base API
  try {
    const res = await fetch(`${API_URL}`);
    const data = await res.json();
    assert(res.status === 200 && data.success === true, `API Base check (success: ${data.success})`);
  } catch (err) {
    assert(false, `API Base check failed: ${err.message}`);
  }

  // 3. Get Venues (Public)
  let firstVenueId = null;
  try {
    const res = await fetch(`${API_URL}/venues`);
    const data = await res.json();
    assert(res.status === 200 && data.status === 'success' && Array.isArray(data.data.venues), `Fetch Venues (Public) - Got ${data.data?.venues?.length || 0} venues`);
    if (data.data && data.data.venues && data.data.venues.length > 0) {
      firstVenueId = data.data.venues[0]._id;
    }
  } catch (err) {
    assert(false, `Fetch Venues failed: ${err.message}`);
  }

  // 4. Get specific venue details if available
  if (firstVenueId) {
    try {
      const res = await fetch(`${API_URL}/venues/${firstVenueId}`);
      const data = await res.json();
      assert(res.status === 200 && data.status === 'success' && data.data.venue, `Fetch Specific Venue (${firstVenueId}) - Got venue "${data.data.venue.name}"`);
    } catch (err) {
      assert(false, `Fetch Specific Venue failed: ${err.message}`);
    }
  }

  // Helper for logging in and getting tokens
  async function testLogin(email, password, roleName) {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.status === 200 && data.success === true && data.tokens && data.tokens.accessToken) {
        assert(true, `Login as ${roleName} (${email}) - Success`);
        return data.tokens.accessToken;
      } else {
        assert(false, `Login as ${roleName} (${email}) - Failed (Status: ${res.status}, Msg: ${data.message || 'unknown'})`);
        return null;
      }
    } catch (err) {
      assert(false, `Login as ${roleName} (${email}) - Exception: ${err.message}`);
      return null;
    }
  }

  // 5. Test Admin Login and Admin Profile
  const adminToken = await testLogin('admin@example.com', 'password123', 'Admin');
  if (adminToken) {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true && data.user.role === 'admin', `Admin /auth/me verification (Role: ${data.user?.role})`);
    } catch (err) {
      assert(false, `Admin /auth/me failed: ${err.message}`);
    }

    try {
      const res = await fetch(`${API_URL}/auth/sessions`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true, `Admin fetch active sessions (${data.sessions?.length || 0} sessions found)`);
    } catch (err) {
      assert(false, `Admin fetch active sessions failed: ${err.message}`);
    }
  }

  // 6. Test Owner Login and Owner Profile
  const ownerToken = await testLogin('owner1@example.com', 'password123', 'Facility Owner');
  if (ownerToken) {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true && data.user.role === 'facility_owner', `Owner /auth/me verification (Role: ${data.user?.role})`);
    } catch (err) {
      assert(false, `Owner /auth/me failed: ${err.message}`);
    }
  }

  // 7. Test User Login and standard user pathways
  const userToken = await testLogin('john@example.com', 'password123', 'Standard User');
  if (userToken) {
    // Check User /auth/me
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true && data.user.role === 'user', `User /auth/me verification (Role: ${data.user?.role})`);
    } catch (err) {
      assert(false, `User /auth/me failed: ${err.message}`);
    }

    // Check User Bookings
    try {
      const res = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const data = await res.json();
      assert(res.status === 200 && data.status === 'success' && Array.isArray(data.data.bookings), `Fetch User Bookings (${data.data?.bookings?.length || 0} bookings found)`);
    } catch (err) {
      assert(false, `Fetch User Bookings failed: ${err.message}`);
    }

    // Check Notifications
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true, `Fetch Notifications (${data.data?.length || 0} notifications found)`);
    } catch (err) {
      assert(false, `Fetch Notifications failed: ${err.message}`);
    }

    // Check Teams list
    try {
      const res = await fetch(`${API_URL}/teams`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true, `Fetch Teams List (${data.data?.length || 0} teams found)`);
    } catch (err) {
      assert(false, `Fetch Teams List failed: ${err.message}`);
    }
  }

  console.log('\n🏁 ========================================== 🏁');
  console.log(`🏁  VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('🏁 ========================================== 🏁\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
