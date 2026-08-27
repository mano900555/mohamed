'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Plus, Award, Users, TrendingUp, Save } from 'lucide-react'

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [showGrades, setShowGrades] = useState<string | null>(null)
  const [newExam, setNewExam] = useState({
    title: '', group_id: '', total_marks: '', exam_date: new Date().toISOString().split('T')[0]
  })
  const [studentGrades, setStudentGrades] = useState<Record<string, string>>({})

  useEffect(() => {
    loadExams()
    loadGroups()
  }, [])

  async function loadExams() {
    const { data } = await supabase.from('exams').select('*, groups(name, subject, grade)').order('created_at', { ascending: false })
    if (data) setExams(data)
  }

  async function loadGroups() {
    const { data } = await supabase.from('groups').select('*')
    if (data) setGroups(data)
  }

  async function addExam(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('exams').insert([{
      ...newExam,
      total_marks: parseFloat(newExam.total_marks),
    }])
    setNewExam({ title: '', group_id: '', total_marks: '', exam_date: new Date().toISOString().split('T')[0] })
    setShowAdd(false)
    loadExams()
  }

  async function openGrades(examId: string, groupId: string) {
    setShowGrades(examId)
    const { data: studs } = await supabase.from('students').select('*').eq('group_id', groupId).eq('status', 'active')
    if (studs) {
      setStudents(studs)
      const { data: grd } = await supabase.from('grades').select('*').eq('exam_id', examId)
      if (grd) {
        const existing: Record<string, string> = {}
        grd.forEach((g: any) => { existing[g.student_id] = g.marks.toString() })
        setStudentGrades(existing)
      } else {
        setStudentGrades({})
      }
    }
  }

  async function saveGrades() {
    if (!showGrades) return
    const records = Object.entries(studentGrades)
      .filter(([_, marks]) => marks !== '')
      .map(([student_id, marks]) => ({
        student_id,
        exam_id: showGrades,
        marks: parseFloat(marks),
      }))

    await supabase.from('grades').delete().eq('exam_id', showGrades)
    if (records.length > 0) {
      await supabase.from('grades').insert(records)
    }
    alert('تم حفظ الدرجات بنجاح!')
    setShowGrades(null)
    loadExams()
  }

  async function deleteExam(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار ودرجاته؟')) return
    await supabase.from('grades').delete().eq('exam_id', id)
    await supabase.from('exams').delete().eq('id', id)
    loadExams()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <Header title="الاختبارات والدرجات" subtitle="إنشاء الاختبارات وإدخال الدرجات" />

        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            اختبار جديد
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-6">
            <h3 className="text-lg font-bold mb-4">اختبار جديد</h3>
            <form onSubmit={addExam} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input required placeholder="اسم الاختبار" className="border p-3 rounded-lg" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} />
              <select required className="border p-3 rounded-lg" value={newExam.group_id} onChange={e => setNewExam({...newExam, group_id: e.target.value})}>
                <option value="">اختر المجموعة</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <input required type="number" placeholder="الدرجة النهائية" className="border p-3 rounded-lg" value={newExam.total_marks} onChange={e => setNewExam({...newExam, total_marks: e.target.value})} />
              <input type="date" className="border p-3 rounded-lg" value={newExam.exam_date} onChange={e => setNewExam({...newExam, exam_date: e.target.value})} />
              <div className="md:col-span-4 flex gap-3">
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg">حفظ</button>
                <button type="button" onClick={() => setShowAdd(false)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        {showGrades && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-6">
            <h3 className="text-lg font-bold mb-4">إدخال الدرجات</h3>
            <div className="space-y-3 mb-4">
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium">{s.name}</span>
                  <input
                    type="number"
                    placeholder="الدرجة"
                    className="border p-2 rounded-lg w-32 text-center"
                    value={studentGrades[s.id] || ''}
                    onChange={e => setStudentGrades({...studentGrades, [s.id]: e.target.value})}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={saveGrades} className="bg-primary text-white px-6 py-2 rounded-lg flex items-center gap-2">
                <Save size={18} /> حفظ الدرجات
              </button>
              <button onClick={() => setShowGrades(null)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Award size={24} className="text-amber-600" />
                </div>
                <button onClick={() => deleteExam(exam.id)} className="text-red-400 hover:text-red-600 text-xl">×</button>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{exam.title}</h3>
              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-slate-400" />
                  <span>{exam.groups?.name} — {exam.groups?.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-slate-400" />
                  <span>الدرجة النهائية: {exam.total_marks}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-slate-400" />
                  <span>التاريخ: {exam.exam_date}</span>
                </div>
              </div>
              <button
                onClick={() => openGrades(exam.id, exam.group_id)}
                className="w-full bg-primary/10 text-primary py-2 rounded-lg hover:bg-primary hover:text-white transition font-medium"
              >
                إدخال الدرجات
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
