## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Vercel account (optional, for deployment)

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/habit-tracker.git
cd habit-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the database schema:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create habits table
create table habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint habits_name_check check (char_length(name) > 0)
);

-- Create habit_logs table
create table habit_logs (
  id uuid default uuid_generate_v4() primary key,
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  logged_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(habit_id, logged_date)
);

-- Enable Row Level Security
alter table habits enable row level security;
alter table habit_logs enable row level security;

-- Create RLS policies
create policy "Users can view own habits" on habits for select using (auth.uid() = user_id);
create policy "Users can create own habits" on habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on habits for delete using (auth.uid() = user_id);

create policy "Users can view own logs" on habit_logs for select using (auth.uid() = user_id);
create policy "Users can create own logs" on habit_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own logs" on habit_logs for delete using (auth.uid() = user_id);

-- Create indexes
create index habits_user_id_idx on habits(user_id);
create index habit_logs_habit_id_idx on habit_logs(habit_id);
create index habit_logs_logged_date_idx on habit_logs(logged_date);
```

3. Go to **Settings** → **API** and copy your project URL and anon key

### 4. Configure environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Disable email confirmation (for testing)

1. Go to **Authentication** → **Providers** in Supabase
2. Click on **Email**
3. Disable **Confirm email**
4. Click **Save**

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **New Project** → Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**

### Configure Supabase for production

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://your-app.vercel.app`
3. Add to **Redirect URLs**: `https://your-app.vercel.app/**`
