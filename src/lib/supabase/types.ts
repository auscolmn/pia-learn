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

export interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  description: string | null
  sort_order: number
  type: LessonType
  video_url: string | null
  video_provider: string | null
  video_id: string | null
  content: string | null
  duration: number | null
  is_preview: boolean
  is_required: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[]
}

export interface CourseWithModules extends Course {
  modules: ModuleWithLessons[]
}

export interface CourseWithInstructor extends Course {
  instructor: User | null
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

// Insert types (for creating new records)
export interface OrganizationInsert {
  name: string
  slug: string
  plan: OrgPlan
  primary_color: string
  secondary_color: string
  settings: Record<string, unknown>
  // Optional fields
  id?: string
  description?: string | null
  logo_url?: string | null
  custom_css?: string | null
  custom_domain?: string | null
  stripe_account_id?: string | null
  stripe_onboarded?: boolean
  created_at?: string
  updated_at?: string
}

export interface OrgMemberInsert {
  org_id: string
  user_id: string
  role: OrgMemberRole
  // Optional fields
  id?: string
  invited_by?: string | null
  joined_at?: string
  created_at?: string
  updated_at?: string
}

export interface UserInsert {
  id: string
  email: string
  // Optional fields
  full_name?: string | null
  avatar_url?: string | null
  is_platform_admin?: boolean
  created_at?: string
  updated_at?: string
}

// Database type for Supabase client
// Following the standard Supabase generated types format
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: UserInsert
        Update: Partial<UserInsert>
        Relationships: []
      }
      organizations: {
        Row: Organization
        Insert: OrganizationInsert
        Update: Partial<OrganizationInsert>
        Relationships: []
      }
      org_members: {
        Row: OrgMember
        Insert: OrgMemberInsert
        Update: Partial<OrgMemberInsert>
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: Course
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Course>
        Relationships: [
          {
            foreignKeyName: "courses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      org_plan: OrgPlan
      org_member_role: OrgMemberRole
      course_status: CourseStatus
      lesson_type: LessonType
      enrollment_status: EnrollmentStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for Supabase client
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
