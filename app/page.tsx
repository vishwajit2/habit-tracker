import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HabitTracker from '@/components/HabitTracker'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <HabitTracker user={user} />
    </main>
  )
}