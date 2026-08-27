'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Users, Calendar, CreditCard, TrendingUp, BookOpen } from 'lucide-react'

export default function ParentPortal() {
  const [searchId, setSearchId] = useState('')
  const [student, setStudent] = useState<any>(null)
  const [attendance, setAttendance] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function searchStudent() {
    if (!searchId.trim()) return
    setLoading(true)

    const { data: students } = await supabase
      .from('students')
      .select('*, groups(name, subject, grade, days, start_time, end_time)')
      .or(`center_id.eq.${searchId},phone.eq.${searchId}`)
      .single()

    if (students) {
      setStudent(students)

      const { data: att } = await supabase.from('attendance').select('*').eq('student_id', students.id).order('lesson_date', { ascending: false }).limit(10)
      setAttendance(att || [])

      const { data: pay } = await supabase.from('payments').select('*').eq('student_id', students.id).order('date', { ascending: false })
      setPayments(pay || [])

      const { data: grd } = await supabase.from('grades').select('*, exams(title, total_marks)').eq('student_id', students.id)
      setGrades(grd || [])
    } else {
      alert('لم يتم العثور على الطالب')
      setStudent(null)
    }
    setLoading(false)
  }

  const presentCount = attendance.filter(a => a.status === 'present').length
  const totalLessons = attendance.length
  const attendanceRate = totalLessons > 0 ? Math.round((presentCount / totalLessons) * 100) : 0

  const totalPaid = payments.filter(p => p.type === 'payment' || p.type === 'subscription').reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-2xl font-bold text-slate-800 text-center">بوابة ولي الأمر</h1>
          <p className="text-slate-500 text-center mt-2">أدخل رقم Center ID أو رقم الهاتف لمتابعة ابنك</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="رقم Center ID أو الهاتف..."
            className="flex-1 border p-4 rounded-lg text-lg"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchStudent()}
          />
          <button
            onClick={searchStudent}
            disabled={loading}
            className="bg-primary text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {loading ? 'جاري البحث...' : 'بحث'}
          </button>
        </div>

        {student && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  {student.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
                  <p className="text-slate-500">{student.grade} — {student.groups?.name}</p>
                </div>
                <div className="mr-auto text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center">
                    <span className="text-lg font-bold text-green-600">{attendanceRate}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">الحضور</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar size={20} className="text-primary" />
                  <span className="text-slate-500 text-sm">آخر الحضور</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{attendance.length} حصة</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard size={20} className="text-green-600" />
                  <span className="text-slate-500 text-sm">المدفوع</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{totalPaid.toLocaleString()} ج</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp size={20} className="text-orange-600" />
                  <span className="text-slate-500 text-sm">الاختبارات</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{grades.length}</p>
              </div>
            </div>

            {student.groups && (
              <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BookOpen size={20} className="text-primary" />
                  الجدول
                </h3>
                <div className="space-y-2">
                  <p><span className="text-slate-500">المادة:</span> <span className="font-medium">{student.groups.subject}</span></p>
                  <p><span className="text-slate-500">الأيام:</span> <span className="font-medium">{student.groups.days?.join('، ')}</span></p>
                  <p><span className="text-slate-500">الوقت:</span> <span className="font-medium">{student.groups.start_time?.slice(0, 5)} - {student.groups.end_time?.slice(0, 5)}</span></p>
                </div>
              </div>
            )}

            {attendance.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4">سجل الحضور</h3>
                <div className="space-y-2">
                  {attendance.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span>{a.lesson_date}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        a.status === 'present' ? 'bg-green-100 text-green-700' :
                        a.status === 'absent' ? 'bg-red-100 text-red-700' :
                        a.status === 'late' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {a.status === 'present' ? 'حاضر' : a.status === 'absent' ? 'غائب' : a.status === 'late' ? 'متأخر' : 'بعذر'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {grades.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4">الدرجات</h3>
                <div className="space-y-2">
                  {grades.map((g) => {
                    const percentage = g.exams?.total_marks ? Math.round((g.marks / g.exams.total_marks) * 100) : 0
                    return (
                      <div key={g.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span>{g.exams?.title}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${percentage >= 80 ? 'bg-green-100 text-green-700' : percentage >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {g.marks} / {g.exams?.total_marks} ({percentage}%)
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
