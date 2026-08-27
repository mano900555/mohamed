'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Users, BookOpen, Calendar, CreditCard, TrendingUp, AlertCircle, Play, AlertTriangle, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalGroups: 0,
    todayAttendance: 0,
    totalIncome: 0,
    pendingPayments: 0,
  })
  const [todayGroups, setTodayGroups] = useState<any[]>([])
  const [riskStudents, setRiskStudents] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})

  useEffect(() => {
    loadStats()
    loadTodayGroups()
    loadRiskStudents()
    loadSettings()
  }, [])

  async function loadStats() {
    const { count: totalStudents } = await supabase.from('students').select('*', { count: 'exact', head: true })
    const { count: activeStudents } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active')
    const { count: totalGroups } = await supabase.from('groups').select('*', { count: 'exact', head: true })

    const today = new Date().toISOString().split('T')[0]
    const { count: todayAttendance } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('lesson_date', today)

    const { data: payments } = await supabase.from('payments').select('amount').eq('type', 'payment')
    const totalIncome = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    setStats({
      totalStudents: totalStudents || 0,
      activeStudents: activeStudents || 0,
      totalGroups: totalGroups || 0,
      todayAttendance: todayAttendance || 0,
      totalIncome,
      pendingPayments: 0,
    })
  }

  async function loadTodayGroups() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const todayName = days[new Date().getDay()]

    const { data } = await supabase.from('groups').select('*').contains('days', [todayName])
    if (data) {
      // Check which ones already have attendance today
      const today = new Date().toISOString().split('T')[0]
      const { data: attData } = await supabase.from('attendance').select('group_id').eq('lesson_date', today)
      const attendedGroups = new Set(attData?.map((a: any) => a.group_id) || [])

      setTodayGroups(data.map((g: any) => ({...g, hasAttendance: attendedGroups.has(g.id)})))
    }
  }

  async function loadRiskStudents() {
    const { data: students } = await supabase.from('students').select('*').eq('status', 'active')
    if (!students) return

    const { data: allAttendance } = await supabase.from('attendance').select('*')
    const { data: allGrades } = await supabase.from('grades').select('*, exams(total_marks)')

    const threshold = parseInt(settings.absence_threshold || '3')
    const risky: any[] = []

    for (const student of students) {
      const studentAtt = allAttendance?.filter((a: any) => a.student_id === student.id) || []
      const absences = studentAtt.filter((a: any) => a.status === 'absent').length
      const lates = studentAtt.filter((a: any) => a.status === 'late').length

      const studentGrades = allGrades?.filter((g: any) => g.student_id === student.id) || []
      const lastGrade = studentGrades.length > 0 
        ? (studentGrades[studentGrades.length - 1].marks / studentGrades[studentGrades.length - 1].exams?.total_marks) * 100 
        : null

      if (absences >= threshold || (lastGrade !== null && lastGrade < 50)) {
        risky.push({
          ...student,
          absences,
          lates,
          lastGrade: lastGrade ? Math.round(lastGrade) : null,
        })
      }
    }

    setRiskStudents(risky)
  }

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      const s: Record<string, string> = {}
      data.forEach((item: any) => { s[item.key] = item.value })
      setSettings(s)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const cards = [
    { label: 'إجمالي الطلاب', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'الطلاب النشطون', value: stats.activeStudents, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'المجموعات', value: stats.totalGroups, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'حضور اليوم', value: stats.todayAttendance, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'إجمالي التحصيل', value: `${stats.totalIncome.toLocaleString()} ج`, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'المستحقات', value: stats.pendingPayments, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <Header title="الرئيسية" subtitle={`مرحبًا ${settings.teacher_name || 'مدرس'} 👋`} />
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition px-4 py-2 rounded-lg hover:bg-red-50">
            <LogOut size={18} /> تسجيل الخروج
          </button>
        </div>

        {/* Risk Alerts */}
        {riskStudents.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-amber-600" />
              <h3 className="font-bold text-amber-800">طلاب يحتاجون متابعة ({riskStudents.length})</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {riskStudents.slice(0, 5).map((s) => (
                <Link
                  key={s.id}
                  href={`/student/${s.id}`}
                  className="bg-white border border-amber-200 px-3 py-2 rounded-lg text-sm hover:shadow-sm transition"
                >
                  <span className="font-medium text-slate-800">{s.name}</span>
                  <span className="text-slate-400 mx-1">|</span>
                  {s.absences > 0 && <span className="text-red-500">{s.absences} غياب</span>}
                  {s.lastGrade !== null && s.lastGrade < 50 && (
                    <span className="text-red-500 mr-1">{s.lastGrade}% درجة</span>
                  )}
                </Link>
              ))}
              {riskStudents.length > 5 && (
                <span className="text-amber-600 text-sm self-center">+{riskStudents.length - 5} آخرون</span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">{card.label}</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bg}`}>
                    <Icon size={24} className={card.color} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Today's Lessons */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">حصص اليوم</h3>
          {todayGroups.length === 0 ? (
            <p className="text-slate-400">لا توجد حصص اليوم</p>
          ) : (
            <div className="space-y-3">
              {todayGroups.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-slate-800">{group.name}</p>
                      <p className="text-sm text-slate-500">{group.subject} — {group.grade}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-medium text-slate-700">{group.start_time?.slice(0, 5)} - {group.end_time?.slice(0, 5)}</p>
                    {group.hasAttendance ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">تم تسجيل الحضور</span>
                    ) : (
                      <Link
                        href={`/session?group=${group.id}&date=${new Date().toISOString().split('T')[0]}`}
                        className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        <Play size={16} /> بدء الحصة
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">نسبة الحضور الكلية</h3>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full border-4 border-green-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">
                  {stats.totalStudents > 0 ? Math.round((stats.todayAttendance / stats.totalStudents) * 100) : 0}%
                </span>
              </div>
              <div className="flex-1">
                <p className="text-slate-500 text-sm">حضور اليوم من إجمالي الطلاب</p>
                <p className="text-slate-700 mt-1">{stats.todayAttendance} / {stats.totalStudents} طالب</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">الخزنة</h3>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full border-4 border-emerald-500 flex items-center justify-center">
                <span className="text-xl font-bold text-emerald-600">{stats.totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex-1">
                <p className="text-slate-500 text-sm">إجمالي الإيرادات</p>
                <p className="text-slate-700 mt-1">جنية مصري</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
