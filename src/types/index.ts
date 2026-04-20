export interface Course {
  id: string
  title: string
  description: string | null
  image_url: string | null
  created_by: string
  created_at: string
  updated_at: string
  modules_count?: number
  enrolled?: boolean
}

export interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
  lessons_count?: number
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  content: string | null
  video_url: string | null
  order_index: number
  duration_minutes: number | null
  created_at: string
  updated_at: string
  completed?: boolean
  last_position_seconds?: number
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  completed: boolean
  completed_at: string | null
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at: string | null
  last_position_seconds: number | null
  created_at: string
  updated_at: string
}

export interface CourseWithModules {
  course: Course
  modules: Module[]
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[]
}

export interface CourseWithDetails extends Course {
  modules: ModuleWithLessons[]
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  role: 'admin' | 'user'
}
