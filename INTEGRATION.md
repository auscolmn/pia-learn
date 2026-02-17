# Enrol Studio ↔ LearnStudio Integration

## The Flow

```
┌─────────────────┐         ┌─────────────────┐
│  Enrol Studio   │         │  LearnStudio    │
│  (Enrollment)   │────────▶│   (Learning)    │
└─────────────────┘         └─────────────────┘
       │                           │
  1. Student applies          4. Student accesses
  2. Admin reviews               course content
  3. Moves to "Enrolled"      5. Tracks progress
       │                      6. Gets certificate
       └──── triggers ────────▶
```

## Integration Points

### 1. When Submission Moves to "Enrolled" Stage

**In Enrol Studio:**
- Pipeline has stages (e.g., "Applied" → "Reviewing" → "Enrolled")
- When admin moves submission to "Enrolled" stage...

**Trigger:**
```typescript
// In Enrol Studio pipeline update
async function onStageChange(submissionId: string, newStage: string) {
  if (newStage === 'enrolled') {
    await createLearnStudioEnrollment(submissionId);
  }
}
```

**What happens:**
1. Look up which course(s) this form maps to
2. Create user in LearnStudio (if not exists)
3. Create enrollment record in LearnStudio
4. Send welcome email with course access link

### 2. "Access Your Courses" Button

**Location:** Enrol Studio dashboard (for enrolled students)

**Shows when:**
- User has at least one submission in "Enrolled" stage
- OR user has LearnStudio enrollments

**Button action:**
- Links to `learnstudio.com/dashboard` (or tenant subdomain)
- Uses SSO / shared session
- Auto-creates LearnStudio user if needed

### 3. Form → Course Mapping

**In Enrol Studio admin:**
- When creating/editing a form
- Add field: "LearnStudio Course" (dropdown of available courses)
- When student is enrolled via this form → auto-enroll in mapped course

**Schema addition (Enrol Studio):**
```sql
ALTER TABLE forms ADD COLUMN learnstudio_course_id UUID;
ALTER TABLE forms ADD COLUMN learnstudio_org_id UUID;
```

---

## Implementation Options

### Option A: Shared Supabase (Recommended for PIA)

Both apps use the **same Supabase project**.

**Pros:**
- Single auth, single user table
- Direct database triggers possible
- No API latency
- Simplest to implement

**Cons:**
- Tightly coupled
- Both apps share same DB limits

**How:**
1. LearnStudio tables live alongside Enrol Studio tables
2. Add trigger: when `submissions.stage_id` changes to enrolled stage → insert into `learnstudio.enrollments`
3. Auth is automatically shared

### Option B: Webhook Integration (For Separate Deployments)

Enrol Studio sends webhook to LearnStudio API.

**Pros:**
- Decoupled systems
- Can be separate Supabase projects
- Better for white-label scenarios

**Cons:**
- Need API endpoint + auth
- Webhook reliability concerns
- More complex

**How:**
1. LearnStudio exposes `POST /api/webhooks/enrollment`
2. Enrol Studio calls this when stage changes
3. Signed with shared secret

### Option C: OAuth/SSO Bridge

Use OAuth to link accounts.

**Pros:**
- Clean separation
- User-initiated linking
- Standard protocols

**Cons:**
- Most complex
- Requires OAuth server
- User friction (must "connect" accounts)

---

## Recommended Implementation (Option A)

For PIA's use case, **shared Supabase** makes the most sense:

### Step 1: Database Trigger

```sql
-- In Enrol Studio's Supabase
CREATE OR REPLACE FUNCTION on_enrollment_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if moving to enrolled stage
  IF NEW.stage_id = (SELECT id FROM pipeline_stages WHERE name = 'Enrolled' LIMIT 1) THEN
    -- Get the form's mapped LearnStudio course
    SELECT learnstudio_course_id, learnstudio_org_id 
    INTO course_id, org_id
    FROM forms WHERE id = NEW.form_id;
    
    IF course_id IS NOT NULL THEN
      -- Create LearnStudio enrollment
      INSERT INTO learnstudio_enrollments (
        org_id, user_id, course_id, enrolled_at
      ) VALUES (
        org_id, 
        (SELECT user_id FROM submissions WHERE id = NEW.id),
        course_id,
        NOW()
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_stage_change
  AFTER UPDATE ON submissions
  FOR EACH ROW
  WHEN (OLD.stage_id IS DISTINCT FROM NEW.stage_id)
  EXECUTE FUNCTION on_enrollment_stage_change();
```

### Step 2: Form Settings UI (Enrol Studio)

Add to form editor:
- "Connect to LearnStudio" section
- Course selector dropdown (fetches from LearnStudio)
- Save mapping to `forms.learnstudio_course_id`

### Step 3: Student Access Button

In Enrol Studio student view:
```tsx
// components/CourseAccessButton.tsx
export function CourseAccessButton({ enrollments }) {
  if (enrollments.length === 0) return null;
  
  return (
    <Link href="https://learn.psychedelicinstitute.com.au/dashboard">
      <Button>
        <GraduationCap className="mr-2 h-4 w-4" />
        Access Your Courses
      </Button>
    </Link>
  );
}
```

---

## UI Mockup

### Enrol Studio Dashboard (Enrolled Student)

```
┌─────────────────────────────────────────────────────────┐
│ Welcome back, Sarah                                      │
│                                                          │
│ ┌─────────────────────┐  ┌─────────────────────────────┐│
│ │ Your Applications   │  │ Your Courses               ││
│ │                     │  │                             ││
│ │ ✅ Practitioner     │  │ You have 2 active courses  ││
│ │    Training         │  │                             ││
│ │    Status: Enrolled │  │ [Access Your Courses →]    ││
│ │                     │  │                             ││
│ └─────────────────────┘  └─────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Enrol Studio Admin - Form Settings

```
┌─────────────────────────────────────────────────────────┐
│ Form Settings                                            │
│                                                          │
│ Title: Practitioner Training Application                 │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ 🎓 LearnStudio Integration                              │
│                                                          │
│ When applicants are enrolled, grant access to:          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Psychedelic Practitioner Certification    ▼        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ □ Send welcome email with course link                   │
│ □ Also grant access to prerequisite courses             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Decide:** Shared Supabase or separate?
2. **Add form field:** `learnstudio_course_id` to Enrol Studio forms table
3. **Build UI:** Course selector in form settings
4. **Add trigger:** Database trigger for enrollment
5. **Add button:** "Access Courses" in student dashboard
