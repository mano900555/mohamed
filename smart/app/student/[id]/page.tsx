'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { Users, Phone, BookOpen, Calendar, CreditCard, FileText, TrendingUp } from 'lucide-react'

export default function StudentProfile() {
  const params = useParams()
  const id = params.id as string

  const [student, setStudent] = useState<any>(null)
  const [attendance, setAttendance] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    if (id) {
      loadStudent()
      loadAttendance()
      loadPayments()
      loadGrades()
    }
  }, [id])

  async function loadStudent() {
    const { data } = await supabase.from('students').select('*, groups(name, subject, grade)').eq('id', id).single()
    if (data) setStudent(data)
  }

  async function loadAttendance() {
    const { data } = await supabase.from('attendance').select('*').eq('student_id', id).order('lesson_date', { ascending: false }).limit(20)
    if (data) setAttendance(data)
  }

  async function loadPayments() {
    const { data } = await supabase.from('payments').select('*').eq('student_id', id).order('date', { ascending: false })
    if (data) setPayments(data)
  }

  async function loadGrades() {
    const { data } = await supabase.from('grades').select('*, exams(title, total_marks)').eq('student_id', id)
    if (data) setGrades(data)
  }

  const tabs = [
    { key: 'info', label: 'البيانات', icon: Users },
    { key: 'attendance', label: 'الحضور', icon: Calendar },
    { key: 'grades', label: 'الدرجات', icon: TrendingUp },
    { key: 'payments', label: 'المدفوعات', icon: CreditCard },
  ]

  if (!student) return <div className="flex min-h-screen items-center justify-center mr-64">جاري التحميل...</div>

  const presentCount = attendance.filter(a => a.status === 'present').length
  const absentCount = attendance.filter(a => a.status === 'absent').length
  const totalLessons = attendance.length
  const attendanceRate = totalLessons > 0 ? Math.round((presentCount / totalLessons) * 100) : 0

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
              {student.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
              <p className="text-slate-500 mt-1">{student.grade} — {student.groups?.name}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                <span className="flex items-center gap-1"><Phone size={14} /> {student.phone}</span>
                <span className="flex items-center gap-1"><Phone size={14} /> ولي الأمر: {student.parent_phone}</span>
                <span className="flex items-center gap-1"><FileText size={14} /> ID: {student.center_id}</span>
              </div>
            </div>
            <div className="mr-auto text-center">
              <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center">
                <span className="text-xl font-bold text-green-600">{attendanceRate}%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">نسبة الحضور</p>
            </div>
          </div>
        </div>

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

        {activeTab === 'info' && (
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4">البيانات الأساسية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg"><span className="text-slate-500 text-sm">الاسم:</span><p className="font-medium">{student.name}</p></div>
              <div className="p-4 bg-slate-50 rounded-lg"><span className="text-slate-500 text-sm">الصف:</span><p className="font-medium">{student.grade}</p></div>
              <div className="p-4 bg-slate-50 rounded-lg"><span className="text-slate-500 text-sm">المجموعة:</span><p className="font-medium">{student.groups?.name}</p></div>
              <div className="p-4 bg-slate-50 rounded-lg"><span className="text-slate-500 text-sm">المادة:</span><p className="font-medium">{student.groups?.subject}</p></div>
              <div className="p-4 bg-slate-50 rounded-lg"><span className="text-slate-500 text-sm">رقم الهاتف:</span><p className="font-medium">{student.phone}</p></div>
              <div className="p-4 bg-slate-50 rounded-lg"><span className="text-slate-500 text-sm">ولي الأمر:</span><p className="font-medium">{student.parent_phone}</p></div>
              <div className="p-4 bg-slate-50 rounded-lg"><span className="text-slate-500 text-sm">Center ID:</span><p className="font-medium">{student.center_id}</p></div>
              <div className="p-4 bg-slate-50 rounded-lg"><span className="text-slate-500 text-sm">الحالة:</span><p className="font-medium">{student.status === 'active' ? 'نشط' : 'متوقف'}</p></div>
              {student.notes && (
                <div className="p-4 bg-slate-50 rounded-lg md:col-span-2"><span className="text-slate-500 text-sm">ملاحظات:</span><p className="font-medium">{student.notes}</p></div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50"><tr><th className="text-right px-6 py-3 text-sm">التاريخ</th><th className="text-center px-6 py-3 text-sm">الحالة</th></tr></thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-6 py-3">{a.lesson_date}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        a.status === 'present' ? 'bg-green-100 text-green-700' :
                        a.status === 'absent' ? 'bg-red-100 text-red-700' :
                        a.status === 'late' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {a.status === 'present' ? 'حاضر' : a.status === 'absent' ? 'غائب' : a.status === 'late' ? 'متأخر' : 'بعذر'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50"><tr><th className="text-right px-6 py-3 text-sm">الاختبار</th><th className="text-center px-6 py-3 text-sm">الدرجة</th><th className="text-center px-6 py-3 text-sm">النسبة</th></tr></thead>
              <tbody>
                {grades.map((g) => {
                  const percentage = g.exams?.total_marks ? Math.round((g.marks / g.exams.total_marks) * 100) : 0
                  return (
                    <tr key={g.id} className="border-t">
                      <td className="px-6 py-3">{g.exams?.title}</td>
                      <td className="px-6 py-3 text-center font-medium">{g.marks} / {g.exams?.total_marks}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${percentage >= 80 ? 'bg-green-100 text-green-700' : percentage >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {percentage}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50"><tr><th className="text-right px-6 py-3 text-sm">التاريخ</th><th className="text-right px-6 py-3 text-sm">النوع</th><th className="text-center px-6 py-3 text-sm">المبلغ</th><th className="text-right px-6 py-3 text-sm">ملاحظات</th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-6 py-3">{p.date}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        p.type === 'payment' ? 'bg-green-100 text-green-700' : p.type === 'subscription' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.type === 'payment' ? 'دفعة' : p.type === 'subscription' ? 'اشتراك' : 'مصروف'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center font-medium">{p.amount?.toLocaleString()} ج</td>
                    <td className="px-6 py-3 text-slate-500">{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
