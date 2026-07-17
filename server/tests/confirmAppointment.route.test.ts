import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "../index";

async function withServer(fn: (baseUrl: string) => Promise<void>): Promise<void> {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test("successful appointment confirmation", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/confirm-appointment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "555-0109", dob: "1995-09-09" }), // Sofia Delgado — has an upcoming appointment
    });
    const body = (await res.json()) as any;
    assert.equal(res.status, 200);
    assert.equal(body.status, "confirmed");
    assert.equal(body.location, "maple_grove");
  });
});

test("no matching appointment returns not_found", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/confirm-appointment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "555-0102", dob: "1971-07-04" }), // James Porter — no upcoming appointment
    });
    const body = (await res.json()) as any;
    assert.equal(res.status, 200);
    assert.equal(body.status, "not_found");
  });
});
