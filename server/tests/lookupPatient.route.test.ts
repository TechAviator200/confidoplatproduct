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

test("successful patient lookup", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/lookup-patient`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "555-0101", dob: "1958-02-10" }), // Margaret Hill
    });
    const body = (await res.json()) as any;
    assert.equal(res.status, 200);
    assert.equal(body.status, "verified");
    assert.equal(body.patient.name, "Margaret Hill");
  });
});

test("DOB mismatch does not expose the record", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/lookup-patient`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "555-0101", dob: "1999-01-01" }),
    });
    const body = (await res.json()) as any;
    assert.equal(res.status, 200);
    assert.equal(body.status, "dob_mismatch");
    assert.equal(body.patient, undefined);
  });
});

test("unknown patient returns not_found", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/lookup-patient`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "555-9999", dob: "1958-02-10" }),
    });
    const body = (await res.json()) as any;
    assert.equal(res.status, 200);
    assert.equal(body.status, "not_found");
  });
});
