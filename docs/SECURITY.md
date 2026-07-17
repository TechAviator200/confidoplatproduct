# Security Considerations

## Why an HTTP adapter exists at all

Retell's custom-function runtime requires a publicly reachable HTTP endpoint and it
cannot call a local TypeScript function directly. The Express adapter in `server/`
was created specifically to satisfy this constraint. Its only job is to give Retell
something to POST to; the actual Riverbend scheduling rules remain in
`tools/contracts/` and `tools/validators/`, unchanged.

Exposing an internal service over HTTP is normally a production security decision
that involves authentication, authorization, network isolation, and audit logging.
Those layers are intentionally omitted from this implementation because:

1. All data is synthetic. The patients, providers, appointments, and phone numbers
   in `clinic-config/` are fictional test fixtures. No real patient health information
   (PHI) is present anywhere in this codebase.
2. The scope is to demonstrate tool-calling behavior with deterministic rule
   enforcement, not to build a production-hardened API.

**This implementation exposes only the minimal surface area necessary for Retell
integration.** Two of the ten server routes were built first to validate the adapter
pattern; the remaining eight were added as each workflow was verified.

---

## What the current setup is

| Property | Current state |
|---|---|
| Authentication | None — any HTTP client can call the endpoints |
| Data | 100% synthetic mock data; no PHI |
| Transport | Deployed on Render (`confidoplatproduct.onrender.com`); ngrok used only for local Retell testing |
| Network exposure | Public internet; no IP allowlist |
| Secrets | Retell API key set at runtime only; never committed to source |
| Logging | Console only; no audit trail |

This is an acceptable trade-off for a demo using synthetic data. It is not acceptable
in any configuration that handles real patient data.

---

## What production would require

A production deployment of this service would need, at minimum:

| Requirement | Description |
|---|---|
| Authentication | Every inbound request verified — e.g., HMAC signed webhook headers from Retell (`X-Retell-Signature`), API keys, or mTLS |
| Authorization | Role-based access control; callers cannot request data for patients other than themselves |
| API gateway | Route traffic through a managed gateway (e.g., AWS API Gateway, Kong) that handles rate limiting, throttling, and request logging before requests reach service code |
| OAuth / service authentication | Service-to-service auth for any internal system the adapter calls (EHR, scheduling DB) |
| Internal network / VPC | Endpoints reachable only from Retell's known IP ranges and internal services — not the open internet |
| Rate limiting | Protect against abuse and runaway retries |
| Audit logging | Every tool call, identity lookup, and appointment mutation logged with caller + timestamp and preserved for compliance review |
| Secrets management | API keys, signing secrets, and database credentials in a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault) — never in source or committed environment files |
| Environment isolation | Separate dev / staging / production environments; no synthetic or test data in production |
| Monitoring and alerting | Uptime, error rates, and anomalous access patterns monitored in real time |
| HIPAA-aligned safeguards | Business Associate Agreement with hosting and infrastructure providers; encryption at rest and in transit; breach notification procedures |
| Managed deployment | The ngrok tunnel replaced by a hosted service with a stable owned domain and valid TLS certificate |

In practice, the thin adapter pattern chosen here makes this migration
straightforward: authentication, authorization, and rate limiting can be added at
the transport layer (`server/`) without touching any business logic in
`tools/contracts/` or `tools/validators/`. The separation was intentional.

---

## Summary

The unauthenticated endpoints and temporary tunnel reflect a deliberate demo
transport decision, not a production design recommendation. The engineering judgment
here is:

- Expose the minimal surface area needed to demonstrate the integration (two initial
  endpoints, expanded to ten as each workflow was verified).
- Keep all business logic out of the transport layer so production hardening is an
  additive change, not a rewrite.
- Document the gap explicitly so it is never mistaken for an accepted production
  posture.

Nothing in this architecture should be used as a template for deploying a voice agent
that handles real patient data.
