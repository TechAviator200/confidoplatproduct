# Riverbend Gastroenterology — Knowledge Base

Content intended for the Retell agent's knowledge base. This file contains only
static, public, non-transactional facts — sourced from `clinic-config/` and the
Riverbend rules. It intentionally excludes patient records, insurance status, and
appointment data; those are only ever retrieved live via the tools in
`retell/TOOL_DEFINITIONS.json`, never stored here. See `retell/AGENT_BEHAVIOR.md`
"Knowledge base usage" for why that line is drawn where it is.

---

## Practice

Riverbend Gastroenterology is a gastroenterology practice with two locations.

## Hours

Monday–Friday, 9:00 AM – 5:00 PM. Closed 12:00–1:00 PM for lunch at both locations.

## Locations

**Maple Grove**
- Address: 120 Maple Grove Ave
- Parking: street meter parking

**Lakeside**
- Address: 45 Lakeside Blvd
- Parking: free patient lot

## Providers

| Provider | Role | Paired with | Works | Primary location |
|---|---|---|---|---|
| Dr. Alan Whitfield, MD | MD | Nina Brooks, NP | Mon–Wed, Fri (AM) | Maple Grove (Thursday afternoons at Lakeside) |
| Nina Brooks, NP | NP | Dr. Alan Whitfield | Mon–Fri | Maple Grove |
| Dr. Priya Raman, MD | MD | Marco Ellis, PA | Mon, Wed–Fri | Lakeside |
| Marco Ellis, PA | PA | Dr. Priya Raman | Mon–Fri | Lakeside |
| Dr. Theodore Crane, MD | MD | Sofia Mendez, NP | Thursdays only | Maple Grove |
| Sofia Mendez, NP | NP | Dr. Theodore Crane | Mon–Fri | Maple Grove |

On days Dr. Crane isn't in the office, his patients are seen by Sofia Mendez, NP,
his paired nurse practitioner.

## Scheduling policies (general — not patient-specific)

- A **Follow-Up** patient is someone seen by the practice within the last 3 years.
  A **New Patient** is someone new to the practice, or not seen in over 3 years.
- New Patient visits are 30 minutes. Follow-Up visits are 15 minutes.
- Active insurance and a policy number must be confirmed at the time an appointment
  is made.
- The practice does not see patients under 18.
- Follow-Up patients see their own provider, or that provider's paired NP/PA.
  Switching to a different provider requires office approval — the front desk
  handles this, not the phone system.
- Dr. Crane only sees office patients himself on Thursdays. Any other day, his
  patients are seen by Sofia Mendez, NP.
- The soonest available appointment is always offered first.
- Annual wellness / physical visits are not yet a supported scheduling workflow —
  these requests go to the front desk.

## Transfers

- **Front desk:** for billing, requests to speak with a person, annual physical
  scheduling, provider-switch requests, and anything unrecognized or unsupported.
- **Nurse line:** for urgent medical concerns or anything requiring clinical
  judgment. Medical advice is never given over this phone system.
- For a clear medical emergency, callers are told to hang up and dial 911 —
  this does not go through a transfer.

*(Exact phone numbers are retrieved via the `transfer_front_desk` and
`transfer_nurse_line` tools at call time, not stored as static text here — see
`retell/AGENT_BEHAVIOR.md` "Transfer rules" for why.)*
