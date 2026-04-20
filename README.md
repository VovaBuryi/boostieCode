# BoostieCode - Платформа для навчання

Повноцінна платформа для навчання з роллю адміністратора та користувача, побудована на Next.js з використанням Supabase як бекенд.

## Функціонал

### Для адміністратора:
- Додавання/редагування/видалення курсів
- Керування модулями та уроками
- Завантаження зображень для курсів
- Створення контенту (текст, відео посилання)
- Підтримка української мови

### Для користувача:
- Реєстрація та авторизація
- Перегляд доступних курсів
- Запис на курси
- Проходження уроків
- Відстеження прогресу
- Статистика навчання
- Позначення уроків як пройдених

## Технології

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Бекенд**: Supabase (база даних, автентифікація)
- **UI компоненти**: Lucide React (іконки)
- **Стану**: React Context API

## Встановлення та налаштування

### 1. Клонування та встановлення залежностей

```bash
cd learning-platform
npm install
```

### 2. Налаштування Supabase

1. Створіть новий проект на [Supabase](https://supabase.com)
2. У секції **SQL Editor** виконайте скрипт з файлу `supabase-schema.sql`
3. Отримайте URL та Anon Key з налаштувань проекту (Project Settings → API)

### 3. Налаштування змінних середовища

Створіть файл `.env.local` на основі `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Запуск проекту

```bash
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000) у браузері.

## Структура проекту

```
src/
├── app/                    # Next.js App Router
│   ├── admin/              # Адмін-панель
│   │   ├── page.tsx        # Головна адмін-панель
│   │   └── courses/        # Керування курсами
│   │       ├── page.tsx    # Список курсів
│   │       └── [id]/       # Деталі курсу
│   │           └── lessons/
│   │               └── page.tsx  # Керування уроками
│   ├── course/             # Перегляд курсу (користувач)
│   │   └── [id]/
│   │       └── page.tsx
│   ├── my-courses/         # Мої курси та статистика
│   │   └── page.tsx
│   ├── login/              # Сторінка логінації
│   │   └── page.tsx
│   ├── layout.tsx          # Головний layout
│   └── page.tsx            # Головна сторінка
├── components/             # React компоненти
│   ├── AuthProvider.tsx    # Контекст автентифікації
│   ├── CourseCard.tsx      # Картка курсу
│   ├── Navbar.tsx          # Навігація
│   └── ProtectedRoute.tsx  # Захищені маршрути
├── lib/                    # Utils
│   ├── supabase.ts         # Клієнт Supabase
│   ├── database.types.ts   # TypeScript типи
│   ├── courses.ts          # API функції для курсів
│   └── enrollments.ts      # API функції для записів
├── types/                  # TypeScript типи
│   └── index.ts
└── middleware.ts           # Middleware для захисту маршрутів
```

## База даних

### Основні таблиці:

- **profiles** - профілі користувачів (розширення auth.users)
- **courses** - курси
- **modules** - модулі (розділи) курсів
- **lessons** - уроки (контент)
- **enrollments** - записи користувачів на курси
- **lesson_progress** - прогрес пройдення уроків

## Ролі користувачів

1. **Адміністратор** (`is_admin = true`)
   - Доступ до `/admin/*`
   - Можливість створювати/редагувати/видаляти курси та матеріали

2. **Користувач** (`is_admin = false`)
   - Перегляд курсів
   - Запис на курси
   - Відстеження прогресу
   - Перегляд статистики

## API Endpoints (Server Actions)

### Курси:
- `getCourses()` - отримати всі курси
- `getCourseById(id)` - отримати курс за ID з модулями та уроками
- `createCourse(data)` - створити курс (admin)
- `updateCourse(id, data)` - оновити курс (admin)
- `deleteCourse(id)` - видалити курс (admin)

### Модулі та уроки:
- Аналогічні функції для роботи з модулями та уроками

### Записи та прогрес:
- `enrollInCourse(courseId)` - записатися на курс
- `getUserEnrollments()` - отримати мої курси
- `markLessonComplete(lessonId)` - позначити урок як пройдений
- `updateLessonProgress(lessonId, position)` - оновити позицію у відео
- `getCourseProgress(courseId)` - отримати прогрес курсу
- `getUserStatistics()` - отримати загальну статистику

## Розширення функціоналу

**Можливі покращення:**
- Тести та квізи після уроків
- Система коментарів та обговорень
- Нотифікації email
- Пакетне завантаження контенту
- Видача сертифікатів
- Групи та інтеграція з Slack/Discord
- Реальний відеоплеєр
- system for quizzes and assignments

## Примітки

- Для роботи з Supabase потрібно активований акаунт
- Перший адмін створюється автоматично - потрібно вручну змінити `is_admin = true` для потрібного користувача в таблиці `profiles`
- Рекомендовано налаштувати Email автентифікацію в Supabase

## Підтримка

Для питань та пропозиций створюйте issues у репозиторії.
