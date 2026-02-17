// Database types for LearnStudio
// Auto-generated types would normally come from `supabase gen types typescript`
// These are hand-written to match our schema

export type OrgPlan = 'free' | 'pro' | 'enterprise'
export type OrgMemberRole = 'admin' | 'instructor'
export type CourseStatus = 'draft' | 'published' | 'archived'
export type LessonType = 'video' | 'text' | 'quiz'
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled' | 'expired'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_platform_admin: boolean
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  custom_css: string | null
  custom_domain: string | null
  stripe_account_id: string | null
  stripe_onboarded: boolean
  plan: OrgPlan
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  org_id: string
  user_id: string
  role: OrgMemberRole
  invited_by: string | null
  joined_at: string
  created_at: string
  updated_at: string
}

export interface OrgMemberWithUser extends OrgMember {
  user: User
}

export interface OrgMemberWithOrg extends OrgMember {
  organization: Organization
}

export interface Course {
  id: string
  org_id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  thumbnail_url: string | null
  cover_image_url: string | null
  instructor_id: string | null
  price: number
  currency: string
  status: CourseStatus
  is_featured: boolean
  estimated_duration: number | null
  difficulty_level: string | null
  requirements: string[] | null
  learning_outcomes: string[] | null
  tags: string[] | null
  metadata: Record<string, unknown>
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  org_id: string
  user_id: string
  course_id: string
  status: EnrollmentStatus
  progress_percent: number
  stripe_payment_id: string | null
  amount_paid: number | null
  currency: string
  enrolled_at: string
  started_at: string | null
  completed_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

// Auth context types
export interface AuthUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  isPlatformAdmin: boolean
}

export interface OrgContext {
  org: Organization
  role: OrgMemberRole
  membership: OrgMember
}

export interface SessionContext {
  user: AuthUser
  orgContext: OrgContext | null
}

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<User>
      }
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Organization>
      }
      org_members: {
        Row: OrgMember
        Insert: Omit<OrgMember, 'id' | 'joined_at' | 'created_at' | 'updated_at'> & {
          id?: string
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<OrgMember>
      }
      courses: {
        Row: Course
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Course>
      }
      enrollments: {
        Row: Enrollment
        Insert: Omit<Enrollment, 'id' | 'enrolled_at' | 'created_at' | 'updated_at'> & {
          id?: string
          enrolled_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Enrollment>
      }
    }
  }
}
