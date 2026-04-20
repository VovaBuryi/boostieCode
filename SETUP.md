# Налаштування Supabase - Інструкція

## Крок 1: Створення проекту в Supabase

1. Перейдіть на [https://supabase.com](https://supabase.com) та увійдіть/зареєструйтеся
2. Натисніть "New Project"
3. Заповніть:
   - **Name**: boostiecode-platform (або будь-яке інше)
   - **Database Password**: запам'ятайте пароль
   - **Region**: оберіть найближчий (наприклад, Europe)
4. Натисніть "Create new project"
5. Зачекайте 1-2 хвилини, доки проект створиться

## Крок 2: Отримання API ключів

1. У вашому проекті перейдіть до **Settings** (іконка шестеренки)
2. Виберіть **API** у лівому меню
3. Ви побачите:
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon/public key**: довгий рядок починається з `eyJ...`
4. Скопіюйте обидва значення

## Крок 3: Створення таблиць у базі даних

1. У projektі перейдіть до **SQL Editor** (ліве меню)
2. Натисніть "New query"
3. Скопіюйте весь вміст файлу `supabase-schema.sql` з проекту
4. Натисніть **Run** (або Ctrl+Enter)
5. Перевірте, що база даних створена:
   - Перейдіть до **Table editor**
   - Ви повинні бачити таблиці: `profiles`, `courses`, `modules`, `lessons`, `enrollments`, `lesson_progress`

## Крок 4: Налаштування змінних середовища

1. У папці `learning-platform/` створіть файл `.env.local` (якщо його немає)
2. Додайте такі рядки (замініть на свої значення):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Збережіть файл

## Крок 5: Налаштування Email автентифікації (опціонально, але рекомендовано)

1. У Supabase перейдіть до **Authentication** → **Settings**
2. Увімкніть **Email** provider
3. Налаштуйте:
   - **Enable email confirmations**: увімкнено (рекомендовано)
   - **Secure email change**: увімкнено
   - **Enable phone auth**: вимкнено (не потрібно)

**Для тестування можна використовувати підтвердження через email.**

## Крок 6: Додати першого адміністратора

Адміністратор створюється автоматично при реєстрації, але потрібно вручну підвищити його до ролі admin.

**Спосіб 1** (через Supabase UI):
1. Після реєстрації користувача перейдіть до **Table editor** → `profiles`
2. Знайдіть запис нового користувача
3. Змініть `is_admin` на `true`
4. Збережіть

**Спосіб 2** (через SQL):
```sql
UPDATE profiles SET is_admin = true WHERE email = 'your-email@example.com';
```

## Крок 7: Запуск проекту

```bash
cd learning-platform
npm run dev
```

Перевірте роботу:
- http://localhost:3000 - головна сторінка (перенаправляє на логін)
- http://localhost:3000/login - сторінка логінації/реєстрації
- Після входу як адмін - доступ до http://localhost:3000/admin

## Поширені проблеми

### "Error: Database error"
Переконайтеся, що ви справно виконали SQL скрипт з `supabase-schema.sql`.

### "Invalid API key"
Перевірте, що `NEXT_PUBLIC_SUPABASE_URL` та `NEXT_PUBLIC_SUPABASE_ANON_KEY` правильні.

### "Row Level Security policy violation"
Переконайтеся, що RLS політики правильно налаштовані (виконайте повний SQL скрипт).

### Реєстрація не працює
Перевірте, що Email auth увімкнено в Supabase (Settings → Auth → Email).

## Додатково

- Supabase Storage може використовуватися для зберігання зображень курсів
- Для продакшн-деплою рекомендується Vercel + Supabase
- Додайте свої власні стилі в Tailwind config
