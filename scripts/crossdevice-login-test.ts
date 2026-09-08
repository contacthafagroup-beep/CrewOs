// End-to-end test of the cross-device magic-link flow.
// Simulates: PC requests link → "phone" opens the approve link → PC's poll completes.
// Verifies: flowToken returned, approve marks flow, claim consumes ONCE and sets a
// session cookie, second claim stays pending. Run while server on :3001.

const BASE = "http://localhost:3001";
const EMAIL = `crossdevice-${Date.now()}@testdemo.co`;

async function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null), setCookie: res.headers.get("set-cookie") };
}

async function main() {
  // 1. PC: request sign-in
  const start = await post("/api/auth/magic-link", { email: EMAIL });
  console.log("1. PC request:", start.status, JSON.stringify(start.json).slice(0, 80));
  if (start.status !== 200 || !start.json.flowToken) throw new Error("flow not created");
  const flowToken = start.json.flowToken;

  // 2. PC polls BEFORE approval → expect pending
  const early = await post("/api/auth/magic-link/claim", { flowToken });
  console.log("2. claim before approve:", early.status, early.json?.status);
  if (early.json?.status !== "pending") throw new Error("expected pending before approval");

  // 3. Read the approve link token straight from the LoginFlow table
  //    (same source of truth the email link points at — no log parsing).
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const flow = await prisma.loginFlow.findFirst({
    where: { identifier: EMAIL },
    orderBy: { createdAt: "desc" },
  });
  if (!flow) throw new Error("LoginFlow row not found for " + EMAIL);
  const url = `${BASE}/api/auth/magic-link/approve?link_token=${flow.token}`;
  console.log("3. phone opens:", url.slice(0, 60) + "…");

  const approveRes = await fetch(url, { redirect: "manual" });
  const approveHtml = await approveRes.text();
  console.log("4. approve page:", approveRes.status, approveHtml.includes("Approved") ? "shows Approved ✅" : "UNEXPECTED PAGE");
  if (!approveHtml.includes("Approved")) throw new Error("approve page did not confirm");

  // 5. PC polls again → expect complete + Set-Cookie session
  const claim = await post("/api/auth/magic-link/claim", { flowToken });
  console.log("5. claim after approve:", claim.status, claim.json?.status, "| session cookie set:", !!claim.setCookie);
  if (claim.json?.status !== "complete" || !claim.setCookie) throw new Error("claim did not complete with session");

  // 6. Replay claim → must NOT sign in twice
  const replay = await post("/api/auth/magic-link/claim", { flowToken });
  console.log("6. replay claim:", replay.status, replay.json?.status);
  if (replay.json?.status === "complete") throw new Error("replay was not single-use");

  // 7. Session cookie actually authenticates — hit a real workspace endpoint
  const cookie = claim.setCookie.split(";")[0];
  const me = await fetch(BASE + "/api/notifications", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ all: true }),
  });
  console.log("7. session cookie usable (notifications POST):", me.status);
  if (me.status !== 200) throw new Error("minted session cookie does not authenticate");

  console.log("\n✓ CROSS-DEVICE FLOW VERIFIED (request → approve-on-other-device → poll → session, single-use)");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
