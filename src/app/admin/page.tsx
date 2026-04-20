'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Course } from '@/types';
import { getCourses, deleteCourse } from '@/lib/courses';
import Navbar from '@/components/Navbar';
import {
  PlusCircle,
  Trash2,
  Edit,
  BookOpen,
  Users,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Отримуємо дані користувача та його роль з контексту
  const { user, isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();

  // Реф для запобігання оновленню стану демонтованого компонента
  const isMountedRef = useRef(true);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCourses();
      if (isMountedRef.current) {
        setCourses(data);
      }
    } catch (error) {
      console.error('Помилка завантаження курсів:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Захист роуту: якщо користувач завантажився, але він не адмін — редирект
    if (isAuthenticated !== undefined) {
      if (!isAuthenticated || !isAdmin) {
        router.push('/'); // Відправляємо на головну, якщо немає прав
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadCourses();
      }
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthenticated, isAdmin, router, loadCourses]);

  const handleDeleteCourse = async (id: string) => {
    if (
      !confirm(
        'Ви впевнені, що хочете видалити цей курс? Це видалить усі пов’язані модулі та уроки!',
      )
    )
      return;

    try {
      const success = await deleteCourse(id);
      if (success) {
        setCourses((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Помилка видалення:', error);
      alert('Не вдалося видалити курс. Спробуйте ще раз.');
    }
  };

  // Стан завантаження перевірки аутентифікації
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='h-12 w-12 animate-spin text-indigo-600' />
          <p className='text-gray-600 font-medium'>Перевірка доступу...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <main className='max-w-7xl mx-auto px-4 py-8'>
        <div className='mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Адмін-панель
            </h1>
            <p className='text-gray-600'>
              Вітаємо, {user?.email}. Керуйте курсами та навчальними
              матеріалами.
            </p>
          </div>

          <Link
            href='/admin/courses/new'
            className='flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm'
          >
            <PlusCircle className='h-5 w-5' />
            Додати новий курс
          </Link>
        </div>

        {/* Швидка статистика */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-500 uppercase'>
                  Всього курсів
                </p>
                <p className='text-3xl font-bold text-gray-900'>
                  {courses.length}
                </p>
              </div>
              <div className='p-3 bg-indigo-50 rounded-lg'>
                <BookOpen className='h-6 w-6 text-indigo-600' />
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-500 uppercase'>
                  Модулів створено
                </p>
                <p className='text-3xl font-bold text-gray-900'>
                  {courses.reduce((acc, c) => acc + (c.modules_count || 0), 0)}
                </p>
              </div>
              <div className='p-3 bg-green-50 rounded-lg'>
                <PlusCircle className='h-6 w-6 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-500 uppercase'>
                  Активні студенти
                </p>
                <p className='text-3xl font-bold text-gray-900'>
                  {/* Зазвичай тут реальний запит до БД, поки використовуємо заповнювач */}
                  {courses.length * 12}
                </p>
              </div>
              <div className='p-3 bg-blue-50 rounded-lg'>
                <Users className='h-6 w-6 text-blue-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Таблиця курсів */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-100 bg-gray-50/50'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Список курсів
            </h2>
          </div>

          {loading ? (
            <div className='flex items-center justify-center py-20'>
              <Loader2 className='h-10 w-10 animate-spin text-indigo-600' />
            </div>
          ) : courses.length === 0 ? (
            <div className='text-center py-20'>
              <BookOpen className='h-16 w-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-600 mb-2'>
                Курсів ще немає
              </h3>
              <p className='text-gray-500 mb-6'>
                Почніть з наповнення платформи контентом
              </p>
              <Link
                href='/admin/courses/new'
                className='inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition'
              >
                <PlusCircle className='h-5 w-5' />
                Створити курс
              </Link>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                <thead className='bg-gray-50/50'>
                  <tr>
                    <th className='px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Назва курсу
                    </th>
                    <th className='px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Модулів
                    </th>
                    <th className='px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Дата створення
                    </th>
                    <th className='px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      className='hover:bg-gray-50/80 transition-colors'
                    >
                      <td className='px-6 py-4'>
                        <div className='font-semibold text-gray-900'>
                          {course.title}
                        </div>
                        {course.description && (
                          <div className='text-sm text-gray-500 truncate max-w-xs'>
                            {course.description}
                          </div>
                        )}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        <span className='bg-gray-100 px-2 py-1 rounded text-xs font-medium'>
                          {course.modules_count || 0} шт.
                        </span>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {course.created_at
                          ? new Date(course.created_at).toLocaleDateString(
                              'uk-UA',
                            )
                          : '---'}
                      </td>
                      <td className='px-6 py-4 text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className='p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition'
                            title='Редагувати'
                          >
                            <Edit className='h-5 w-5' />
                          </Link>
                          <Link
                            href={`/admin/courses/${course.id}/lessons`}
                            className='p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition'
                            title='Матеріали'
                          >
                            <BookOpen className='h-5 w-5' />
                          </Link>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className='p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition'
                            title='Видалити'
                          >
                            <Trash2 className='h-5 w-5' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
