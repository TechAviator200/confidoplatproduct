// Minimal Express adapter exposing existing tools/contracts functions over HTTP, so
// Retell's custom-function UI (which requires publicly reachable HTTP endpoints) can
// call them. This file wires transport only — routing, JSON parsing, CORS — no
// business logic lives here or in server/routes/. See tools/contracts/ for the actual
// logic being exposed.
//
// The data behind these endpoints is still the Phase 1 mock clinic data in
// clinic-config/ — this server does not add a database or any new data source.
//
// SECURITY NOTE (demo transport only — see docs/SECURITY.md):
// These endpoints are exposed without authentication solely to allow Retell to reach
// a local mock service during demo testing. All data is synthetic; no PHI is present.
// This is not a production architecture. Production deployments would require
// authentication, authorization, signed webhook requests, rate limiting, audit logging,
// secrets management, and HIPAA-aligned safeguards.
import express from "express";
import cors from "cors";
import { lookupPatientRoute } from "./routes/lookupPatientRoute";
import { confirmAppointmentRoute } from "./routes/confirmAppointmentRoute";
import { runSchedulingWorkflowRoute } from "./routes/runSchedulingWorkflowRoute";
import { getAvailabilityRoute } from "./routes/getAvailabilityRoute";
import { bookAppointmentRoute } from "./routes/bookAppointmentRoute";
import { transferFrontDeskRoute } from "./routes/transferFrontDeskRoute";
import { transferNurseLineRoute } from "./routes/transferNurseLineRoute";
import { getExistingAppointmentRoute } from "./routes/getExistingAppointmentRoute";
import { rescheduleAppointmentRoute } from "./routes/rescheduleAppointmentRoute";
import { cancelAppointmentRoute } from "./routes/cancelAppointmentRoute";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "riverbend-mock-api" });
});

// Identity
app.post("/lookup-patient", lookupPatientRoute);

// Scheduling pipeline
app.post("/run-scheduling-workflow", runSchedulingWorkflowRoute);
app.post("/get-availability", getAvailabilityRoute);
app.post("/book-appointment", bookAppointmentRoute);

// Appointment read/write
app.post("/confirm-appointment", confirmAppointmentRoute);
app.post("/get-existing-appointment", getExistingAppointmentRoute);
app.post("/reschedule-appointment", rescheduleAppointmentRoute);
app.post("/cancel-appointment", cancelAppointmentRoute);

// Transfers
app.post("/transfer-front-desk", transferFrontDeskRoute);
app.post("/transfer-nurse-line", transferNurseLineRoute);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`riverbend-mock-api listening on http://localhost:${PORT}`);
  });
}
