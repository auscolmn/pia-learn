-- LearnStudio Multi-Tenant LMS Schema
-- Migration: 001_initial_schema.sql

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CUSTOM TYPES
-- ============================================
CREATE TYPE org_plan AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE org_member_role AS ENUM ('admin', 'instructor');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE lesson_type AS ENUM ('video', 'text', 'quiz');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled', 'expired');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate unique certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
    cert_num TEXT;
BEGIN
    cert_num := 'LS-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
    RETURN cert_num;
END;
$$ LANGUAGE plpgsql;

-- Get current user's org memberships
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT org_id FROM org_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is org admin
CREATE OR REPLACE FUNCTION is_org_admin(check_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM org_members 
        WHERE org_id = check_org_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is org member (admin or instructor)
CREATE OR REPLACE FUNCTION is_org_member(check_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM org_members 
        WHERE org_id = check_org_id 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is enrolled in course
CREATE OR REPLACE FUNCTION is_enrolled_in_course(check_course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM enrollments 
        WHERE course_id = check_course_id 
        AND user_id = auth.uid()
        AND status IN ('active', 'completed')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate enrollment progress
CREATE OR REPLACE FUNCTION calculate_enrollment_progress(enrollment_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_lessons
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    JOIN enrollments e ON e.course_id = c.id
    WHERE e.id = enrollment_uuid;

    SELECT COUNT(*) INTO completed_lessons
    FROM lesson_progress lp
    WHERE lp.enrollment_id = enrollment_uuid AND lp.completed = TRUE;

    IF total_lessons = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND((completed_lessons::NUMERIC / total_lessons::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TABLES
-- ============================================

-- Users (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_platform_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#6366F1',
    secondary_color TEXT DEFAULT '#818CF8',
    custom_css TEXT,
    custom_domain TEXT UNIQUE,
    stripe_account_id TEXT,
    stripe_onboarded BOOLEAN DEFAULT FALSE,
    plan org_plan DEFAULT 'free',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members (Admins & Instructors)
CREATE TABLE org_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role org_member_role NOT NULL DEFAULT 'instructor',
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

-- Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    thumbnail_url TEXT,
    cover_image_url TEXT,
    instructor_id UUID REFERENCES users(id),
    price DECIMAL(10, 2) DEFAULT 0,
    currency TEXT DEFAULT 'AUD',
    status course_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    estimated_duration INTEGER, -- in minutes
    difficulty_level TEXT,
    requirements TEXT[],
    learning_outcomes TEXT[],
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, slug)
);

-- Modules (Course Sections)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    type lesson_type NOT NULL DEFAULT 'video',
    video_url TEXT,
    video_provider TEXT, -- 'mux', 'bunny', 'youtube', 'vimeo'
    video_id TEXT, -- provider-specific ID
    content TEXT, -- for text lessons (markdown)
    duration INTEGER, -- in seconds
    is_preview BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status enrollment_status DEFAULT 'active',
    progress_percent DECIMAL(5, 2) DEFAULT 0,
    stripe_payment_id TEXT,
    amount_paid DECIMAL(10, 2),
    currency TEXT DEFAULT 'AUD',
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Lesson Progress
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    watch_time INTEGER DEFAULT 0, -- in seconds
    last_position INTEGER DEFAULT 0, -- video position in seconds
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(enrollment_id, lesson_id)
);

-- Quizzes
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    passing_score INTEGER DEFAULT 70, -- percentage
    max_attempts INTEGER, -- null = unlimited
    time_limit INTEGER, -- in minutes, null = no limit
    shuffle_questions BOOLEAN DEFAULT FALSE,
    show_correct_answers BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Questions
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    type question_type DEFAULT 'multiple_choice',
    options JSONB, -- [{text: "...", is_correct: true/false}, ...]
    correct_answer TEXT, -- for short answer
    explanation TEXT, -- shown after answering
    points INTEGER DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Attempts
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '[]', -- [{question_id, answer, is_correct}, ...]
    score INTEGER,
    passed BOOLEAN,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent INTEGER, -- in seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
    certificate_number TEXT NOT NULL UNIQUE DEFAULT generate_certificate_number(),
    recipient_name TEXT NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    pdf_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_custom_domain ON organizations(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_organizations_plan ON organizations(plan);

-- Org Members
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_role ON org_members(org_id, role);

-- Courses
CREATE INDEX idx_courses_org_id ON courses(org_id);
CREATE INDEX idx_courses_org_slug ON courses(org_id, slug);
CREATE INDEX idx_courses_status ON courses(org_id, status);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_featured ON courses(org_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_courses_published ON courses(org_id, published_at) WHERE status = 'published';

-- Modules
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_sort ON modules(course_id, sort_order);

-- Lessons
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_sort ON lessons(module_id, sort_order);
CREATE INDEX idx_lessons_preview ON lessons(module_id, is_preview) WHERE is_preview = TRUE;

-- Enrollments
CREATE INDEX idx_enrollments_org_id ON enrollments(org_id);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(org_id, status);
CREATE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id);

-- Lesson Progress
CREATE INDEX idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_completed ON lesson_progress(enrollment_id, completed) WHERE completed = TRUE;

-- Quizzes
CREATE INDEX idx_quizzes_lesson_id ON quizzes(lesson_id);

-- Quiz Questions
CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_sort ON quiz_questions(quiz_id, sort_order);

-- Quiz Attempts
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_enrollment ON quiz_attempts(enrollment_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);

-- Certificates
CREATE INDEX idx_certificates_org_id ON certificates(org_id);
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_members_updated_at
    BEFORE UPDATE ON org_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
    BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at
    BEFORE UPDATE ON lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at
    BEFORE UPDATE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_attempts_updated_at
    BEFORE UPDATE ON quiz_attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Platform admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE)
    );

-- ORGANIZATIONS POLICIES
CREATE POLICY "Anyone can view published org info"
    ON organizations FOR SELECT
    USING (TRUE);

CREATE POLICY "Org admins can update their org"
    ON organizations FOR UPDATE
    USING (is_org_admin(id));

CREATE POLICY "Platform admins can manage all orgs"
    ON organizations FOR ALL
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE)
    );

-- ORG MEMBERS POLICIES
CREATE POLICY "Org members can view their org's members"
    ON org_members FOR SELECT
    USING (is_org_member(org_id));

CREATE POLICY "Org admins can manage members"
    ON org_members FOR ALL
    USING (is_org_admin(org_id));

-- COURSES POLICIES
CREATE POLICY "Anyone can view published courses"
    ON courses FOR SELECT
    USING (status = 'published');

CREATE POLICY "Org members can view all org courses"
    ON courses FOR SELECT
    USING (is_org_member(org_id));

CREATE POLICY "Org members can create courses"
    ON courses FOR INSERT
    WITH CHECK (is_org_member(org_id));

CREATE POLICY "Org admins and course instructors can update courses"
    ON courses FOR UPDATE
    USING (
        is_org_admin(org_id) OR 
        (is_org_member(org_id) AND instructor_id = auth.uid())
    );

CREATE POLICY "Org admins can delete courses"
    ON courses FOR DELETE
    USING (is_org_admin(org_id));

-- MODULES POLICIES
CREATE POLICY "Users can view modules of accessible courses"
    ON modules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM courses c
            WHERE c.id = modules.course_id
            AND (c.status = 'published' OR is_org_member(c.org_id))
        )
    );

CREATE POLICY "Org members can manage modules"
    ON modules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM courses c
            WHERE c.id = modules.course_id
            AND is_org_member(c.org_id)
        )
    );

-- LESSONS POLICIES
CREATE POLICY "Enrolled users and org members can view lessons"
    ON lessons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM modules m
            JOIN courses c ON c.id = m.course_id
            WHERE m.id = lessons.module_id
            AND (
                is_org_member(c.org_id) OR
                is_enrolled_in_course(c.id) OR
                (c.status = 'published' AND lessons.is_preview = TRUE)
            )
        )
    );

CREATE POLICY "Org members can manage lessons"
    ON lessons FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM modules m
            JOIN courses c ON c.id = m.course_id
            WHERE m.id = lessons.module_id
            AND is_org_member(c.org_id)
        )
    );

-- ENROLLMENTS POLICIES
CREATE POLICY "Users can view their own enrollments"
    ON enrollments FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Org members can view org enrollments"
    ON enrollments FOR SELECT
    USING (is_org_member(org_id));

CREATE POLICY "Users can create their own enrollments"
    ON enrollments FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Org admins can manage enrollments"
    ON enrollments FOR ALL
    USING (is_org_admin(org_id));

-- LESSON PROGRESS POLICIES
CREATE POLICY "Users can view their own progress"
    ON lesson_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.id = lesson_progress.enrollment_id
            AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own progress"
    ON lesson_progress FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.id = lesson_progress.enrollment_id
            AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own progress"
    ON lesson_progress FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.id = lesson_progress.enrollment_id
            AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "Org members can view all progress"
    ON lesson_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.id = lesson_progress.enrollment_id
            AND is_org_member(e.org_id)
        )
    );

-- QUIZZES POLICIES
CREATE POLICY "Users can view quizzes for accessible lessons"
    ON quizzes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN modules m ON m.id = l.module_id
            JOIN courses c ON c.id = m.course_id
            WHERE l.id = quizzes.lesson_id
            AND (is_org_member(c.org_id) OR is_enrolled_in_course(c.id))
        )
    );

CREATE POLICY "Org members can manage quizzes"
    ON quizzes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN modules m ON m.id = l.module_id
            JOIN courses c ON c.id = m.course_id
            WHERE l.id = quizzes.lesson_id
            AND is_org_member(c.org_id)
        )
    );

-- QUIZ QUESTIONS POLICIES
CREATE POLICY "Users can view questions for accessible quizzes"
    ON quiz_questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quizzes q
            JOIN lessons l ON l.id = q.lesson_id
            JOIN modules m ON m.id = l.module_id
            JOIN courses c ON c.id = m.course_id
            WHERE q.id = quiz_questions.quiz_id
            AND (is_org_member(c.org_id) OR is_enrolled_in_course(c.id))
        )
    );

CREATE POLICY "Org members can manage questions"
    ON quiz_questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM quizzes q
            JOIN lessons l ON l.id = q.lesson_id
            JOIN modules m ON m.id = l.module_id
            JOIN courses c ON c.id = m.course_id
            WHERE q.id = quiz_questions.quiz_id
            AND is_org_member(c.org_id)
        )
    );

-- QUIZ ATTEMPTS POLICIES
CREATE POLICY "Users can view their own attempts"
    ON quiz_attempts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create attempts for enrolled courses"
    ON quiz_attempts FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.id = quiz_attempts.enrollment_id
            AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own attempts"
    ON quiz_attempts FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Org members can view all attempts"
    ON quiz_attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.id = quiz_attempts.enrollment_id
            AND is_org_member(e.org_id)
        )
    );

-- CERTIFICATES POLICIES
CREATE POLICY "Users can view their own certificates"
    ON certificates FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Anyone can verify a certificate by number"
    ON certificates FOR SELECT
    USING (TRUE);

CREATE POLICY "Org admins can manage certificates"
    ON certificates FOR ALL
    USING (is_org_admin(org_id));

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Create user profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update enrollment progress when lesson progress changes
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE enrollments
    SET 
        progress_percent = calculate_enrollment_progress(NEW.enrollment_id),
        started_at = COALESCE(started_at, NOW())
    WHERE id = NEW.enrollment_id;
    
    -- Check for course completion
    IF (SELECT progress_percent FROM enrollments WHERE id = NEW.enrollment_id) >= 100 THEN
        UPDATE enrollments
        SET status = 'completed', completed_at = NOW()
        WHERE id = NEW.enrollment_id AND status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lesson_progress_update
    AFTER INSERT OR UPDATE ON lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_enrollment_progress();

-- Get course stats
CREATE OR REPLACE FUNCTION get_course_stats(course_uuid UUID)
RETURNS TABLE (
    total_enrollments BIGINT,
    active_enrollments BIGINT,
    completed_enrollments BIGINT,
    total_lessons BIGINT,
    total_modules BIGINT,
    avg_progress NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM enrollments WHERE course_id = course_uuid) AS total_enrollments,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = course_uuid AND status = 'active') AS active_enrollments,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = course_uuid AND status = 'completed') AS completed_enrollments,
        (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = course_uuid) AS total_lessons,
        (SELECT COUNT(*) FROM modules WHERE course_id = course_uuid) AS total_modules,
        (SELECT COALESCE(AVG(progress_percent), 0) FROM enrollments WHERE course_id = course_uuid) AS avg_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get org dashboard stats
CREATE OR REPLACE FUNCTION get_org_stats(org_uuid UUID)
RETURNS TABLE (
    total_courses BIGINT,
    published_courses BIGINT,
    total_students BIGINT,
    total_enrollments BIGINT,
    total_certificates BIGINT,
    revenue_total NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM courses WHERE org_id = org_uuid) AS total_courses,
        (SELECT COUNT(*) FROM courses WHERE org_id = org_uuid AND status = 'published') AS published_courses,
        (SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE org_id = org_uuid) AS total_students,
        (SELECT COUNT(*) FROM enrollments WHERE org_id = org_uuid) AS total_enrollments,
        (SELECT COUNT(*) FROM certificates WHERE org_id = org_uuid) AS total_certificates,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM enrollments WHERE org_id = org_uuid) AS revenue_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA (Optional - for development)
-- ============================================
-- Uncomment to create test organization

-- INSERT INTO organizations (name, slug, description) 
-- VALUES ('Demo Academy', 'demo', 'A demo organization for testing');
