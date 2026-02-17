# PIA Learn — Education Hub

## Overview

Online education platform for Psychedelic Institute Australia. Professional training courses for practitioners entering the psychedelic-assisted therapy space.

## Core Functions

### For Learners (Students)
- Browse & enroll in courses
- Watch video lessons
- Download resources (PDFs, guides)
- Take quizzes/assessments
- Track progress across courses
- Earn certificates upon completion
- Access community/discussion forums
- View CPD points earned

### For Instructors
- Upload video content
- Create course structure (modules → lessons)
- Add resources/downloads
- Create quizzes with auto-grading
- View student progress
- Respond to discussions

### For Admins (PIA Team)
- Manage all courses & content
- Manage users (students, instructors)
- View revenue & payments
- Issue/revoke certificates
- Analytics dashboard
- Manage discount codes/promotions

### Ecosystem Integration
- Graduates auto-verified in AP Connect ("PIA Trained" badge)
- Certificate validation API
- CPD tracking for AHPRA compliance
- SSO across PIA properties

---

## User Flows

### Student Journey
```
1. Discover → Landing page / course catalog
2. Browse → Course details, curriculum preview
3. Purchase → Stripe checkout
4. Learn → Video lessons, progress tracking
5. Assess → Quizzes, assignments
6. Complete → Certificate issued
7. Connect → Listed on AP Connect with badge
```

### Instructor Flow
```
1. Login → Instructor dashboard
2. Create → New course wizard
3. Build → Add modules, lessons, videos
4. Publish → Review & go live
5. Monitor → Student progress, Q&A
```

### Admin Flow
```
1. Overview → Dashboard (revenue, enrollments, completion rates)
2. Manage → Courses, users, certificates
3. Configure → Pricing, promotions, settings
```

---

## Technical Architecture

### Stack
- **Frontend:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, Database, Storage)
- **Payments:** Stripe (subscriptions + one-time)
- **Video:** Mux or Bunny.net (HLS streaming, DRM)
- **Email:** Buttondown API or Resend
- **Hosting:** Vercel

### Database Schema (Core Tables)
```
users
  - id, email, name, role (student/instructor/admin)
  - avatar_url, bio
  - created_at

courses
  - id, title, slug, description
  - instructor_id, thumbnail_url
  - price, currency
  - status (draft/published/archived)
  - created_at, published_at

modules
  - id, course_id, title, order
  
lessons
  - id, module_id, title, order
  - type (video/text/quiz)
  - video_url, content, duration
  - is_free_preview

enrollments
  - id, user_id, course_id
  - status (active/completed/refunded)
  - progress_percent
  - enrolled_at, completed_at

lesson_progress
  - id, enrollment_id, lesson_id
  - completed, completed_at
  - watch_time

quizzes
  - id, lesson_id, title
  - passing_score

quiz_questions
  - id, quiz_id, question, type
  - options (JSON), correct_answer

quiz_attempts
  - id, user_id, quiz_id
  - score, passed, completed_at

certificates
  - id, user_id, course_id
  - certificate_number
  - issued_at, pdf_url
```

### API Endpoints
```
/api/courses - List, create courses
/api/courses/[slug] - Get course details
/api/courses/[slug]/enroll - Enroll (Stripe)
/api/lessons/[id] - Get lesson content
/api/lessons/[id]/complete - Mark complete
/api/quizzes/[id]/submit - Submit quiz
/api/certificates/[id] - Get certificate
/api/certificates/verify - Public validation
```

---

## Pages Structure

```
/                     → Landing page
/courses              → Course catalog
/courses/[slug]       → Course details + curriculum
/courses/[slug]/learn → Learning interface (enrolled)
/dashboard            → Student dashboard
/dashboard/courses    → My enrolled courses
/dashboard/certificates → My certificates

/instructor           → Instructor dashboard
/instructor/courses   → Manage courses
/instructor/courses/new → Create course
/instructor/courses/[id]/edit → Edit course

/admin                → Admin dashboard
/admin/users          → Manage users
/admin/courses        → All courses
/admin/certificates   → Certificate management
/admin/analytics      → Platform analytics
```

---

## Design Direction

- **Aesthetic:** Warm professional (matches AP Connect)
- **Colors:** Teal primary + cream background + gold accents
- **Typography:** Instrument Serif headings + Plus Jakarta Sans body
- **Feel:** Premium education, not generic LMS

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (Next.js, Supabase, Tailwind)
- [ ] Auth system (login, register, roles)
- [ ] Database schema
- [ ] Landing page
- [ ] Course catalog (list view)
- [ ] Course detail page

### Phase 2: Enrollment & Payments (Week 2-3)
- [ ] Stripe integration
- [ ] Checkout flow
- [ ] Enrollment management
- [ ] Student dashboard

### Phase 3: Learning Experience (Week 3-4)
- [ ] Video player (Mux/Bunny integration)
- [ ] Lesson progress tracking
- [ ] Course navigation
- [ ] Resource downloads

### Phase 4: Assessments & Certificates (Week 4-5)
- [ ] Quiz builder (admin)
- [ ] Quiz taking (student)
- [ ] Auto-grading
- [ ] Certificate generation (PDF)
- [ ] Certificate verification API

### Phase 5: Instructor Tools (Week 5-6)
- [ ] Instructor dashboard
- [ ] Course builder wizard
- [ ] Video upload
- [ ] Analytics per course

### Phase 6: Admin & Polish (Week 6-7)
- [ ] Admin dashboard
- [ ] User management
- [ ] Revenue reports
- [ ] AP Connect integration
- [ ] Performance optimization

---

## Success Metrics

- Course completion rate > 70%
- Student satisfaction > 4.5/5
- Certificate verification API uptime 99.9%
- Page load < 2s

---

## Future Features (Post-Launch)

- Live cohort-based courses
- Discussion forums
- Mobile app
- SCORM support
- Enterprise/team licenses
- Integration with external CPD systems
