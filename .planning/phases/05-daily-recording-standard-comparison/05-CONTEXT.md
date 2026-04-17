# 5-CONTEXT.md — Phase 5: Daily Recording & Standard Comparison

## Prior Context Applied
- PROJECT.md: Full tech stack, code quality standards
- REQUIREMENTS.md: FR-5 Daily Recording, FR-8 Standard Comparison
- ROADMAP.md: Phase 5 goals and deliverables
- Phase 1-4 context: All prior decisions locked

## Decisions Made (This Phase)

### D-01: Recording Validation Rules
- **Future dates**: ❌ Reject with 400 error
- **Completed/Failed cycles**: 400 error — cannot record for non-active cycles
- **Population logic**: Auto-calculate from previous day, allow manual override with warning
- **Day age**: Auto-calculated from cycle.chickInDate + recording.date

### D-02: Auto-calculation Metrics
- **Cumulative Mortality (%)** = (Total dead + Total culled) / Initial population × 100
- **Deplesi (%)** = (Initial population - Remaining population) / Initial population × 100
- **SR (Survival Rate) %** = (Remaining population / Initial population) × 100 = 100 - Deplesi%
- **Running FCR** = Cumulative feed consumed (kg) / Cumulative weight gain (kg)
  - FCR starts calculation at day age ≥ 7 (before that returns null/0)
  - Initial BW assumed 40g for DOC day 0

### D-03: Standard Comparison Display
- **Deviation in grams** = Actual BW (g) - Standard BW (g)
- **Deviation in %** = ((Actual - Standard) / Standard) × 100
- **Standard lookup**: By DOC type (CP, Patriot, Ayam Unggul, MBU) + day age
- **Missing standards**: Return null/deviation without error, no exception thrown
- **Response format**:
```typescript
{
  deviation: {
    grams: number,
    percent: number,
    status: "above_standard" | "on_standard" | "below_standard"
  },
  standardBwG?: number,
  actualBwG: number
}
```

### D-04: Bulk Recording Format
- **Required CSV columns**: date, dead, culled, remaining_population, body_weight_g, feed_consumed_kg, notes (optional)
- **Date format**: YYYY-MM-DD
- **Validation**: All required columns, date format, non-negative numbers, cycle exists + active
- **Error handling**: Row-by-row processing, skip on error, continue to next row
- **Response format**: `{ success: true, created: N, errors: [{ row: 1, error: "..." }] }`
- **Limits**: UTF-8 encoding, max 1000 rows per request

### D-05: IP Calculation Formula
- **Formula**: Simplified weighted scoring
```
IP = (SR% × 0.4) + (BW_achievement% × 0.3) + (FCR_achievement% × 0.3)
```
- **Components**:
  - SR% = (Final population / Initial population) × 100
  - BW_achievement% = Actual BW / Standard BW for that day age × 100
  - FCR_achievement% = Standard FCR / Actual FCR × 100 (inverted — lower FCR is better)
- **When calculated**: At cycle completion (POST /api/cycles/:id/complete)
- **Stored where**: cycles.ip column (decimal)

### D-06: Schema Usage
- **daily_recordings** table already exists with fields: cycle_id, recording_date, day_age, dead, culled, remaining_population, body_weight_g, feed_consumed_kg, notes
- **standards** table already exists with fields: doc_type, day_age, standard_bw_g, standard_fcr, daily_gain_g, cum_feed_intake_g
- No schema changes needed — tables ready

### D-07: API Endpoints (In Scope)
- `POST /api/recordings` — Create daily recording with auto-calculations
- `GET /api/recordings?cycleId=` — List recordings for a cycle
- `GET /api/recordings/:id` — Get single recording with deviation
- `PUT /api/recordings/:id` — Update recording (recalculates)
- `DELETE /api/recordings/:id` — Soft delete recording
- `POST /api/recordings/bulk` — Bulk import from CSV
- `GET /api/cycles/:id/summary` — Get cycle summary with IP, cumulative metrics

### D-08: Endpoints Not In Scope (Deferred)
- Real-time notifications → Phase 10 (monitoring)
- Auto-alerts for deviations → Phase 10 (monitoring)
- Advanced analytics/reports → Phase 7

## Locked Decisions (From Prior Context — Do NOT Re-Ask)
- Tenant isolation via X-Tenant-ID header
- RBAC permission guards on all endpoints
- Fire-and-forget audit logging
- Soft-delete pattern with deleted_at
- Error classes per module pattern
- No `as any`, no `@ts-ignore`
- JSDoc on all exported functions

## Gray Areas Resolved
| Question | Decision |
|----------|----------|
| Future date validation? | Reject with 400 error |
| Cycle status check? | 400 error for completed/failed cycles |
| FCR calculation start? | Day age ≥ 7 only |
| Standard not found? | Return null, no error |
| Bulk import limit? | Max 1000 rows |
| IP formula? | Simplified weighted (SR×0.4 + BW×0.3 + FCR×0.3) |

## Deferred Ideas (Not This Phase)
- Real-time deviation alerts (push notifications)
- Auto-triggered actions when below threshold
- Historical trend analysis charts
- Multi-cycle comparison reports

## Next Steps
1. Run `/gsd-plan-phase 5` to create detailed execution plan
2. Planner will use this CONTEXT.md to know all decisions are locked