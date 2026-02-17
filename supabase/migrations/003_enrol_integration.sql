-- ============================================
-- Enrol Studio ↔ LearnStudio Integration
-- Migration: 003_enrol_integration.sql
-- 
-- Adds cross-platform integration:
-- - Form → Course mapping in Enrol Studio
-- - Auto-enrollment trigger when stage = "Enrolled"
-- - Shared user linking
-- ============================================

-- ============================================
-- EXTEND ENROL STUDIO FORMS TABLE
-- ============================================

-- Add LearnStudio course mapping to forms
ALTER TABLE forms ADD COLUMN IF NOT EXISTS learnstudio_course_id UUID;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS learnstudio_org_id UUID;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS learnstudio_send_welcome_email BOOLEAN DEFAULT TRUE;

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_forms_learnstudio_course 
  ON forms(learnstudio_course_id) 
  WHERE learnstudio_course_id IS NOT NULL;

-- ============================================
-- SUBMISSION → USER LINKING
-- ============================================

-- Add user_id to submissions if not exists (for logged-in applicants)
-- This links submission to auth user for SSO
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_submissions_user 
  ON submissions(user_id) 
  WHERE user_id IS NOT NULL;

-- ============================================
-- AUTO-ENROLLMENT TRIGGER
-- ============================================

-- Function: Create LearnStudio enrollment when submission moves to "Enrolled" stage
CREATE OR REPLACE FUNCTION on_submission_enrolled()
RETURNS TRIGGER AS $$
DECLARE
  enrolled_stage_id UUID;
  course_id UUID;
  org_id UUID;
  applicant_user_id UUID;
  applicant_email TEXT;
  applicant_name TEXT;
  send_email BOOLEAN;
BEGIN
  -- Find the "Enrolled" stage for this form
  SELECT id INTO enrolled_stage_id
  FROM pipeline_stages
  WHERE form_id = NEW.form_id
  AND LOWER(name) IN ('enrolled', 'accepted', 'approved')
  LIMIT 1;
  
  -- If no enrolled stage found or not moving to it, skip
  IF enrolled_stage_id IS NULL OR NEW.stage_id != enrolled_stage_id THEN
    RETURN NEW;
  END IF;
  
  -- Get LearnStudio course mapping from form
  SELECT 
    f.learnstudio_course_id,
    f.learnstudio_org_id,
    f.learnstudio_send_welcome_email
  INTO course_id, org_id, send_email
  FROM forms f
  WHERE f.id = NEW.form_id;
  
  -- If no course mapped, skip
  IF course_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get applicant info from submission data
  applicant_email := NEW.data->>'email';
  applicant_name := COALESCE(
    NEW.data->>'full_name',
    NEW.data->>'name',
    CONCAT(NEW.data->>'first_name', ' ', NEW.data->>'last_name')
  );
  applicant_user_id := NEW.user_id;
  
  -- If no user_id on submission, try to find or create user by email
  IF applicant_user_id IS NULL AND applicant_email IS NOT NULL THEN
    -- Look up existing user by email
    SELECT id INTO applicant_user_id
    FROM users
    WHERE LOWER(email) = LOWER(applicant_email);
    
    -- If user exists, link submission to user
    IF applicant_user_id IS NOT NULL THEN
      UPDATE submissions SET user_id = applicant_user_id WHERE id = NEW.id;
    END IF;
  END IF;
  
  -- Only create enrollment if we have a user
  IF applicant_user_id IS NOT NULL THEN
    -- Create enrollment (ignore if already exists)
    INSERT INTO enrollments (
      org_id,
      user_id,
      course_id,
      status,
      enrolled_at,
      metadata
    ) VALUES (
      org_id,
      applicant_user_id,
      course_id,
      'active',
      NOW(),
      jsonb_build_object(
        'source', 'enrol_studio',
        'submission_id', NEW.id,
        'form_id', NEW.form_id
      )
    )
    ON CONFLICT (user_id, course_id) DO NOTHING;
    
    -- Log activity in Enrol Studio
    INSERT INTO activities (
      submission_id,
      type,
      description,
      metadata
    ) VALUES (
      NEW.id,
      'learnstudio_enrollment',
      'Enrolled in LearnStudio course',
      jsonb_build_object(
        'course_id', course_id,
        'org_id', org_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on submissions stage change
DROP TRIGGER IF EXISTS on_submission_stage_to_enrolled ON submissions;
CREATE TRIGGER on_submission_stage_to_enrolled
  AFTER UPDATE ON submissions
  FOR EACH ROW
  WHEN (OLD.stage_id IS DISTINCT FROM NEW.stage_id)
  EXECUTE FUNCTION on_submission_enrolled();

-- Also trigger on initial stage assignment (for new submissions starting as enrolled)
DROP TRIGGER IF EXISTS on_new_submission_enrolled ON submissions;
CREATE TRIGGER on_new_submission_enrolled
  AFTER INSERT ON submissions
  FOR EACH ROW
  WHEN (NEW.stage_id IS NOT NULL)
  EXECUTE FUNCTION on_submission_enrolled();

-- ============================================
-- HELPER FUNCTION: GET USER'S ENROL SUBMISSIONS
-- ============================================

-- Get all submissions for a user (for showing in LearnStudio)
CREATE OR REPLACE FUNCTION get_user_enrol_submissions(p_user_id UUID)
RETURNS TABLE (
  submission_id UUID,
  form_title TEXT,
  stage_name TEXT,
  submitted_at TIMESTAMPTZ,
  course_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS submission_id,
    f.title AS form_title,
    ps.name AS stage_name,
    s.created_at AS submitted_at,
    f.learnstudio_course_id AS course_id
  FROM submissions s
  JOIN forms f ON s.form_id = f.id
  LEFT JOIN pipeline_stages ps ON s.stage_id = ps.id
  WHERE s.user_id = p_user_id
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: CHECK IF USER HAS LEARNSTUDIO ACCESS
-- ============================================

CREATE OR REPLACE FUNCTION user_has_learnstudio_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = p_user_id
    AND status IN ('active', 'completed')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
