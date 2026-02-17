# LearnStudio Build Strategy

## Vision
Make LearnStudio the best LMS platform with **usage-based pricing** — organizations only pay for what they use.

## Pricing Philosophy

### Traditional LMS (what we're disrupting)
- Fixed monthly tiers ($99/mo, $299/mo, etc.)
- Pay for features you might never use
- Hidden limits that force upgrades

### LearnStudio Model (pay-for-what-you-use)
- **Base fee**: $0/mo (free tier exists)
- **Per active student**: $2/student/month (only students who logged in)
- **Video hosting**: $0.10/GB stored + $0.05/GB streamed
- **Certificates**: $0.50/certificate issued
- **Custom domain**: $10/mo add-on
- **Quizzes**: Included (encourages engagement)
- **Courses**: Unlimited (no artificial limits)

### Why This Wins
1. **Low barrier to entry** — Start free, scale as you grow
2. **Aligned incentives** — We make money when customers succeed
3. **Transparent** — No surprise bills, real-time usage dashboard
4. **Competitive** — Teachable/Thinkific charge $99-299/mo for fewer features

---

## Technical Requirements for Usage-Based Billing

### New Database Tables
```sql
-- Usage Events (append-only log)
usage_events (
  id, org_id, event_type, quantity, 
  metadata, created_at
)

-- Monthly Usage Snapshots
usage_snapshots (
  id, org_id, month, 
  active_students, video_storage_gb, 
  video_bandwidth_gb, certificates_issued,
  calculated_amount, finalized
)

-- Billing
invoices (
  id, org_id, stripe_invoice_id,
  period_start, period_end,
  amount, status, line_items
)
```

### Event Types
- `student.active` — Student logged in this month
- `video.upload` — Video uploaded (bytes)
- `video.stream` — Video streamed (bytes)
- `certificate.issued` — Certificate generated
- `course.created` — Course added

---

## Build Phases

### Phase 1: Foundation (Week 1)
**Parallel Tracks:**
- **Auth Agent**: Supabase Auth, login/register, middleware, protected routes
- **UI Agent**: Landing page, core layout, shadcn/ui setup, responsive design
- **DB Agent**: Usage tracking tables, billing schema migration

**Deliverables:**
- Working auth flow
- Marketing landing page
- Extended database schema

### Phase 2: Multi-Tenant Core (Week 2)
**Parallel Tracks:**
- **Tenant Agent**: Org creation, subdomain routing, branding settings
- **Dashboard Agent**: Org admin dashboard, team management, settings

**Deliverables:**
- Org signup flow
- Tenant isolation working
- Admin dashboard shell

### Phase 3: Course Builder (Week 3)
**Parallel Tracks:**
- **Course Agent**: Course CRUD, module/lesson editor, drag-drop
- **Video Agent**: Mux/Bunny integration, upload, HLS player, progress

**Deliverables:**
- Full course builder
- Video upload + playback
- Usage tracking for video

### Phase 4: Student Experience (Week 4)
**Parallel Tracks:**
- **Catalog Agent**: Course catalog, enrollment flow, student dashboard
- **Learning Agent**: Video player, progress tracking, lesson completion

**Deliverables:**
- Student-facing experience
- Progress persistence
- Active student tracking

### Phase 5: Assessments & Certificates (Week 5)
**Parallel Tracks:**
- **Quiz Agent**: Quiz builder, taking interface, auto-grading
- **Cert Agent**: Certificate templates, PDF generation, verification

**Deliverables:**
- Working quiz system
- Beautiful certificates
- Public verification

### Phase 6: Payments & Polish (Week 6)
**Parallel Tracks:**
- **Billing Agent**: Stripe integration, usage metering, invoicing
- **Polish Agent**: Mobile optimization, error handling, performance

**Deliverables:**
- Usage-based billing live
- Production-ready polish

---

## Immediate Next Steps

1. **Create usage tracking migration** (extend existing schema)
2. **Spawn Phase 1 agents:**
   - Auth Agent → `learnstudio-auth`
   - UI Agent → `learnstudio-ui`
3. **Set up Supabase project** (if not already)

---

## Quality Standards

- **TypeScript strict mode** — No `any` types
- **Server Components default** — Client only when needed
- **API routes for mutations** — Not direct Supabase calls from client
- **Mobile-first** — Responsive from the start
- **Accessibility** — WCAG 2.1 AA compliant
- **Testing** — E2E tests for critical flows

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-18 | Usage-based pricing | D wants users to only pay for what they use |
| 2026-02-18 | Supabase backend | Already in place, great RLS support |
| 2026-02-18 | shadcn/ui | Matches existing projects, highly customizable |
