'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Users, Calendar, TrendingUp, CreditCard, Award, AlertTriangle } from 'lucide-react'

export default function ReportsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('students')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: s } = await supabase.from('students').select('*')
    if (s) setStudents(s)

    const { data: a } = await supabase.from('attendance').select('*')
    if (a) setAttendance(a)

    const { data: p } = await supabase.from('payments').select('*')
    if (p) setPayments(p)

    const { data: g } = await supabase.from('grades').select('*, exams(title, total_marks)')
    if (g) setGrades(g)
  }

  const tabs = [
    { key: 'students', label: 'الطلاب', icon: Users },
    { key: 'attendance', label: 'الحضور', icon: Calendar },
    { key: 'grades', label: 'الدرجات', icon: Award },
    { key: 'finance', label: 'المالية', icon: CreditCard },
  ]

  // Students report
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.status === 'active').length
  const newThisMonth = students.filter(s => {
    const created = new Date(s.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length

  // Attendance report
  const totalAttendanceRecords = attendance.length
  const presentCount = attendance.filter(a => a.status === 'present').length
  const absentCount = attendance.filter(a => a.status === 'absent').length
  const lateCount = attendance.filter(a => a.status === 'late').length
  const overallRate = totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0

  // Finance report
  const totalIncome = payments.filter(p => p.type === 'payment' || p.type === 'subscription').reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalExpenses = payments.filter(p => p.type === 'expense').reduce((sum, p) => sum + (p.amount || 0), 0)
  const netBalance = totalIncome - totalExpenses

  // Grades report
  const avgGrade = grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + ((g.marks / g.exams?.total_marks) * 100 || 0), 0) / grades.length) : 0

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <Header title="التقارير" subtitle="إحصائيات وتحليلات النظام" />

        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'students' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">إجمالي الطلاب</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{totalStudents}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">الطلاب النشطون</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{activeStudents}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">الطلاب الجدد هذا الشهر</p>
              <p className="text-3xl font-bold text-primary mt-2">{newThisMonth}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm md:col-span-3">
              <h3 className="text-lg font-bold mb-4">توزيع الطلاب حسب الصف</h3>
              <div className="space-y-3">
                {Array.from(new Set(students.map(s => s.grade))).filter(Boolean).map(grade => {
                  const count = students.filter(s => s.grade === grade).length
                  const percent = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
                  return (
                    <div key={grade} className="flex items-center gap-4">
                      <span className="w-32 text-sm text-slate-600">{grade}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-4">
                        <div className="bg-primary h-4 rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-12 text-sm font-medium text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">إجمالي سجلات الحضور</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{totalAttendanceRecords}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">الحاضرون</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{presentCount}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">الغائبون</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{absentCount}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">المتأخرون</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{lateCount}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm md:col-span-4">
              <h3 className="text-lg font-bold mb-4">نسبة الحضور الكلية</h3>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-full border-8 border-green-500 flex items-center justify-center">
                  <span className="text-3xl font-bold text-green-600">{overallRate}%</span>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="w-20 text-sm text-slate-600">حاضر</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-4">
                      <div className="bg-green-500 h-4 rounded-full" style={{ width: `${totalAttendanceRecords > 0 ? (presentCount/totalAttendanceRecords)*100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-20 text-sm text-slate-600">غائب</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-4">
                      <div className="bg-red-500 h-4 rounded-full" style={{ width: `${totalAttendanceRecords > 0 ? (absentCount/totalAttendanceRecords)*100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-20 text-sm text-slate-600">متأخر</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-4">
                      <div className="bg-orange-500 h-4 rounded-full" style={{ width: `${totalAttendanceRecords > 0 ? (lateCount/totalAttendanceRecords)*100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">إجمالي الدرجات المسجلة</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{grades.length}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">متوسط النسبة المئوية</p>
              <p className="text-3xl font-bold text-primary mt-2">{avgGrade}%</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">أعلى درجة</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {grades.length > 0 ? Math.max(...grades.map(g => (g.marks / g.exams?.total_marks) * 100 || 0)).toFixed(0) : 0}%
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm md:col-span-3">
              <h3 className="text-lg font-bold mb-4">توزيع الدرجات</h3>
              <div className="space-y-3">
                {['90-100%', '80-89%', '70-79%', '60-69%', '50-59%', 'أقل من 50%'].map((range, i) => {
                  const ranges = [
                    [90, 100], [80, 89], [70, 79], [60, 69], [50, 59], [0, 49]
                  ]
                  const [min, max] = ranges[i]
                  const count = grades.filter(g => {
                    const pct = (g.marks / g.exams?.total_marks) * 100 || 0
                    return pct >= min && pct <= max
                  }).length
                  const percent = grades.length > 0 ? Math.round((count / grades.length) * 100) : 0
                  return (
                    <div key={range} className="flex items-center gap-4">
                      <span className="w-24 text-sm text-slate-600">{range}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-4">
                        <div className={`h-4 rounded-full transition-all ${
                          i === 0 ? 'bg-green-500' : i === 1 ? 'bg-green-400' : i === 2 ? 'bg-blue-400' : i === 3 ? 'bg-yellow-400' : i === 4 ? 'bg-orange-400' : 'bg-red-500'
                        }`} style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-12 text-sm font-medium text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">إجمالي الإيرادات</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{totalIncome.toLocaleString()} ج</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">إجمالي المصروفات</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{totalExpenses.toLocaleString()} ج</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">صافي الرصيد</p>
              <p className={`text-3xl font-bold mt-2 ${netBalance >= 0 ? 'text-primary' : 'text-red-600'}`}>
                {netBalance.toLocaleString()} ج
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
