# PIA Learn — Implementation Plan

## Phase 1: Foundation ✅ IN PROGRESS

### 1.1 Project Setup
- [ ] Initialize Next.js 15 project
- [ ] Configure Tailwind CSS + shadcn/ui
- [ ] Set up project structure
- [ ] Add Instrument Serif + Plus Jakarta Sans fonts
- [ ] Create base layout and globals.css
- [ ] Set up Supabase project
- [ ] Configure environment variables

### 1.2 Authentication
- [ ] Supabase Auth integration
- [ ] Login page
- [ ] Register page
- [ ] Password reset flow
- [ ] Role-based middleware (student/instructor/admin)
- [ ] Protected routes

### 1.3 Database Schema
- [ ] Create migration file
- [ ] Users table (extends auth.users)
- [ ] Courses table
- [ ] Modules table
- [ ] Lessons table
- [ ] Enrollments table
- [ ] Row Level Security policies

### 1.4 Core Pages
- [ ] Landing page (hero, features, CTA)
- [ ] Course catalog page
- [ ] Course detail page (curriculum preview)

---

## Phase 2: Enrollment & Payments

### 2.1 Stripe Integration
- [ ] Stripe account setup
- [ ] Product/price creation
- [ ] Checkout session API
- [ ] Webhook handler (payment success)
- [ ] Customer portal (manage subscription)

### 2.2 Enrollment Flow
- [ ] Enroll button → Stripe checkout
- [ ] Post-payment enrollment creation
- [ ] Access control (enrolled students only)
- [ ] Enrollment status management

### 2.3 Student Dashboard
- [ ] Dashboard layout
- [ ] My courses list
- [ ] Continue learning cards
- [ ] Progress overview

---

## Phase 3: Learning Experience

### 3.1 Video Infrastructure
- [ ] Mux or Bunny.net account
- [ ] Video upload API
- [ ] HLS streaming player
- [ ] Progress tracking (watch time)

### 3.2 Lesson Interface
- [ ] Course learning layout
- [ ] Sidebar navigation (modules/lessons)
- [ ] Video player component
- [ ] Mark complete button
- [ ] Next lesson navigation
- [ ] Resource downloads

### 3.3 Progress Tracking
- [ ] Lesson completion API
- [ ] Course progress calculation
- [ ] Progress persistence
- [ ] Resume functionality

---

## Phase 4: Assessments & Certificates

### 4.1 Quiz System
- [ ] Quiz data model
- [ ] Quiz display component
- [ ] Answer submission
- [ ] Auto-grading logic
- [ ] Results display
- [ ] Retry logic

### 4.2 Certificate Generation
- [ ] Certificate template (PDF)
- [ ] Dynamic generation (name, course, date)
- [ ] Unique certificate numbers
- [ ] Storage in Supabase
- [ ] Download endpoint

### 4.3 Verification
- [ ] Public verification page
- [ ] API endpoint for AP Connect
- [ ] QR code on certificate

---

## Phase 5: Instructor Tools

### 5.1 Instructor Dashboard
- [ ] Dashboard overview (students, revenue)
- [ ] Course list (my courses)
- [ ] Student management

### 5.2 Course Builder
- [ ] Create course wizard
- [ ] Module/lesson editor
- [ ] Drag-drop reordering
- [ ] Video upload interface
- [ ] Quiz builder
- [ ] Publish/unpublish

---

## Phase 6: Admin & Polish

### 6.1 Admin Dashboard
- [ ] Platform overview
- [ ] User management
- [ ] All courses view
- [ ] Revenue reports
- [ ] Certificate management

### 6.2 Integration
- [ ] AP Connect API (graduate verification)
- [ ] Webhook on course completion
- [ ] Badge issuance

### 6.3 Polish
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] SEO optimization
- [ ] Performance audit

---

## Current Sprint: Phase 1.1 - Project Setup

**Today's Tasks:**
1. ✅ Create project folder
2. ✅ Write spec document
3. ✅ Write implementation plan
4. [ ] Initialize Next.js
5. [ ] Configure styling
6. [ ] Create landing page
7. [ ] Push to GitHub
