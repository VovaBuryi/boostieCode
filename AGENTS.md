# BoostieCode Learning Platform - Project Configuration

## Available Commands

These are the commands that should be run when working on this project:

### Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

### Setup
1. Set up Supabase credentials in `.env.local`
2. Run `supabase-schema.sql` in Supabase SQL editor
3. Create first admin user and set `is_admin = true` in profiles table

## Project Structure

The platform consists of:

1. **Authentication**: Login/Register pages at `/login`
2. **Admin Panel**: Full CRUD at `/admin` (admin only)
3. **User Dashboard**: Course catalog at `/`, My Courses at `/my-courses`
4. **Course Viewer**: Lesson player with progress at `/course/[id]`
5. **Database**: Supabase with 6 tables (profiles, courses, modules, lessons, enrollments, lesson_progress)

## Key Routes

- `/login` - Authentication
- `/` - Course listing (redirects to /my-courses for non-admins)
- `/my-courses` - User's enrolled courses and statistics
- `/admin` - Admin dashboard with course management
- `/admin/courses` - Course CRUD
- `/admin/courses/[id]/lessons` - Module and lesson management
- `/course/[id]` - Course content viewer

## Database Schema

The platform uses the following main tables with Row Level Security (RLS):
- `profiles` - Extended user data (id from auth.users, email, full_name, is_admin)
- `courses` - Course information
- `modules` - Course modules/units
- `lessons` - Individual lessons
- `enrollments` - User course enrollments
- `lesson_progress` - Track completed lessons and video position

## Technologies

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Lucide React (icons)

## Deployment

Recommended: Vercel + Supabase

Configure environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
