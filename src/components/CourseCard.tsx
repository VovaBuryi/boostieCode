'use client'

import { Course } from '@/types'
import { BookOpen, CheckCircle, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface CourseCardProps {
  course: Course
  onEnroll: (courseId: string) => void
  isAdmin?: boolean
}

export default function CourseCard({ course, onEnroll, isAdmin = false }: CourseCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {course.image_url && (
        <div className="h-48 bg-gray-200">
          <Image
            src={course.image_url}
            alt={course.title}
            width={400}
            height={192}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {course.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{course.modules_count || 0} модулів</span>
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin ? (
            <>
              <Link
                href={`/admin/courses/${course.id}`}
                className="flex-1 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition text-center"
              >
                Редагувати
              </Link>
              <Link
                href={`/admin/courses/${course.id}/lessons`}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center"
              >
                Матеріали
              </Link>
            </>
          ) : course.enrolled ? (
            <Link
              href={`/course/${course.id}`}
              className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-center flex items-center justify-center gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Продовжити
            </Link>
          ) : (
            <button
              onClick={() => onEnroll(course.id)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Записатися
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
