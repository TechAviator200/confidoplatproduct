# Simulation Screenshots — Riverbend Voice Agent

All screenshots captured from the Retell playground during the final simulation pass.
Each scenario shows the simulation result first, followed by the explicit success criteria.

Screenshots are stored in `screenshots/Part 1/` and embedded below in numerical order.

---

## 1 — Booking Simulation

![1 - Booking Simulation Passed](../screenshots/Part%201/1_Booking_Simulation_Passed.png)

![2 - Booking Success Criteria](../screenshots/Part%201/2_Booking_Success_Criteria.png)

---

## 2 — Slot Consistency

![3 - Slot Consistency Passed](../screenshots/Part%201/3_Slot_Consistency_Passed.png)

![4 - Slot Consistency Success Criteria](../screenshots/Part%201/4_Slot_Consistency_Success_Criteria.png)

---

## 3 — Reschedule Simulation

![5 - Reschedule Simulation Passed](../screenshots/Part%201/5_Reschedule_Simulation_Passed.png)

![6 - Reschedule Success Criteria](../screenshots/Part%201/6_Reschedule_Success_Criteria.png)

---

## 4 — Cancellation Simulation

![7 - Cancellation Simulation Passed](../screenshots/Part%201/7_Cancellation_Simulation_Passed.png)

![8 - Cancellation Success Criteria](../screenshots/Part%201/8_Cancellation_Success_Criteria.png)

---

## 5 — Unknown Patient

![9 - Unknown Patient Passed](../screenshots/Part%201/9_Unknown_Patient_Passed.png)

![10 - Unknown Patient Success Criteria](../screenshots/Part%201/10_Unknown_Patient_Success_Criteria.png)

---

## 6 — Inactive Insurance

![11 - Inactive Insurance Passed](../screenshots/Part%201/11_Inactive_Insurance_Passed.png)

![12 - Inactive Insurance Success Criteria](../screenshots/Part%201/12_Inactive_Insurance_Success_Criteria.png)

---

## 7 — Discharged Patient

![13 - Discharged Patient Passed](../screenshots/Part%201/13_Discharged_Patient_Passed.png)

![14 - Discharged Patient Criteria](../screenshots/Part%201/14_Discharged_Patient_Criteria.png)

---

## 8 — Under-18 Patient

![15 - Under 18 Passed](../screenshots/Part%201/15_Under_18_Passed.png)

![16 - Under 18 Criteria](../screenshots/Part%201/16_Under_18_Criteria.png)

---

## 9 — Emergency Escalation

> **Result: Simulation failed — simulator edge case, not an application logic defect.**
>
> The emergency 911 instruction fires correctly (the agent immediately says "If this is a
> medical emergency, please hang up and call 911 now" with no tool calls and no transfer).
> The simulation fails because the Retell test simulator re-injects the emergency prompt
> repeatedly, triggering loop-detection logic that terminates the conversation before the
> scenario reaches its natural conclusion. The underlying agent behavior is correct; only
> the simulator's repeated-injection pattern causes the failure. See `demo/verification.md`
> for the full root-cause analysis.

![17 - Emergency Escalation Failed](../screenshots/Part%201/17_Emergency_Escalation_Failed.png)

![18 - Emergency Escalation Criteria](../screenshots/Part%201/18_Emergency_Escalation_Criteria.png)

---

## 10 — Nurse Line

![19 - Nurse Line Passed](../screenshots/Part%201/19_Nurse_Line_Passed.png)

![20 - Nurse Line Criteria](../screenshots/Part%201/20_Nurse_Line_Criteria.png)

---

## 11 — Transfer Test

![21 - Transfer Test Passed](../screenshots/Part%201/21_Transfer_Test_Passed.png)

![22 - Transfer Test Criteria](../screenshots/Part%201/22_Transfer_Test_Criteria.png)

---

## 12 — FAQ

![23 - FAQ Passed](../screenshots/Part%201/23_FAQ_Passed.png)

![24 - FAQ Criteria](../screenshots/Part%201/24_FAQ_Criteria.png)

---

## Summary

| # | Scenario | Result |
|---|---|---|
| 1 | Booking Simulation | ✅ Pass |
| 2 | Slot Consistency | ✅ Pass |
| 3 | Reschedule Simulation | ✅ Pass |
| 4 | Cancellation Simulation | ✅ Pass |
| 5 | Unknown Patient | ✅ Pass |
| 6 | Inactive Insurance | ✅ Pass |
| 7 | Discharged Patient | ✅ Pass |
| 8 | Under-18 Patient | ✅ Pass |
| 9 | Emergency Escalation | ⚠️ Simulator edge case (agent logic correct) |
| 10 | Nurse Line | ✅ Pass |
| 11 | Transfer Test | ✅ Pass |
| 12 | FAQ | ✅ Pass |

**11 of 12 simulations pass. The one failing simulation (Emergency Escalation) is caused
by the Retell simulator's repeated-injection pattern, not by a defect in the agent's
emergency handling logic.**
