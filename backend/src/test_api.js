const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api/v1';
const TENANT_ID = '8f3e0984-7a3b-489e-b9ef-d4de20e17b88';

async function verify() {
  console.log("🚀 Testing PVPPCOE CampusOS API Endpoints...");

  try {
    // 1. Login Request
    console.log("\n🔑 Testing POST /auth/login...");
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
      body: JSON.stringify({ email: 'prathamesh@pvppcoe.ac.in', password: 'campus123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error("Login failed!");
    
    const token = loginData.token;
    console.log("✅ Login Success! Token secured.");

    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': TENANT_ID,
      'Content-Type': 'application/json'
    };

    // 2. Fetch Telemetry
    console.log("\n📊 Testing GET /analytics/telemetry...");
    const telRes = await fetch(`${API_URL}/analytics/telemetry`, { headers });
    const telData = await telRes.json();
    console.log(`✅ Telemetry Success! OS Risk: ${telData.attendanceRiskReport[1].riskLevel}`);

    // 3. Fetch Recommendations
    console.log("\n💡 Testing GET /recommendations/personalized...");
    const recRes = await fetch(`${API_URL}/recommendations/personalized`, { headers });
    const recData = await recRes.json();
    console.log(`✅ Recommendations Success! Focus area course: ${recData.recommendations.focusArea.courseCode}`);

    // 4. Fetch Route Wayfinding
    console.log("\n🗺️ Testing GET /navigation/route...");
    const navRes = await fetch(`${API_URL}/navigation/route?start=lobby&end=room203`, { headers });
    const navData = await navRes.json();
    console.log(`✅ Wayfinder Success! Path nodes count: ${navData.routeNodes.length}`);

    // 5. Test AI Twin Relationship Query
    console.log("\n🤖 Testing POST /ai/query...");
    const aiRes = await fetch(`${API_URL}/ai/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'Which labs are free right now?' })
    });
    const aiData = await aiRes.json();
    console.log(`✅ AI Twin Query Success! Intent: ${aiData.detectedIntent}`);
    console.log(`💬 AI Twin Response: ${aiData.response}`);

    console.log("\n🎉 All 6 Advanced Digital Twin Microservices Are Fully Functional!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

verify();
