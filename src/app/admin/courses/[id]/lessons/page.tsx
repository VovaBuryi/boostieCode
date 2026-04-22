'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
import { Module } from '@/types';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
  BookOpen,
  Loader2,
  X,
  Edit,
} from 'lucide-react';
import { Lesson } from '@/types';
import LessonEditor from '@/components/LessonEditor';

function ModuleForm({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    order_index: 0,
  });

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-xl p-6 max-w-md w-full shadow-2xl'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-gray-900'>Новий модуль</h2>
          <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded'>
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className='space-y-4'
        >
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Назва *
            </label>
            <input
              type='text'
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Опис
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
              rows={2}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Порядок
            </label>
            <input
              type='number'
              value={form.order_index}
              onChange={(e) =>
                setForm({ ...form, order_index: parseInt(e.target.value) || 0 })
              }
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
            />
          </div>
          <div className='flex gap-3'>
            <button
              type='submit'
              className='flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700'
            >
              Створити
            </button>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
            >
              Скасувати
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LessonForm({
  isOpen,
  onClose,
  onSave,
  moduleId,
  lesson,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  moduleId: string;
  lesson?: Lesson;
}) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    video_url: '',
    order_index: 0,
    duration_minutes: '',
  });

  useEffect(() => {
    if (lesson) {
      setForm({
        title: lesson.title || '',
        content: lesson.content || '',
        video_url: lesson.video_url || '',
        order_index: lesson.order_index || 0,
        duration_minutes: lesson.duration_minutes?.toString() || '',
      });
    } else {
      setForm({
        title: '',
        content: '',
        video_url: '',
        order_index: 0,
        duration_minutes: '',
      });
    }
  }, [lesson, isOpen]);

  const handleContentChange = (html: string) => {
    setForm((prev) => ({ ...prev, content: html }));
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-gray-900'>
            {lesson ? 'Редагувати урок' : 'Новий урок'}
          </h2>
          <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded'>
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ ...form, module_id: moduleId, lesson });
          }}
          className='space-y-4'
        >
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Назва *
            </label>
            <input
              type='text'
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Відео URL
            </label>
            <input
              type='url'
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
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
                value={form.order_index}
                onChange={(e) =>
                  setForm({
                    ...form,
                    order_index: parseInt(e.target.value) || 0,
                  })
                }
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Хвилин
              </label>
              <input
                type='number'
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: e.target.value })
                }
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none'
              />
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Вміст
            </label>
            <LessonEditor
              content={form.content}
              onChange={handleContentChange}
              placeholder='Введіть вміст уроку...'
            />
          </div>
          <div className='flex gap-3'>
            <button
              type='submit'
              className='flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700'
            >
              {lesson ? 'Зберегти' : 'Створити'}
            </button>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
            >
              Скасувати
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCourseLessons({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [modules, setModules] = useState<Module[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    try {
      const courseRes = await fetch(`/api/courses/${resolvedParams.id}`);
      const courseData = await courseRes.json();
      if (courseData.title) setCourseTitle(courseData.title);
      if (courseData.modules) setModules(courseData.modules);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  const handleCreateModule = async (data: any) => {
    await fetch(`/api/admin/courses/${resolvedParams.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, type: 'module' }),
    });
    setShowModuleForm(false);
    loadData();
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm('В��далити модуль?')) return;
    await fetch(
      `/api/admin/courses/${resolvedParams.id}/items?type=module&itemId=${id}`,
      { method: 'DELETE' },
    );
    loadData();
  };

  const handleCreateLesson = async (data: any) => {
    const { lesson } = data;
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content || '');
    formData.append('video_url', data.video_url || '');
    formData.append('order_index', String(parseInt(data.order_index) || 0));
    formData.append(
      'duration_minutes',
      String(parseInt(data.duration_minutes) || ''),
    );

    if (lesson?.id) {
      formData.append('type', 'lesson');
      formData.append('itemId', lesson.id);
      await fetch(
        `/api/admin/courses/${resolvedParams.id}/items?type=lesson&itemId=${lesson.id}`,
        {
          method: 'PUT',
          body: formData,
        },
      );
    } else {
      formData.append('type', 'lesson');
      formData.append('module_id', data.module_id);
      await fetch(`/api/admin/courses/${resolvedParams.id}/items`, {
        method: 'POST',
        body: formData,
      });
    }
    setShowLessonForm(false);
    setSelectedModule(null);
    setEditingLesson(null);
    loadData();
  };

  const handleCloseLessonForm = () => {
    setShowLessonForm(false);
    setSelectedModule(null);
    setEditingLesson(null);
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Видалити урок?')) return;
    await fetch(
      `/api/admin/courses/${resolvedParams.id}/items?type=lesson&itemId=${id}`,
      { method: 'DELETE' },
    );
    loadData();
  };

  if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='h-12 w-12 animate-spin text-indigo-600' />
      </div>
    );

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />
      <main className='max-w-7xl mx-auto px-4 py-8'>
        <div className='mb-8 flex items-center gap-4'>
          <Link
            href='/admin'
            className='flex items-center gap-2 text-gray-600 hover:text-indigo-600'
          >
            <ArrowLeft className='h-5 w-5' />
            Назад
          </Link>
          <div className='flex-1'>
            <h1 className='text-3xl font-bold text-gray-900'>{courseTitle}</h1>
            <p className='text-gray-600'>Керування модулями та уроками</p>
          </div>
          <button
            onClick={() => setShowModuleForm(true)}
            className='flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700'
          >
            <PlusCircle className='h-5 w-5' />
            Додати модуль
          </button>
        </div>

        {modules.length === 0 ? (
          <div className='text-center py-20 bg-white rounded-xl shadow'>
            <BookOpen className='h-16 w-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-600 mb-2'>
              Модулів ще немає
            </h3>
            <button
              onClick={() => setShowModuleForm(true)}
              className='px-4 py-2 bg-indigo-600 text-white rounded-lg'
            >
              Додати модуль
            </button>
          </div>
        ) : (
          <div className='space-y-6'>
            {modules.map((module) => (
              <div
                key={module.id}
                className='bg-white rounded-xl shadow border overflow-hidden'
              >
                <div className='px-6 py-4 bg-gray-50 flex justify-between items-center border-b'>
                  <h2 className='text-xl font-bold'>{module.title}</h2>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => {
                        setSelectedModule(module.id);
                        setShowLessonForm(true);
                      }}
                      className='px-3 py-1.5 bg-green-600 text-white rounded text-sm'
                    >
                      Додати урок
                    </button>
                    <button
                      onClick={() => handleDeleteModule(module.id)}
                      className='p-2 text-gray-400 hover:text-red-600'
                    >
                      <Trash2 className='h-5 w-5' />
                    </button>
                  </div>
                </div>
                <div className='divide-y'>
                  {(module?.lessons || []).length === 0 ? (
                    <p className='p-6 text-center text-gray-400 italic'>
                      Уроків немає
                    </p>
                  ) : (
                    module.lessons?.map((lesson) => (
                      <div
                        key={lesson.id}
                        className='p-4 flex justify-between items-center'
                      >
                        <div className='flex items-center gap-3'>
                          <BookOpen className='h-4 w-4 text-indigo-600' />
                          <span>{lesson.title}</span>
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => {
                              setEditingLesson(lesson);
                              setSelectedModule(module.id);
                              setShowLessonForm(true);
                            }}
                            className='text-gray-400 hover:text-indigo-600'
                          >
                            <Edit className='h-4 w-4' />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className='text-red-500 hover:text-red-700'
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
      </main>

      <ModuleForm
        isOpen={showModuleForm}
        onClose={() => setShowModuleForm(false)}
        onSave={handleCreateModule}
      />
      {selectedModule && (
        <LessonForm
          isOpen={showLessonForm}
          onClose={handleCloseLessonForm}
          onSave={handleCreateLesson}
          moduleId={selectedModule}
          lesson={editingLesson ?? undefined}
        />
      )}
    </div>
  );
}
