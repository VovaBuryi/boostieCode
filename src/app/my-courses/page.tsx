'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Course } from '@/types';
import { getUserEnrollments, getCourseProgress } from '@/lib/enrollments';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  CheckCircle,
  PlayCircle,
  Award,
  TrendingUp,
} from 'lucide-react';

interface EnrollmentWithProgress {
  enrollment: Enrollment & { course?: Course };
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
}

interface UserStats {
  totalEnrolled: number;
  completedCourses: number;
  totalLessonsWatched: number;
  totalHoursLearned: number;
}

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalEnrolled: 0,
    completedCourses: 0,
    totalLessonsWatched: 0,
    totalHoursLearned: 0,
  });

  const loadEnrollments = useCallback(async () => {
    try {
      const data = await getUserEnrollments();
      const enrollmentsWithProgress = await Promise.all(
        data.map(async (enrollment) => {
          const progress = await getCourseProgress(enrollment.course_id);
          return { enrollment, progress };
        }),
      );
      setEnrollments(enrollmentsWithProgress);
    } catch (error) {
      console.error('Error loading enrollments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const { getUserStatistics } = await import('@/lib/enrollments');
      const stats = await getUserStatistics();
      setStats(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, []);

  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!user) return;
    isMountedRef.current = true;
    
    const loadData = async () => {
      try {
        await loadEnrollments();
        await loadStatistics();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [user, loadEnrollments, loadStatistics]);

  if (!user) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navbar />
        <main className='max-w-7xl mx-auto px-4 py-8'>
          <div className='text-center py-20'>
            <BookOpen className='h-16 w-16 text-gray-300 mx-auto mb-4' />
            <h2 className='text-xl font-semibold text-gray-600 mb-2'>
              Увійдіть для перегляду курсів
            </h2>
            <p className='text-gray-500 mb-6'>
              Зареєструйтеся або увійдіть, щоб переглядати свої курси
            </p>
            <Link
              href='/login'
              className='inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition'
            >
              Увійти
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <main className='max-w-7xl mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Мої курси</h1>
          <p className='text-gray-600'>Ваш прогрес та статистика навчання</p>
        </div>

        {/* Statistics Card */}
        <div className='bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white'>
          <h2 className='text-xl font-semibold mb-4'>Ваша статистика</h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <BookOpen className='h-5 w-5' />
                <span className='text-sm opacity-90'>Курсів</span>
              </div>
              <p className='text-3xl font-bold'>{stats.totalEnrolled}</p>
            </div>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <Award className='h-5 w-5' />
                <span className='text-sm opacity-90'>Завершено</span>
              </div>
              <p className='text-3xl font-bold'>{stats.completedCourses}</p>
            </div>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <PlayCircle className='h-5 w-5' />
                <span className='text-sm opacity-90'>Уроків</span>
              </div>
              <p className='text-3xl font-bold'>{stats.totalLessonsWatched}</p>
            </div>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <Clock className='h-5 w-5' />
                <span className='text-sm opacity-90'>Години</span>
              </div>
              <p className='text-3xl font-bold'>{stats.totalHoursLearned}</p>
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Записані курси
          </h2>

          {loading ? (
            <div className='flex items-center justify-center py-20'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
            </div>
          ) : enrollments.length === 0 ? (
            <div className='text-center py-20 bg-white rounded-lg shadow'>
              <BookOpen className='h-16 w-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-600 mb-2'>
                Ви ще не записалися на курси
              </h3>
              <p className='text-gray-500 mb-6'>
                Перегляньте доступні курси та почніть навчання
              </p>
              <Link
                href='/'
                className='inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition'
              >
                <TrendingUp className='h-5 w-5' />
                Переглянути курси
              </Link>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {enrollments.map(({ enrollment, progress }) => (
                <div
                  key={enrollment.id}
                  className='bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden'
                >
                  <div className='p-6'>
                    <h3 className='text-lg font-bold text-gray-900 mb-2'>
                      {enrollment.course?.title || 'Курс'}
                    </h3>

                    {/* Progress */}
                    <div className='mb-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-medium text-gray-700'>
                          Прогрес
                        </span>
                        <span className='text-sm font-medium text-indigo-600'>
                          {progress.percentage}%
                        </span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-indigo-600 h-2 rounded-full transition-all'
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                      <p className='text-xs text-gray-500 mt-1'>
                        {progress.completedLessons} з {progress.totalLessons}{' '}
                        уроків
                      </p>
                    </div>

                    <div className='flex items-center justify-between'>
                      <Link
                        href={`/course/${enrollment.course_id}`}
                        className='flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm'
                      >
                        <PlayCircle className='h-4 w-4' />
                        Продовжити
                      </Link>
                      {enrollment.completed && (
                        <span className='flex items-center gap-1 text-green-600 text-sm'>
                          <CheckCircle className='h-4 w-4' />
                          Завершено
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
