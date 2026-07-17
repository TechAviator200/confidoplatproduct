// Route-level tests for POST /book-appointment.
// These tests exercise the HTTP adapter's selected_slot enforcement — the primary
// guard against the silent wrong-slot booking bug: when selected_slot is absent,
// the contract falls back to getAvailability().slots[0] and books the wrong slot.
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

// James Porter, 555-0102, DOB 1971-07-04 — Follow-Up, Dr. Raman, BlueCross active.
// With today unset (server uses real Date), availability resolves from Raman's schedule.
const VALID_BASE = {
  phone: "555-0102",
  dob_confirmation: "1971-07-04",
  has_policy_number_confirmed: true,
  requested_provider: "raman",
};

test("selected_slot missing → 400 (prevents silent fallback to wrong slot)", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/book-appointment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BASE), // no selected_slot
    });
    assert.equal(res.status, 400);
    const body = (await res.json()) as any;
    assert.ok(
      typeof body.error === "string" && body.error.includes("selected_slot"),
      `expected error mentioning selected_slot, got: ${JSON.stringify(body)}`,
    );
  });
});

test("selected_slot null → 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/book-appointment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...VALID_BASE, selected_slot: null }),
    });
    assert.equal(res.status, 400);
  });
});

test("selected_slot malformed (missing location) → 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/book-appointment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...VALID_BASE,
        selected_slot: { date: "2026-07-22", weekday: "Wed", provider: "raman" }, // location missing
      }),
    });
    assert.equal(res.status, 400);
  });
});

test("selected_slot malformed (missing provider) → 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/book-appointment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...VALID_BASE,
        selected_slot: { date: "2026-07-22", weekday: "Wed", location: "lakeside" }, // provider missing
      }),
    });
    assert.equal(res.status, 400);
  });
});

test("valid selected_slot → booked with the exact slot passed, not the fallback soonest slot", async () => {
  // Dr. Raman works Mon/Wed/Thu/Fri. We deliberately pick a Wednesday slot.
  // If the route fell back to getAvailability().slots[0] (a Friday or Monday depending
  // on when the test runs), this assertion on slot.date would fail.
  const selectedSlot = { date: "2026-07-22", weekday: "Wed", time: "09:00", provider: "raman", location: "lakeside" };
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/book-appointment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...VALID_BASE, selected_slot: selectedSlot }),
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.status, "booked");
    assert.equal(body.slot.date, "2026-07-22", "must book the caller-confirmed slot");
    assert.equal(body.slot.weekday, "Wed");
    assert.equal(body.slot.location, "lakeside");
  });
});

test("TC-44 end-to-end: get_availability slot copied verbatim into book_appointment succeeds (regression for missing selected_slot bug)", async () => {
  // This test simulates exactly what the Retell LLM must do:
  //   1. call /get-availability → receive slot objects with date/weekday/time/provider/location
  //   2. present a slot to the caller
  //   3. caller confirms
  //   4. call /book-appointment with that EXACT slot object in selected_slot
  //
  // Before the fix (Bug #2): book_appointment's Retell schema had no selected_slot parameter.
  // The LLM sent requested_provider instead, and the endpoint rejected with 400 (selected_slot required).
  // After the fix: slot objects are self-contained (include provider/time), schema declares
  // selected_slot required, and the LLM copies the slot verbatim.
  //
  // This test would fail if:
  //   - /get-availability returns slots missing provider or time (breaks self-containment)
  //   - /book-appointment rejects a slot copied directly from /get-availability (contract mismatch)
  await withServer(async (baseUrl) => {
    // Step 1: call /get-availability as the LLM would
    const availRes = await fetch(`${baseUrl}/get-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "raman", classification: "follow_up" }),
    });
    assert.equal(availRes.status, 200);
    const avail = (await availRes.json()) as any;
    assert.ok(Array.isArray(avail.slots) && avail.slots.length > 0, "must have slots");

    // Step 2: verify slot is self-contained (the LLM can copy it without reconstruction)
    const slot = avail.slots[0];
    assert.equal(typeof slot.date, "string", "slot.date must be present");
    assert.equal(typeof slot.weekday, "string", "slot.weekday must be present");
    assert.equal(typeof slot.time, "string", "slot.time must be present — slot must be self-contained");
    assert.equal(typeof slot.provider, "string", "slot.provider must be present — slot must be self-contained");
    assert.equal(typeof slot.location, "string", "slot.location must be present");
    assert.equal(slot.provider, "raman", "slot.provider must match the requested provider");

    // Step 3: call /book-appointment with the slot copied verbatim (no reconstruction)
    const bookRes = await fetch(`${baseUrl}/book-appointment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "555-0102",
        dob_confirmation: "1971-07-04",
        has_policy_number_confirmed: true,
        selected_slot: slot, // verbatim copy — exactly what the LLM must do
      }),
    });
    assert.equal(bookRes.status, 200, "booking must succeed when slot is copied verbatim from get_availability");
    const booking = (await bookRes.json()) as any;
    assert.equal(booking.status, "booked");
    assert.equal(booking.slot.date, slot.date, "booked date must match the slot from get_availability");
    assert.equal(booking.slot.provider, "raman");
  });
});
