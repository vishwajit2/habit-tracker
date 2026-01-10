export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  logged_date: string
  created_at: string
}