import { getSupabase } from '@/lib/supabase'
import { Course, CourseWithDetails, Module, Lesson } from '@/types'
import { Database } from '@/lib/database.types'

type CourseRow = Database['public']['Tables']['courses']['Row']
type CourseInsert = Database['public']['Tables']['courses']['Insert']
type CourseUpdate = Database['public']['Tables']['courses']['Update']
type CourseWithCount = CourseRow & {
  modules: { count: number }[]
}
type ModuleInsert = Database['public']['Tables']['modules']['Insert']
type ModuleUpdate = Database['public']['Tables']['modules']['Update']
type LessonInsert = Database['public']['Tables']['lessons']['Insert']
type LessonUpdate = Database['public']['Tables']['lessons']['Update']
type ModuleRow = Database['public']['Tables']['modules']['Row']

export async function getCourses(): Promise<Course[]> {
  const { data, error } = await getSupabase()
    .from('courses')
    .select(`
      *,
      modules:modules(count)
    `)
    .order('created_at', { ascending: false })

  if (error && Object.keys(error).length > 0) {
    console.error('Error fetching courses:', error)
    return []
  }

  const courses = (data ?? []).map((course: CourseWithCount) => {
    return {
      ...course,
      modules_count: course.modules?.[0]?.count || 0,
    }
  })

  return courses as Course[]
}

export async function getCourseById(id: string): Promise<CourseWithDetails | null> {
  const { data: courseData, error: courseError } = await getSupabase()
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (courseError) return null
  if (!courseData) return null

  const { data: modulesData, error: modulesError } = await getSupabase()
    .from('modules')
    .select('*')
    .eq('course_id', id)
    .order('order_index', { ascending: true })

  if (modulesError) throw modulesError

  const modulesWithLessons = await Promise.all(
    ((modulesData ?? []) as Module[]).map(async (module) => {
      const { data: lessonsData } = await getSupabase()
        .from('lessons')
        .select('*')
        .eq('module_id', module.id)
        .order('order_index', { ascending: true })

      return {
        ...module,
        lessons: (lessonsData ?? []) as Lesson[],
      }
    })
  )

  return {
    ...(courseData as CourseRow),
    modules: modulesWithLessons,
  } as CourseWithDetails
}

export async function createCourse(courseData: {
  title: string
  description?: string | null
  image_url?: string | null
}): Promise<Course | null> {
  const { data: { user } } = await getSupabase().auth.getUser()
  if (!user) return null

  const { data, error } = await getSupabase()
    .from('courses')
    .insert({
      ...courseData,
      created_by: user.id,
    } as CourseInsert)
    .select()
    .single()

  if (error) {
    console.error('Error creating course:', error)
    return null
  }

  return data as CourseRow
}

export async function updateCourse(
  id: string,
  data: { title?: string; description?: string | null; image_url?: string | null }
): Promise<Course | null> {
  const { data: updated, error } = await getSupabase()
    .from('courses')
    .update(data as CourseUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating course:', error)
    return null
  }

  return updated as CourseRow
}

export async function deleteCourse(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('courses').delete().eq('id', id)
  if (error) {
    console.error('Error deleting course:', error)
    return false
  }
  return true
}

export async function createModule(moduleData: {
  course_id: string
  title: string
  description?: string | null
  order_index: number
}): Promise<Module | null> {
  const { data, error } = await getSupabase()
    .from('modules')
    .insert(moduleData as ModuleInsert)
    .select()
    .single()

  if (error) {
    console.error('Error creating module:', error)
    return null
  }

  return data as ModuleRow
}

export async function updateModule(
  id: string,
  data: { title?: string; description?: string | null; order_index?: number }
): Promise<Module | null> {
  const { data: updated, error } = await getSupabase()
    .from('modules')
    .update(data as ModuleUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating module:', error)
    return null
  }

  return updated as ModuleRow
}

export async function deleteModule(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('modules').delete().eq('id', id)
  if (error) {
    console.error('Error deleting module:', error)
    return false
  }
  return true
}

export async function createLesson(lessonData: {
  module_id: string
  title: string
  content?: string | null
  video_url?: string | null
  order_index: number
  duration_minutes?: number | null
}): Promise<Lesson | null> {
  const { data, error } = await getSupabase()
    .from('lessons')
    .insert(lessonData as LessonInsert)
    .select()
    .single()

  if (error) {
    console.error('Error creating lesson:', error)
    return null
  }

  return data as Lesson
}

export async function updateLesson(
  id: string,
  data: {
    title?: string
    content?: string | null
    video_url?: string | null
    order_index?: number
    duration_minutes?: number | null
  }
): Promise<Lesson | null> {
  const { data: updated, error } = await getSupabase()
    .from('lessons')
    .update(data as LessonUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating lesson:', error)
    return null
  }

  return updated as Lesson
}

export async function deleteLesson(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('lessons').delete().eq('id', id)
  if (error) {
    console.error('Error deleting lesson:', error)
    return false
  }
  return true
}
