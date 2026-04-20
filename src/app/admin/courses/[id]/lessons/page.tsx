'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
import { CourseWithDetails } from '@/types';
import {
  getCourseById,
  createModule,
  deleteModule,
  createLesson,
  deleteLesson,
  updateLesson,
  updateModule,
} from '@/lib/courses';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
  BookOpen,
  Save,
  Loader2,
  Edit,
  X,
} from 'lucide-react';
import LessonEditor from '@/components/LessonEditor';

function EditModuleModal({
  isOpen,
  onClose,
  module,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  module: { id: string; title: string; description: string | null; order_index: number };
  onSave: (data: { title: string; description: string | null; order_index: number }) => void;
}) {
  const [form, setForm] = useState(() => ({
    title: module.title,
    description: module.description || '',
    order_index: module.order_index,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Редагувати модуль</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Назва *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Опис
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Порядковий номер
            </label>
            <input
              type="number"
              value={form.order_index}
              onChange={(e) =>
                setForm({ ...form, order_index: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() =>
                onSave({
                  title: form.title,
                  description: form.description || null,
                  order_index: form.order_index,
                })
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Save className="h-4 w-4" /> Зберегти
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditLessonModal({
  isOpen,
  onClose,
  lesson,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    id: string;
    title: string;
    content: string | null;
    video_url: string | null;
    order_index: number;
    duration_minutes: number | null;
  };
  onSave: (data: {
    title: string;
    content: string | null;
    video_url: string | null;
    order_index: number;
    duration_minutes: number | null;
  }) => void;
}) {
  const [form, setForm] = useState(() => ({
    title: lesson.title,
    content: lesson.content || '',
    video_url: lesson.video_url || '',
    order_index: lesson.order_index,
    duration_minutes: lesson.duration_minutes?.toString() || '',
  }));
  const [contentHtml, setContentHtml] = useState(() => lesson.content || '');

  const handleSave = () => {
    onSave({
      title: form.title,
      content: contentHtml || null,
      video_url: form.video_url || null,
      order_index: form.order_index,
      duration_minutes: form.duration_minutes
        ? parseInt(form.duration_minutes)
        : null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Редагувати урок</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Назва уроку *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Вміст уроку
            </label>
            <LessonEditor content={contentHtml} onChange={setContentHtml} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL відео
            </label>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Порядок
              </label>
              <input
                type="number"
                value={form.order_index}
                onChange={(e) =>
                  setForm({ ...form, order_index: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тривалість (хв)
              </label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Save className="h-4 w-4" /> Зберегти
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLessonsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [course, setCourse] = useState<CourseWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Додані відсутні стани для модалок
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    order_index: 0,
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    video_url: '',
    order_index: 0,
    duration_minutes: '',
  });

  // Edit module state
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [editModuleData, setEditModuleData] = useState<{
    id: string;
    title: string;
    description: string | null;
    order_index: number;
  } | null>(null);

  // Edit lesson state
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  const [editLessonData, setEditLessonData] = useState<{
    id: string;
    title: string;
    content: string | null;
    video_url: string | null;
    order_index: number;
    duration_minutes: number | null;
  } | null>(null);

  const isMountedRef = useRef(true);

  const loadCourse = useCallback(async () => {
    try {
      const data = await getCourseById(resolvedParams.id);
      if (isMountedRef.current) {
        setCourse(data as CourseWithDetails);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCourse();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadCourse]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createModule({
        course_id: resolvedParams.id,
        title: moduleForm.title,
        description: moduleForm.description || null,
        order_index: moduleForm.order_index,
      });
      setShowModuleForm(false);
      setModuleForm({ title: '', description: '', order_index: 0 });
      loadCourse(); // Оновлюємо дані
    } catch (error) {
      console.error('Error creating module:', error);
      alert('Помилка при створенні модуля');
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей модуль?')) return;
    try {
      await deleteModule(id);
      loadCourse();
    } catch (error) {
      console.error('Помилка видалення модуля:', error);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    try {
      await createLesson({
        module_id: selectedModule,
        title: lessonForm.title,
        content: lessonForm.content || null,
        video_url: lessonForm.video_url || null,
        order_index: lessonForm.order_index,
        duration_minutes: lessonForm.duration_minutes
          ? parseInt(lessonForm.duration_minutes)
          : null,
      });
      setShowLessonForm(false);
      setLessonForm({
        title: '',
        content: '',
        video_url: '',
        order_index: 0,
        duration_minutes: '',
      });
      loadCourse();
    } catch (error) {
      console.error('Error creating lesson:', error);
      alert('Помилка при створенні уроку');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей урок?')) return;
    try {
      await deleteLesson(id);
      loadCourse();
    } catch (error) {
      console.error('Помилка видалення уроку:', error);
    }
  };

  const handleEditModule = async (data: {
    title: string;
    description: string | null;
    order_index: number;
  }) => {
    if (!editModuleData) return;
    try {
      await updateModule(editModuleData.id, data);
      setShowEditModuleModal(false);
      setEditModuleData(null);
      loadCourse();
    } catch (error) {
      console.error('Error updating module:', error);
      alert('Помилка при оновленні модуля');
    }
  };

  const handleEditLesson = async (data: {
    title: string;
    content: string | null;
    video_url: string | null;
    order_index: number;
    duration_minutes: number | null;
  }) => {
    if (!editLessonData) return;
    try {
      await updateLesson(editLessonData.id, data);
      setShowEditLessonModal(false);
      setEditLessonData(null);
      loadCourse();
    } catch (error) {
      console.error('Error updating lesson:', error);
      alert('Помилка при оновленні уроку');
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Loader2 className='h-12 w-12 animate-spin text-indigo-600' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <main className='max-w-7xl mx-auto px-4 py-8'>
        <div className='mb-8 flex flex-col md:flex-row md:items-center gap-4'>
          <Link
            href='/admin'
            className='flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition'
          >
            <ArrowLeft className='h-5 w-5' />
            Назад до курсів
          </Link>
          <div className='flex-1'>
            <h1 className='text-3xl font-bold text-gray-900'>
              {course?.title || 'Завантаження...'}
            </h1>
            <p className='text-gray-600'>Керування модулями та уроками</p>
          </div>

          <button
            onClick={() => setShowModuleForm(true)}
            className='flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm'
          >
            <PlusCircle className='h-5 w-5' />
            Додати модуль
          </button>
        </div>

        {!course ? (
          <div className='text-center py-20'>
            <p className='text-gray-500'>Курс не знайдено</p>
          </div>
        ) : course.modules?.length === 0 ? (
          <div className='text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300'>
            <BookOpen className='h-16 w-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-600 mb-2'>
              Модулів ще немає
            </h3>
            <p className='text-gray-500 mb-6'>
              Додайте перший модуль, щоб почати наповнення курсу
            </p>
            <button
              onClick={() => setShowModuleForm(true)}
              className='inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition'
            >
              <PlusCircle className='h-5 w-5' />
              Додати перший модуль
            </button>
          </div>
        ) : (
          <div className='space-y-6'>
            {course.modules?.map((module) => (
              <div
                key={module.id}
                className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'
              >
                <div className='px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200'>
                  <div>
                    <h2 className='text-xl font-bold text-gray-900'>
                      {module.title}
                    </h2>
                    {module.description && (
                      <p className='text-gray-600 text-sm mt-1'>
                        {module.description}
                      </p>
                    )}
                  </div>
                  <div className='flex items-center gap-2 w-full sm:w-auto'>
                    <button
                      onClick={() => {
                        setSelectedModule(module.id);
                        setShowLessonForm(true);
                      }}
                      className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm'
                    >
                      <PlusCircle className='h-4 w-4' />
                      Додати урок
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        const moduleData = {
                          id: module.id,
                          title: module.title,
                          description: module.description,
                          order_index: module.order_index,
                        };
                        setEditModuleData(moduleData);
                        setTimeout(() => {
                          setShowEditModuleModal(true);
                        }, 0);
                      }}
                      className='p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition'
                      title='Редагувати модуль'
                    >
                      <Edit className='h-5 w-5' />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(module.id)}
                      className='p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition'
                      title='Видалити модуль'
                    >
                      <Trash2 className='h-5 w-5' />
                    </button>
                  </div>
                </div>

                <div className='divide-y divide-gray-100'>
                  {module.lessons?.length === 0 ? (
                    <div className='p-6 text-center text-gray-400 text-sm italic'>
                      У цьому модулі ще немає уроків
                    </div>
                  ) : (
                    module.lessons?.map((lesson) => (
                      <div
                        key={lesson.id}
                        className='p-4 hover:bg-gray-50 flex items-center justify-between transition'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='p-2 bg-indigo-50 rounded text-indigo-600'>
                            <BookOpen className='h-4 w-4' />
                          </div>
                          <div>
                            <h3 className='font-medium text-gray-900'>
                              {lesson.title}
                            </h3>
                            {lesson.duration_minutes && (
                              <p className='text-xs text-gray-500'>
                                {lesson.duration_minutes} хв
                              </p>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center gap-1'>
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation();
                              const lessonData = {
                                id: lesson.id,
                                title: lesson.title,
                                content: lesson.content,
                                video_url: lesson.video_url,
                                order_index: lesson.order_index,
                                duration_minutes: lesson.duration_minutes,
                              };
                              setEditLessonData(lessonData);
                              setTimeout(() => {
                                setShowEditLessonModal(true);
                              }, 0);
                            }}
                            className='p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition'
                            title='Редагувати урок'
                          >
                            <Edit className='h-4 w-4' />
                          </button>
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLesson(lesson.id);
                            }}
                            className='p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition'
                            title='Видалити урок'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Модалка модуля */}
        {showModuleForm && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-xl p-6 max-w-md w-full shadow-2xl'>
              <h2 className='text-xl font-bold mb-4 text-gray-900'>
                Новий модуль
              </h2>
              <form onSubmit={handleCreateModule} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Назва *
                  </label>
                  <input
                    type='text'
                    value={moduleForm.title}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, title: e.target.value })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Опис
                  </label>
                  <textarea
                    value={moduleForm.description}
                    onChange={(e) =>
                      setModuleForm({
                        ...moduleForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Порядковий номер
                  </label>
                  <input
                    type='number'
                    value={moduleForm.order_index}
                    onChange={(e) =>
                      setModuleForm({
                        ...moduleForm,
                        order_index: parseInt(e.target.value) || 0,
                      })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
                  />
                </div>
                <div className='flex gap-3 pt-2'>
                  <button
                    type='submit'
                    className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition'
                  >
                    <Save className='h-4 w-4' /> Зберегти
                  </button>
                  <button
                    type='button'
                    onClick={() => setShowModuleForm(false)}
                    className='flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Модалка уроку */}
        {showLessonForm && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl'>
              <h2 className='text-xl font-bold mb-4 text-gray-900'>
                Новий урок
              </h2>
              <form onSubmit={handleCreateLesson} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Назва уроку *
                  </label>
                  <input
                    type='text'
                    value={lessonForm.title}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, title: e.target.value })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Вміст (текст)
                  </label>
                  <textarea
                    value={lessonForm.content}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, content: e.target.value })
                    }
                    rows={4}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    URL відео
                  </label>
                  <input
                    type='url'
                    value={lessonForm.video_url}
                    onChange={(e) =>
                      setLessonForm({
                        ...lessonForm,
                        video_url: e.target.value,
                      })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
                    placeholder='https://...'
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Порядок
                    </label>
                    <input
                      type='number'
                      value={lessonForm.order_index}
                      onChange={(e) =>
                        setLessonForm({
                          ...lessonForm,
                          order_index: parseInt(e.target.value) || 0,
                        })
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Тривалість (хв)
                    </label>
                    <input
                      type='number'
                      value={lessonForm.duration_minutes}
                      onChange={(e) =>
                        setLessonForm({
                          ...lessonForm,
                          duration_minutes: e.target.value,
                        })
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
                    />
                  </div>
                </div>
                <div className='flex gap-3 pt-2'>
                  <button
                    type='submit'
                    className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition'
                  >
                    <Save className='h-4 w-4' /> Зберегти
                  </button>
                  <button
                    type='button'
                    onClick={() => setShowLessonForm(false)}
                    className='flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Module Modal */}
        {showEditModuleModal && editModuleData && (
          <EditModuleModal
            isOpen={showEditModuleModal}
            onClose={() => {
              setShowEditModuleModal(false);
              setEditModuleData(null);
            }}
            module={editModuleData}
            onSave={handleEditModule}
          />
        )}

        {/* Edit Lesson Modal */}
        {showEditLessonModal && editLessonData && (
          <EditLessonModal
            isOpen={showEditLessonModal}
            onClose={() => {
              setShowEditLessonModal(false);
              setEditLessonData(null);
            }}
            lesson={editLessonData}
            onSave={handleEditLesson}
          />
        )}
      </main>
    </div>
  );
}
