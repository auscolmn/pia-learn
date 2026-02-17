-- LearnStudio Video Storage Setup
-- Migration: 004_video_storage.sql

-- ============================================
-- STORAGE BUCKET FOR VIDEOS
-- ============================================

-- Create the videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos',
    'videos',
    TRUE, -- Public bucket for streaming
    524288000, -- 500MB max file size
    ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Allow authenticated users to upload videos to their org folder
CREATE POLICY "Org members can upload videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'videos' AND
    -- The path must start with an org_id that the user is a member of
    EXISTS (
        SELECT 1 FROM org_members
        WHERE org_members.user_id = auth.uid()
        AND org_members.org_id::text = (storage.foldername(name))[1]
    )
);

-- Allow anyone to view videos (public bucket for streaming)
CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'videos');

-- Allow org members to update videos in their org folder
CREATE POLICY "Org members can update videos"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'videos' AND
    EXISTS (
        SELECT 1 FROM org_members
        WHERE org_members.user_id = auth.uid()
        AND org_members.org_id::text = (storage.foldername(name))[1]
    )
);

-- Allow org members to delete videos in their org folder
CREATE POLICY "Org members can delete videos"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'videos' AND
    EXISTS (
        SELECT 1 FROM org_members
        WHERE org_members.user_id = auth.uid()
        AND org_members.org_id::text = (storage.foldername(name))[1]
    )
);

-- ============================================
-- ADD user_id TO lesson_progress IF MISSING
-- ============================================

-- Add user_id column if it doesn't exist (for direct user reference)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lesson_progress' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE lesson_progress ADD COLUMN user_id UUID REFERENCES users(id);
        
        -- Populate from enrollments
        UPDATE lesson_progress lp
        SET user_id = e.user_id
        FROM enrollments e
        WHERE lp.enrollment_id = e.id;
        
        -- Create index
        CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
    END IF;
END $$;
