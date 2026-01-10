'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Habit, HabitLog } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface Props {
  user: User
}

type ViewMode = 'tracker' | 'stats'

export default function HabitTracker({ user }: Props) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [newHabitName, setNewHabitName] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('tracker')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadHabits()
    loadLogs()
  }, [])

  const loadHabits = async () => {
    const { data } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setHabits(data)
    setLoading(false)
  }

  const loadLogs = async () => {
    const { data } = await supabase
      .from('habit_logs')
      .select('*')
    
    if (data) setLogs(data)
  }

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHabitName.trim()) return

    const { data, error } = await supabase
      .from('habits')
      .insert([{ name: newHabitName, user_id: user.id }])
      .select()

    if (data) {
      setHabits([...data, ...habits])
      setNewHabitName('')
    }
  }

  const deleteHabit = async (habitId: string) => {
    await supabase.from('habits').delete().eq('id', habitId)
    setHabits(habits.filter(h => h.id !== habitId))
    setLogs(logs.filter(l => l.habit_id !== habitId))
  }

  const toggleLog = async (habitId: string, date: string) => {
    const existingLog = logs.find(
      l => l.habit_id === habitId && l.logged_date === date
    )

    if (existingLog) {
      await supabase.from('habit_logs').delete().eq('id', existingLog.id)
      setLogs(logs.filter(l => l.id !== existingLog.id))
    } else {
      const { data } = await supabase
        .from('habit_logs')
        .insert([{ habit_id: habitId, logged_date: date, user_id: user.id }])
        .select()
      
      if (data) setLogs([...logs, ...data])
    }
  }

  const isLoggedForDate = (habitId: string, date: string) => {
    return logs.some(l => l.habit_id === habitId && l.logged_date === date)
  }

  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date)
    }
    return days
  }

  const getDateRange = (days: number) => {
    const dates = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const calculateStats = (habitId: string, days: number) => {
    const dateRange = getDateRange(days)
    const completedDays = dateRange.filter(date => 
      logs.some(l => l.habit_id === habitId && l.logged_date === date)
    ).length
    return Math.round((completedDays / days) * 100)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const days = getLast7Days()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Habit Tracker
              </h1>
              <p className="text-gray-600">Build better habits, one day at a time</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-full shadow-sm border border-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Add Habit Form */}
          <form onSubmit={addHabit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="What habit do you want to build?"
                className="flex-1 px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
              >
                Add Habit
              </button>
            </div>
          </form>
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex gap-2 bg-white rounded-xl p-1.5 shadow-md border border-gray-100 w-fit">
          <button
            onClick={() => setViewMode('tracker')}
            className={`px-6 py-2.5 font-semibold rounded-lg transition-all ${
              viewMode === 'tracker'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📅 Tracker
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`px-6 py-2.5 font-semibold rounded-lg transition-all ${
              viewMode === 'stats'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📊 Statistics
          </button>
        </div>

      {viewMode === 'tracker' ? (
        // Tracker View
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Habit
                  </th>
                  {days.map((day) => (
                    <th key={day.toISOString()} className="px-3 py-4 text-center">
                      <div className="text-xs font-bold text-gray-700 uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-xs text-gray-500 font-semibold">{day.getDate()}</div>
                    </th>
                  ))}
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {habits.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-6xl">🎯</div>
                        <p className="text-gray-500 font-medium">No habits yet. Start building your routine!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  habits.map((habit, idx) => (
                    <tr key={habit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                          <span className="font-semibold text-gray-900">{habit.name}</span>
                        </div>
                      </td>
                      {days.map((day) => {
                        const dateStr = day.toISOString().split('T')[0]
                        const isLogged = isLoggedForDate(habit.id, dateStr)
                        return (
                          <td key={dateStr} className="px-3 py-5 text-center">
                            <button
                              onClick={() => toggleLog(habit.id, dateStr)}
                              className={`w-10 h-10 rounded-xl border-2 transition-all transform hover:scale-110 ${
                                isLogged
                                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-500 shadow-lg shadow-green-200'
                                  : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                              }`}
                            >
                              {isLogged && (
                                <svg className="w-6 h-6 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          </td>
                        )
                      })}
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all border border-red-200 hover:border-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Statistics View
        <div className="space-y-6">
          {habits.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-16 text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-500 font-medium text-lg">No habits yet. Add your first habit above!</p>
            </div>
          ) : (
            habits.map((habit) => {
              const stats7 = calculateStats(habit.id, 7)
              const stats30 = calculateStats(habit.id, 30)
              const stats90 = calculateStats(habit.id, 90)

              return (
                <div key={habit.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8 hover:shadow-2xl transition-shadow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                      <h3 className="text-xl font-bold text-gray-900">{habit.name}</h3>
                    </div>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all border border-red-200 hover:border-red-600"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 7 Days */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">📅</span>
                        <div className="text-sm font-bold text-blue-900 uppercase tracking-wide">Last 7 Days</div>
                      </div>
                      <div className="flex items-baseline gap-2 mb-4">
                        <div className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{stats7}%</div>
                      </div>
                      <div className="bg-blue-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-700 ease-out shadow-lg"
                          style={{ width: `${stats7}%` }}
                        />
                      </div>
                    </div>

                    {/* 30 Days */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">📆</span>
                        <div className="text-sm font-bold text-purple-900 uppercase tracking-wide">Last 30 Days</div>
                      </div>
                      <div className="flex items-baseline gap-2 mb-4">
                        <div className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">{stats30}%</div>
                      </div>
                      <div className="bg-purple-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-700 ease-out shadow-lg"
                          style={{ width: `${stats30}%` }}
                        />
                      </div>
                    </div>

                    {/* 90 Days */}
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🗓️</span>
                        <div className="text-sm font-bold text-emerald-900 uppercase tracking-wide">Last 90 Days</div>
                      </div>
                      <div className="flex items-baseline gap-2 mb-4">
                        <div className="text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">{stats90}%</div>
                      </div>
                      <div className="bg-emerald-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all duration-700 ease-out shadow-lg"
                          style={{ width: `${stats90}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
    </div>
  )
}