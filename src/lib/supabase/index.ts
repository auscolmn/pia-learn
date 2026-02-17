// Re-export all Supabase utilities for cleaner imports
export { createClient, getClient } from './client'
export { 
  createServerClient, 
  getSession, 
  getUser, 
  getOrgBySlugOrDomain,
  getOrgMembership,
  getOrgContext,
  getSessionContext,
  getUserOrganizations,
  isEnrolledInCourse,
  hasOrgAdminAccess,
} from './server'
export type { 
  Database,
  User,
  Organization,
  OrgMember,
  OrgMemberWithUser,
  OrgMemberWithOrg,
  Course,
  Enrollment,
  AuthUser,
  OrgContext,
  SessionContext,
  OrgPlan,
  OrgMemberRole,
  CourseStatus,
  LessonType,
  EnrollmentStatus,
} from './types'
