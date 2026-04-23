'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CourseWithDetails, Lesson } from '@/types';
import { fetchCourse } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer';
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export default function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState({
    completedLessons: 0,
    totalLessons: 0,
    percentage: 0,
  });
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});

  const isMountedRef = useRef(true);

  const loadCourse = useCallback(async () => {
    try {
      const data = await fetchCourse(resolvedParams.id);
      if (isMountedRef.current && data) {
        setCourse(data);

        const total = data.modules.reduce(
          (acc, m) => acc + m.lessons.length,
          0,
        );

        const completed = data.modules.reduce(
          (acc, m) => acc + m.lessons.filter((l) => l.completed).length,
          0,
        );

        setProgress({
          completedLessons: completed,
          totalLessons: total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        });

        const lessonProgressMap: Record<string, boolean> = {};
        data.modules.forEach((m) => {
          m.lessons.forEach((l) => {
            if (l.completed) {
              lessonProgressMap[l.id] = true;
            }
          });
        });
        setLessonProgress(lessonProgressMap);

        const expandedMap = data.modules.reduce(
          (acc, module) => {
            acc[module.id] = false;
            return acc;
          },
          {} as Record<string, boolean>,
        );

        const firstModuleWithLesson = data.modules.find(
          (module) => module.lessons.length > 0,
        );

        if (firstModuleWithLesson) {
          setSelectedLesson(firstModuleWithLesson.lessons[0]);
          expandedMap[firstModuleWithLesson.id] = true;
        }

        setExpandedModules(expandedMap);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading course:', error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    isMountedRef.current = true;
    loadCourse();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadCourse]);

  const handleLessonSelect = (lesson: Lesson, moduleId: string) => {
    setSelectedLesson(lesson);
    setExpandedModules((prev) => ({ ...prev, [moduleId]: true }));
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleMarkComplete = async (lessonId: string) => {
    if (!user || !course) return;

    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
      });
      if (response.ok) {
        const newLessonProgress = { ...lessonProgress, [lessonId]: true };
        setLessonProgress(newLessonProgress);

        const total = course.modules.reduce(
          (acc, m) => acc + m.lessons.length,
          0,
        );
        const completed = course.modules.reduce(
          (acc, m) =>
            acc +
            m.lessons.filter((l) => newLessonProgress[l.id] || l.completed)
              .length,
          0,
        );
        const percentage =
          total > 0 ? Math.round((completed / total) * 100) : 0;
        setProgress({
          completedLessons: completed,
          totalLessons: total,
          percentage,
        });

        setCourse((prevCourse) => {
          if (!prevCourse) return prevCourse;
          return {
            ...prevCourse,
            modules: prevCourse.modules.map((module) => ({
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.id === lessonId
                  ? { ...lesson, completed: true }
                  : lesson,
              ),
            })),
          };
        });
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navbar />
        <main className='max-w-7xl mx-auto px-4 py-8'>
          <div className='text-center py-20'>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              Курс не знайдено
            </h1>
            <p className='text-gray-600'>Перевірте URL та спробуйте ще раз</p>
            <Link
              href='/'
              className='mt-4 inline-block text-indigo-600 hover:text-indigo-700'
            >
              Повернутися до списку курсів
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
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4'
          >
            <ArrowLeft className='h-4 w-4' />
            Назад до курсів
          </Link>
          <h1 className='text-3xl font-bold text-gray-900 mb-4'>
            {course?.title}
          </h1>
          {course?.description && (
            <p className='text-gray-600 mb-4'>{course.description}</p>
          )}

          <div className='bg-white rounded-lg p-4 shadow-sm'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>
                Прогрес навчання
              </span>
              <span className='text-sm font-medium text-indigo-600'>
                {progress.percentage}%
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2.5'>
              <div
                className='bg-indigo-600 h-2.5 rounded-full transition-all'
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className='flex items-center gap-4 mt-2 text-sm text-gray-500'>
              <span>
                {progress.completedLessons} з {progress.totalLessons} уроків
                пройдено
              </span>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow'>
              <div className='px-4 py-3 border-b bg-gray-50'>
                <h2 className='font-semibold text-gray-900'>Зміст курсу</h2>
              </div>

              <div className='divide-y max-h-[calc(100vh-250px)] overflow-y-auto'>
                {course.modules.map((module) => (
                  <div key={module.id}>
                    <button
                      type='button'
                      onClick={() => toggleModule(module.id)}
                      className='w-full px-4 py-3 bg-gray-50 font-medium text-gray-900 flex items-center justify-between hover:bg-gray-100 transition'
                    >
                      <span>{module.title}</span>
                      {expandedModules[module.id] ? (
                        <ChevronDown className='h-4 w-4 text-gray-500' />
                      ) : (
                        <ChevronRight className='h-4 w-4 text-gray-500' />
                      )}
                    </button>
                    {expandedModules[module.id] && (
                      <div>
                        {module.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() =>
                              handleLessonSelect(lesson, module.id)
                            }
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 ${
                              selectedLesson?.id === lesson.id
                                ? 'bg-indigo-50'
                                : ''
                            }`}
                          >
                            <div className='mt-0.5'>
                              {lessonProgress[lesson.id] ? (
                                <CheckCircle className='h-5 w-5 text-green-500' />
                              ) : (
                                <Circle className='h-5 w-5 text-gray-400' />
                              )}
                            </div>
                            <div className='flex-1'>
                              <div className='font-medium text-gray-900'>
                                {lesson.title}
                              </div>
                              {lesson.duration_minutes && (
                                <div className='flex items-center gap-1 text-sm text-gray-500 mt-1'>
                                  <Clock className='h-3 w-3' />
                                  {lesson.duration_minutes} хв
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='lg:col-span-2'>
            {selectedLesson ? (
              <div className='bg-white rounded-lg shadow'>
                <div className='px-6 py-4 border-b'>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    {selectedLesson.title}
                  </h2>
                </div>

                <div className='p-6'>
                  {selectedLesson.video_url ? (
                    <VideoPlayer url={selectedLesson.video_url} />
                  ) : (
                    // <div className='aspect-video bg-gray-100 rounded-lg mb-6 flex items-center justify-center'>
                    //   <BookOpen className='h-16 w-16 text-gray-400' />
                    // </div>
                    ''
                  )}

                  {selectedLesson.content && (
                    <div className='prose max-w-none'>
                      {/* <h3 className='text-lg font-semibold mb-2'>Опис уроку</h3> */}
                      <div
                        className='lesson-content text-gray-700'
                        dangerouslySetInnerHTML={{
                          __html: selectedLesson.content,
                        }}
                      />
                    </div>
                  )}

                  <div className='mt-8 flex items-center justify-between border-t pt-6'>
                    <div className='text-sm text-gray-500'>
                      {/* {lessonProgress[selectedLesson.id] ? (
                        <span className='flex items-center gap-2 text-green-600'>
                          <CheckCircle className='h-5 w-5' />
                          Пройдено
                        </span>
                      ) : (
                        <span className='flex items-center gap-2'>
                          <Circle className='h-5 w-5' />
                          Не пройдено
                        </span>
                      )} */}
                    </div>

                    <button
                      onClick={() => handleMarkComplete(selectedLesson.id)}
                      disabled={lessonProgress[selectedLesson.id]}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        lessonProgress[selectedLesson.id]
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {lessonProgress[selectedLesson.id] ? (
                        <>
                          <CheckCircle className='h-4 w-4' />
                          Пройдено
                        </>
                      ) : (
                        <>
                          <CheckCircle className='h-4 w-4' />
                          Позначити як пройдене
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className='bg-white rounded-lg shadow p-12 text-center'>
                <BookOpen className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-600 mb-2'>
                  Оберіть урок
                </h3>
                <p className='text-gray-500'>
                  Виберіть урок зі списку зліва, щоб почати навчання
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
