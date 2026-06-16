const BASE_URL = "http://localhost:3050/api";

async function test() {
  console.log("=== 1. Login ===");
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "13800000001", password: "123456" }),
  });
  const loginData = await loginRes.json();
  console.log("Status:", loginRes.status, "Success:", loginData.success);
  const token = loginData.data?.token;
  console.log("User:", loginData.data?.user?.nickname, loginData.data?.user?.role);

  const headers = { Authorization: `Bearer ${token}` };

  console.log("\n=== 2. GET /pets ===");
  const petsRes = await fetch(`${BASE_URL}/pets`, { headers });
  const petsData = await petsRes.json();
  console.log("Status:", petsRes.status, "Count:", petsData.data?.length);
  petsData.data?.slice(0, 2).forEach((p) => console.log(`  - ${p.name} (${p.species})`));

  console.log("\n=== 3. GET /doctors ===");
  const docsRes = await fetch(`${BASE_URL}/doctors`, { headers });
  const docsData = await docsRes.json();
  console.log("Status:", docsRes.status, "Count:", docsData.data?.length);
  docsData.data?.slice(0, 2).forEach((d) => console.log(`  - ${d.name} (${d.department})`));

  console.log("\n=== 4. GET /hospitals ===");
  const hospsRes = await fetch(`${BASE_URL}/hospitals`, { headers });
  const hospsData = await hospsRes.json();
  console.log("Status:", hospsRes.status, "Count:", hospsData.data?.length);

  console.log("\n=== 5. GET /products ===");
  const prodsRes = await fetch(`${BASE_URL}/products`, { headers });
  const prodsData = await prodsRes.json();
  console.log("Status:", prodsRes.status, "Count:", prodsData.data?.length);

  console.log("\n=== 6. GET /consultations ===");
  const consRes = await fetch(`${BASE_URL}/consultations`, { headers });
  const consData = await consRes.json();
  console.log("Status:", consRes.status, "Count:", consData.data?.length);

  console.log("\n=== 7. GET /calendar/events ===");
  const calRes = await fetch(`${BASE_URL}/calendar/events`, { headers });
  const calData = await calRes.json();
  console.log("Status:", calRes.status, "Count:", calData.data?.length);

  console.log("\n=== 8. GET /community/posts ===");
  const postsRes = await fetch(`${BASE_URL}/community/posts`, { headers });
  const postsData = await postsRes.json();
  console.log("Status:", postsRes.status, "Count:", postsData.data?.length);

  console.log("\n=== 9. GET /community/lost-pets ===");
  const lostRes = await fetch(`${BASE_URL}/community/lost-pets`, { headers });
  const lostData = await lostRes.json();
  console.log("Status:", lostRes.status, "Count:", lostData.data?.length);

  console.log("\n=== All API Tests Done ===");
}

test().catch(console.error);
