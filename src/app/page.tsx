'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Course } from '@/types';
import { getCourses } from '@/lib/courses';
import { enrollInCourse, isUserEnrolled } from '@/lib/enrollments';
import Navbar from '@/components/Navbar';
import CourseCard from '@/components/CourseCard';
import { PlusCircle, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Використовуйте Link замість <a> для SPA навігації

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCourses();

      // Якщо користувач залогінений і не адмін, перевіряємо підписки паралельно
      if (user && !isAdmin) {
        const coursesWithEnrollment = await Promise.all(
          data.map(async (course) => {
            const enrolled = await isUserEnrolled(course.id);
            return { ...course, enrolled }; // Створюємо новий об'єкт
          }),
        );
        setCourses(coursesWithEnrollment);
      } else {
        setCourses(data);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    // Якщо адмін заходить на головну, він бачить всі курси.
    // Якщо звичайний юзер заходить — можливо, ви хочете редирект,
    // але зазвичай головна доступна всім. Залишаю завантаження:
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCourses();
  }, [loadCourses]);

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const enrollment = await enrollInCourse(courseId);
      if (enrollment) {
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, enrolled: true } : c)),
        );
      }
    } catch (error) {
      console.error('Enrollment failed:', error);
    }
  };

  // Якщо сторінка публічна, видаліть перевірку !isAuthenticated
  // Якщо приватна — залиште, але тоді логіка loadCourses для анонімів зайва.

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <main className='max-w-7xl mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            {isAdmin ? 'Панель адміністратора' : 'Доступні курси'}
          </h1>
          <p className='text-gray-600'>
            {isAdmin
              ? 'Керуйте курсами та матеріалами'
              : 'Оберіть курс та почніть навчання'}
          </p>
        </div>

        {isAdmin && (
          <div className='mb-8 flex gap-4'>
            <Link
              href='/admin/courses'
              className='flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition'
            >
              <PlusCircle className='h-5 w-5' />
              Додати курс
            </Link>
            <Link
              href='/admin'
              className='flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition'
            >
              Керування курсами
            </Link>
          </div>
        )}

        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
          </div>
        ) : courses.length === 0 ? (
          <div className='text-center py-20'>
            <BookOpen className='h-16 w-16 text-gray-300 mx-auto mb-4' />
            <h2 className='text-xl font-semibold text-gray-600 mb-2'>
              Курсів ще немає
            </h2>
            <p className='text-gray-500'>
              {isAdmin ? 'Створіть свій перший курс' : 'Перевірте пізніше'}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEnroll={() => handleEnroll(course.id)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
