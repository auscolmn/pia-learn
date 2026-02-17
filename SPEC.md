# LearnStudio — Multi-Tenant LMS Platform

## Overview

A white-label online education platform (like Teachable/Thinkific) that organizations can use to host their courses. Built as a SaaS product.

**First Client:** Psychedelic Institute Australia (PIA)

## Business Model

- **Platform:** LearnStudio (you own it)
- **Tenants:** Organizations (PIA, others)
- **Revenue:** Per-tenant subscription or revenue share

---

## Architecture: Multi-Tenant

### Tenant Isolation
- Each organization has isolated data
- Custom branding per tenant
- Custom domain support (learn.pia.com.au)
- Separate student pools

### User Roles (Platform Level)
- **Super Admin:** Platform owner (you)
- **Org Admin:** Organization administrators
- **Instructor:** Course creators within an org
- **Student:** Learners enrolled in org courses

---

## Core Features

### For Organizations (Tenants)
- Create and manage courses
- Upload video content
- Build quizzes/assessments
- Issue certificates
- Manage students
- View analytics
- Custom branding (logo, colors, domain)
- Stripe Connect for payments

### For Students
- Browse org's course catalog
- Purchase/enroll in courses
- Watch video lessons
- Track progress
- Take quizzes
- Download certificates
- Community/discussions

### For Platform Admin (You)
- Manage all organizations
- Platform analytics
- Billing management
- Feature flags per org

---

## Technical Architecture

### Stack
- **Frontend:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui (Enrol Studio branding)
- **Backend:** Supabase (Auth, Database, Storage)
- **Payments:** Stripe Connect (multi-tenant)
- **Video:** Mux or Bunny.net
- **Hosting:** Vercel

### Database Schema (Multi-Tenant)

```
organizations
  - id, name, slug
  - logo_url, primary_color, custom_css
  - custom_domain
  - stripe_account_id
  - plan (free/pro/enterprise)
  - created_at

org_members
  - id, org_id, user_id
  - role (admin/instructor)
  - created_at

users
  - id, email, name, avatar_url
  - created_at

courses
  - id, org_id, title, slug
  - description, thumbnail_url
  - instructor_id
  - price, currency
  - status (draft/published)
  - created_at

modules
  - id, course_id, title, order

lessons
  - id, module_id, title, order
  - type (video/text/quiz)
  - video_url, content, duration
  - is_preview

enrollments
  - id, org_id, user_id, course_id
  - status, progress_percent
  - enrolled_at, completed_at

lesson_progress
  - id, enrollment_id, lesson_id
  - completed, watch_time

quizzes / quiz_questions / quiz_attempts
  (same as before, scoped to org)

certificates
  - id, org_id, user_id, course_id
  - certificate_number
  - issued_at, pdf_url
```

### URL Structure

```
# Platform (main site)
learnstudio.com              → Marketing site
learnstudio.com/login        → Platform login
learnstudio.com/admin        → Platform admin

# Tenant Sites (subdomains or custom domains)
pia.learnstudio.com          → PIA's course site
learn.pia.com.au             → PIA custom domain
pia.learnstudio.com/courses  → PIA course catalog
pia.learnstudio.com/admin    → PIA org admin
```

---

## Pages Structure

### Platform (learnstudio.com)
```
/                     → Marketing landing page
/pricing              → Plans for organizations
/login                → Platform login
/register             → New org signup
/admin                → Super admin dashboard
/admin/orgs           → Manage organizations
/admin/billing        → Platform revenue
```

### Tenant Site (org.learnstudio.com)
```
/                     → Org landing/catalog
/courses              → Course catalog
/courses/[slug]       → Course details
/courses/[slug]/learn → Learning interface
/dashboard            → Student dashboard
/admin                → Org admin dashboard
/admin/courses        → Manage courses
/admin/courses/new    → Course builder
/admin/students       → Student management
/admin/settings       → Org branding settings
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Project setup (match Enrol Studio branding)
- [ ] Multi-tenant database schema
- [ ] Organization CRUD
- [ ] Auth with org context
- [ ] Platform landing page
- [ ] Tenant routing (subdomains)

### Phase 2: Org Admin
- [ ] Org admin dashboard
- [ ] Branding settings
- [ ] Team management (invite instructors)

### Phase 3: Course Builder
- [ ] Course CRUD
- [ ] Module/lesson editor
- [ ] Video upload (Mux/Bunny)
- [ ] Quiz builder

### Phase 4: Student Experience
- [ ] Org landing page (catalog)
- [ ] Course enrollment
- [ ] Video player + progress
- [ ] Quiz taking
- [ ] Certificates

### Phase 5: Payments
- [ ] Stripe Connect setup
- [ ] Org onboarding flow
- [ ] Course purchases
- [ ] Revenue split

### Phase 6: Polish
- [ ] Custom domains
- [ ] Analytics
- [ ] Mobile optimization
- [ ] PIA launch

---

## Design System

**Match Enrol Studio branding:**
- Primary: Indigo #6366F1
- Secondary: Light Indigo #818CF8
- CTA: Emerald #10B981
- Background: Soft Purple #F5F3FF
- Text: Dark Indigo #1E1B4B

**Typography:**
- Plus Jakarta Sans (body)
- Consistent with Enrol Studio

---

## First Client: PIA

**Setup for PIA:**
- Org slug: `pia`
- Custom domain: `learn.psychedelicinstitute.com.au`
- Branding: PIA colors (teal/cream)
- Integration: AP Connect (graduate badges)
