import { Course, CourseWithDetails } from '@/types';

export async function fetchCourses(): Promise<Course[]> {
  const response = await fetch('/api/courses');
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  return response.json();
}

export async function fetchCourse(id: string): Promise<CourseWithDetails> {
  const response = await fetch(`/api/courses/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch course');
  }
  return response.json();
}