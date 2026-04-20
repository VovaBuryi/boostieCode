import { getSupabase } from '@/lib/supabase';
import { Enrollment, LessonProgress } from '@/types';

export async function enrollInCourse(
  courseId: string,
): Promise<Enrollment | null> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  if (!user) return null;

  const { data, error } = await getSupabase()
    .from('enrollments')
    .insert({
      user_id: user.id,
      course_id: courseId,
      completed: false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await getSupabase()
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();
      return existing;
    }
    console.error('Error enrolling in course:', error);
    return null;
  }

  return data;
}

export async function getUserEnrollments(): Promise<Enrollment[]> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  if (!user) return [];

  const { data, error } = await getSupabase()
    .from('enrollments')
    .select(
      `
      *,
      course:courses(*)
    `,
    )
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (error) {
    console.error('Error fetching enrollments:', error);
    return [];
  }

  return data;
}

export async function isUserEnrolled(courseId: string): Promise<boolean> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  if (!user) return false;

  const { data, error } = await getSupabase()
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking enrollment:', error);
    return false;
  }

  return !!data;
}

export async function markLessonComplete(
  lessonId: string,
  completed: boolean = true,
): Promise<LessonProgress | null> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  if (!user) return null;

  const { data, error } = await getSupabase()
    .from('lesson_progress')
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
      {
        onConflict: 'user_id,lesson_id',
      },
    )
    .select()
    .single();

  if (error) {
    console.error('Error marking lesson complete:', error);
    return null;
  }

  return data;
}

export async function updateLessonProgress(
  lessonId: string,
  positionSeconds: number,
): Promise<LessonProgress | null> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  if (!user) return null;

  const { data, error } = await getSupabase()
    .from('lesson_progress')
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        last_position_seconds: positionSeconds,
      },
      {
        onConflict: 'user_id,lesson_id',
      },
    )
    .select()
    .single();

  if (error) {
    console.error('Error updating lesson progress:', error);
    return null;
  }

  return data;
}

export async function getLessonProgress(
  lessonId: string,
): Promise<LessonProgress | null> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  if (!user) return null;

  const { data, error } = await getSupabase()
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching lesson progress:', error);
    return null;
  }

  return data;
}

export async function getCourseProgress(courseId: string): Promise<{
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  if (!user) return { completedLessons: 0, totalLessons: 0, percentage: 0 };

  // 1. Отримуємо всі модулі курсу
  const { data: modules, error: modulesError } = await getSupabase()
    .from('modules')
    .select('id')
    .eq('course_id', courseId);

  if (modulesError) {
    console.error('Error fetching modules:', modulesError);
    return { completedLessons: 0, totalLessons: 0, percentage: 0 };
  }

  if (!modules || modules.length === 0) {
    return { completedLessons: 0, totalLessons: 0, percentage: 0 };
  }

  // 2. Отримуємо всі уроки цих модулів
  const moduleIds = modules.map((m) => m.id);
  const { data: lessons, error: lessonsError } = await getSupabase()
    .from('lessons')
    .select('id')
    .in('module_id', moduleIds);

  // ТУТ БУЛА ПОМИЛКА: перевірка lessonsError тепер йде ПІСЛЯ оголошення
  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError);
    return { completedLessons: 0, totalLessons: 0, percentage: 0 };
  }

  const totalLessons = lessons?.length || 0;
  if (totalLessons === 0) {
    return { completedLessons: 0, totalLessons: 0, percentage: 0 };
  }

  // 3. Отримуємо прогрес користувача за цими уроками
  const lessonIds = lessons.map((l) => l.id);
  const { data: progress, error: progressError } = await getSupabase()
    .from('lesson_progress')
    .select('completed')
    .eq('user_id', user.id)
    .in('lesson_id', lessonIds);

  if (progressError) {
    console.error('Error fetching progress:', progressError);
    // Використовуємо 0 замість totalLessons, якщо він ще не надійний, або вже розрахований вище
    return { completedLessons: 0, totalLessons, percentage: 0 };
  }

  const completedLessons = (progress || []).filter((p) => p.completed).length;
  const percentage = Math.round((completedLessons / totalLessons) * 100);

  return { completedLessons, totalLessons, percentage };
}

export async function getUserStatistics(): Promise<{
  totalEnrolled: number;
  completedCourses: number;
  totalLessonsWatched: number;
  totalHoursLearned: number;
}> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  if (!user)
    return {
      totalEnrolled: 0,
      completedCourses: 0,
      totalLessonsWatched: 0,
      totalHoursLearned: 0,
    };

  // Get user's enrollments
  const { data: enrollments, error: enrollmentsError } = await getSupabase()
    .from('enrollments')
    .select('id, completed, course_id')
    .eq('user_id', user.id);

  if (enrollmentsError && Object.keys(enrollmentsError).length > 0) {
    console.error('Error fetching enrollments:', enrollmentsError);
    return {
      totalEnrolled: 0,
      completedCourses: 0,
      totalLessonsWatched: 0,
      totalHoursLearned: 0,
    };
  }

  const totalEnrolled = enrollments?.length || 0;
  const completedCourses = enrollments?.filter((e) => e.completed).length || 0;

  // Get total lessons watched (progress entries)
  const { data: progress, error: progressError } = await getSupabase()
    .from('lesson_progress')
    .select('id')
    .eq('user_id', user.id);

  if (progressError && Object.keys(progressError).length > 0) {
    console.error('Error fetching progress:', progressError);
    return {
      totalEnrolled,
      completedCourses,
      totalLessonsWatched: 0,
      totalHoursLearned: 0,
    };
  }

  const totalLessonsWatched = progress?.length || 0;

  // Calculate total hours of all lessons in enrolled courses
  if (totalEnrolled === 0) {
    return {
      totalEnrolled: 0,
      completedCourses: 0,
      totalLessonsWatched: 0,
      totalHoursLearned: 0,
    };
  }

  const courseIds = enrollments!.map((e) => e.course_id);

  // Get all modules for these courses
  const { data: modules, error: modulesError } = await getSupabase()
    .from('modules')
    .select('id')
    .in('course_id', courseIds);

  if (modulesError) {
    console.error('Error fetching modules:', modulesError);
    return {
      totalEnrolled,
      completedCourses,
      totalLessonsWatched,
      totalHoursLearned: 0,
    };
  }

  const moduleIds = (modules || []).map((m) => m.id);

  // Get all lessons for these modules and sum duration
  const { data: lessons, error: lessonsError } = await getSupabase()
    .from('lessons')
    .select('duration_minutes')
    .in('module_id', moduleIds);

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError);
    return {
      totalEnrolled,
      completedCourses,
      totalLessonsWatched,
      totalHoursLearned: 0,
    };
  }

  const totalMinutes = (lessons || []).reduce((sum, lesson) => {
    return sum + (lesson.duration_minutes || 0);
  }, 0);

  const totalHoursLearned = Math.round((totalMinutes / 60) * 10) / 10;

  return {
    totalEnrolled,
    completedCourses,
    totalLessonsWatched,
    totalHoursLearned,
  };
}
