# Retell Setup Guide

Step-by-step instructions for configuring the four artifacts in this folder
(`RIVERBEND_SYSTEM_PROMPT.md`, `RIVERBEND_KNOWLEDGE_BASE.md`,
`TOOL_DEFINITIONS.json`, this guide) into a working Retell agent.

Retell's dashboard changes over time and exact button labels aren't pinned here —
where a label might be off, this guide describes the *purpose* of the setting so it's
findable even if the wording has moved.

## 1. Create the agent

1. Sign in to the Retell dashboard.
2. Create a new agent (look for a primary "create" action on the agents list —
   typically "+ New Agent" or similar).
3. Name it something identifiable, e.g. "Riverbend Gastroenterology."
4. Choose the conversational/voice agent type if the dashboard asks you to pick one
   (as opposed to a chat-only or workflow-only agent type) — this is a phone voice
   agent.

## 2. Select a voice

1. In the agent's voice settings, pick a text-to-speech voice. There's no clinic
   requirement dictating a specific voice — pick one that reads clearly and at a
   measured pace, since callers will often be describing symptoms or personal
   details and shouldn't have to strain to follow the agent.
2. If the platform offers a speed/stability control, keep speech at a normal or
   slightly-slower-than-default pace — this is a healthcare front desk, not a
   sales line.

## 3. Add the system prompt

1. Open the agent's prompt / instructions field (usually labeled "Prompt," "System
   Prompt," or "Instructions").
2. Paste the contents of the code block in `RIVERBEND_SYSTEM_PROMPT.md` (everything
   between the ` ``` ` fences, not the surrounding explanatory text).
3. Save.

## 4. Add the knowledge base

1. Find the knowledge base / documents section of the agent (sometimes a separate
   top-level "Knowledge Base" area you attach to the agent, sometimes inline).
2. Upload or paste the contents of `RIVERBEND_KNOWLEDGE_BASE.md`.
3. Attach it to this agent if the platform treats knowledge bases as separate,
   reusable objects.
4. Do not paste any patient, insurance, or appointment data into the knowledge
   base — that data only ever comes from tool calls at runtime (see the note at the
   top of `RIVERBEND_KNOWLEDGE_BASE.md`).

## 5. Create the tools (custom functions)

For each tool object in `TOOL_DEFINITIONS.json` (`lookup_patient`,
`run_scheduling_workflow`, `get_availability`, `book_appointment`,
`get_existing_appointment`, `reschedule_appointment`, `cancel_appointment`,
`confirm_appointment`, `transfer_front_desk`, `transfer_nurse_line`):

1. In the agent's tools / functions section, add a new custom function.
2. Set the function `name` and `description` exactly as given in the JSON file —
   the description is what the model uses to decide when to call the tool, so
   don't shorten it.
3. Enter the `parameters` JSON schema from the tool's entry (properties + required
   list) into the function's parameter editor. Most Retell function editors accept
   raw JSON Schema directly, matching the `parameters` field in this file.
4. Leave the `url` field for now — see step 6, since none of these are hosted yet.
5. Set `speak_during_execution` / `speak_after_execution` if the platform exposes
   those toggles — the values in `TOOL_DEFINITIONS.json` reflect which calls are
   fast/silent lookups (e.g. `lookup_patient`) versus slower calls worth a filler
   phrase (e.g. `run_scheduling_workflow`, `book_appointment`).

## 6. Configure tool URLs

The Express HTTP adapter in `server/` exposes all 10 custom tools over HTTP. To
make them reachable from Retell:

1. Start the server: `npm run server` (listens on `http://localhost:4000`).
2. Start an ngrok tunnel: `ngrok http 4000` and copy the HTTPS URL.
3. Update each tool's URL in the Retell LLM config to `<ngrok_url>/<route_name>`
   (e.g. `https://<id>.ngrok-free.app/lookup-patient`).

The ngrok URL changes on every restart — tool URLs must be re-updated each session.
The recommended approach is to use the `retell-sdk` npm package to update all tool
URLs programmatically rather than doing it through the dashboard one-by-one.

> **Note:** The legacy Retell MCP server (retell.stlmcp.com) is deprecated and its
> write operations no longer work. Use the Retell SDK or REST API directly instead.

Use only the patients, providers, and appointments already in `clinic-config/` when
testing — see `retell/TEST_CALL_SCRIPT.md` for the specific phone numbers each test
scenario expects.

## 7. Configure transfers

1. In the agent's call-transfer settings, you may be asked to enter static
   destination numbers, or you may be able to leave transfer destination dynamic
   (driven by the `transfer_front_desk` / `transfer_nurse_line` tool call's
   returned number) depending on what the platform supports.
2. If static numbers are required by the platform, use:
   - Front desk: `(555) 010-2000`
   - Nurse line: `(555) 010-2911`
   (Both sourced from `clinic-config/clinicInfo.ts` — same numbers the tools
   return, so behavior stays consistent either way.)
3. Confirm the agent is instructed (per the system prompt) to explain briefly why
   it's transferring before the transfer happens, not silently.

## 8. Test in the playground

1. Open the agent's playground / test-call interface.
2. Run through a handful of scenarios from `retell/TEST_CALL_SCRIPT.md` before
   attempting a full pass — start with one clean success path (e.g. scenario
   "successful follow-up booking") and one clear failure path (e.g. "under-18
   patient") to confirm both directions work before testing everything.
3. Use the exact phone numbers and stated dates of birth from the test script —
   the mock data only recognizes the patients already in `clinic-config/patients.ts`.

## 9. Confirm tool calls are actually firing

1. Most Retell playgrounds show a call transcript with tool-call events inline, or
   a separate "function calls" / "tool calls" panel per turn — check that panel
   after each test call, not just the spoken transcript, since the agent could
   theoretically narrate a plausible-sounding answer without actually calling a
   tool (this is exactly the failure mode `retell/AGENT_BEHAVIOR.md` "Hallucination
   prevention" is meant to prevent — verifying tool calls actually fired is how you
   catch it if the prompt isn't holding).
2. Confirm the parameters sent match what the conversation actually established
   (e.g. the phone number and DOB spoken by the simulated caller, not placeholder
   values).
3. Confirm the tool's response is the one reflected in what the agent says next —
   if the tool returned `ineligible`, the agent shouldn't proceed to offer a slot.

## 10. Save and share the agent

1. Make sure the agent (and its workspace/project, if the platform organizes
   agents that way) is saved, not left in an unsaved draft state.
2. Set sharing/visibility so stakeholders can open and view the agent without
   needing an account on your organization's workspace, if the platform supports
   that.
3. Record the workspace/agent link alongside the other project artifacts
   (architecture write-up, iteration log).

## Related artifacts

- `RIVERBEND_SYSTEM_PROMPT.md` — prompt text for step 3.
- `RIVERBEND_KNOWLEDGE_BASE.md` — content for step 4.
- `TOOL_DEFINITIONS.json` — tool specs for step 5, mock payloads for step 6.
- `TEST_CALL_SCRIPT.md` — scenarios for steps 8–9.
- `AGENT_BEHAVIOR.md` — the design reasoning behind all of the above, useful if a
  setting's intent isn't obvious from the prompt text alone.
