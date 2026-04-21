'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Course } from '@/types';
import Navbar from '@/components/Navbar';
import LessonEditor from '@/components/LessonEditor';
import { PlusCircle, Save, Trash2, Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
  });
  const [descriptionHtml, setDescriptionHtml] = useState('');

  const isMountedRef = useRef(true);

  const loadCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/courses');
      const data = await res.json();
      if (isMountedRef.current) {
        setCourses(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadCourses();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadCourses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCourse) {
        const res = await fetch(`/api/admin/courses/${editingCourse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const raw = await res.text();
        const data = raw ? JSON.parse(raw) : {};
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update course');
        }
        setCourses(
          courses.map((c) =>
            c.id === editingCourse.id
              ? { ...c, ...formData, description: descriptionHtml }
              : c,
          ),
        );
        setEditingCourse(null);
      } else {
        const res = await fetch('/api/admin/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, description: descriptionHtml }),
        });
        const raw = await res.text();
        const data = raw ? JSON.parse(raw) : {};
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create course');
        }
        if (data.id) {
          setCourses([
            {
              ...formData,
              description: descriptionHtml,
              id: data.id,
              created_by: '',
              created_at: '',
              updated_at: '',
            },
            ...courses,
          ]);
        }
      }

      resetForm();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      image_url: course.image_url || '',
    });
    setDescriptionHtml(course.description || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей курс?')) return;

    const res = await fetch(`/api/admin/courses?id=${id}`, {
      method: 'DELETE',
    });
    const raw = await res.text();
    const data = raw ? JSON.parse(raw) : {};
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete course');
    }
    setCourses(courses.filter((c) => c.id !== id));
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', image_url: '' });
    setDescriptionHtml('');
    setEditingCourse(null);
    setShowForm(false);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <main className='max-w-7xl mx-auto px-4 py-8'>
        <div className='mb-8 flex justify-between items-center'>
          <div className='flex items-center gap-4'>
            <Link
              href='/admin'
              className='flex items-center gap-2 text-gray-600 hover:text-gray-900'
            >
              <ArrowLeft className='h-5 w-5' />
              Назад
            </Link>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Керування курсами
              </h1>
              <p className='text-gray-600'>
                Створюйте, редагуйте та видаляйте курси
              </p>
            </div>
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className='flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition'
            >
              <PlusCircle className='h-5 w-5' />
              Додати курс
            </button>
          )}
        </div>

        {showForm && (
          <div className='bg-white rounded-lg shadow p-6 mb-8'>
            <h2 className='text-xl font-semibold mb-4'>
              {editingCourse ? 'Редагувати курс' : 'Новий курс'}
            </h2>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Назва курсу *
                </label>
                <input
                  type='text'
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Опис
                </label>
                <LessonEditor
                  content={descriptionHtml}
                  onChange={(html) => {
                    setDescriptionHtml(html);
                    setFormData({ ...formData, description: html });
                  }}
                  placeholder='Введіть опис курсу...'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  URL зображення
                </label>
                <input
                  type='url'
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none'
                  placeholder='https://example.com/image.jpg'
                />
              </div>

              <div className='flex gap-3'>
                <button
                  type='submit'
                  className='flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition'
                >
                  <Save className='h-4 w-4' />
                  {editingCourse ? 'Оновити' : 'Створити'}
                </button>
                <button
                  type='button'
                  onClick={resetForm}
                  className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
          </div>
        ) : courses.length === 0 ? (
          <div className='text-center py-20 bg-white rounded-lg shadow'>
            <PlusCircle className='h-16 w-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-600 mb-2'>
              Курсів ще немає
            </h3>
            <p className='text-gray-500 mb-6'>Створіть свій перший курс</p>
            <button
              onClick={() => setShowForm(true)}
              className='inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition'
            >
              <PlusCircle className='h-5 w-5' />
              Додати курс
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {courses.map((course) => (
              <div key={course.id} className='bg-white rounded-lg shadow p-6'>
                <h3 className='text-lg font-bold text-gray-900 mb-2'>
                  {course.title}
                </h3>
                {course.description && (
                  <p className='text-gray-600 mb-4 line-clamp-3'>
                    {course.description}
                  </p>
                )}
                <div className='flex gap-2'>
                  <button
                    onClick={() => handleEdit(course)}
                    className='flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm'
                  >
                    <Edit className='h-4 w-4' />
                    Редагувати
                  </button>
                  <Link
                    href={`/admin/courses/${course.id}/lessons`}
                    className='flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-sm'
                  >
                    <PlusCircle className='h-4 w-4' />
                    Матеріали
                  </Link>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className='flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm'
                  >
                    <Trash2 className='h-4 w-4' />
                    Видалити
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
