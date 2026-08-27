'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Plus, FileText, Calendar, BookOpen } from 'lucide-react'

export default function HomeworkPage() {
  const [homework, setHomework] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newHw, setNewHw] = useState({
    title: '', group_id: '', lesson: '', due_date: '', notes: ''
  })

  useEffect(() => {
    loadHomework()
    loadGroups()
  }, [])

  async function loadHomework() {
    const { data } = await supabase.from('homework').select('*, groups(name, subject)').order('created_at', { ascending: false })
    if (data) setHomework(data)
  }

  async function loadGroups() {
    const { data } = await supabase.from('groups').select('*')
    if (data) setGroups(data)
  }

  async function addHomework(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('homework').insert([newHw])
    setNewHw({ title: '', group_id: '', lesson: '', due_date: '', notes: '' })
    setShowAdd(false)
    loadHomework()
  }

  async function deleteHomework(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الواجب؟')) return
    await supabase.from('homework').delete().eq('id', id)
    loadHomework()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <Header title="الواجبات" subtitle="إدارة الواجبات والتسليمات" />

        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            واجب جديد
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-6">
            <h3 className="text-lg font-bold mb-4">واجب جديد</h3>
            <form onSubmit={addHomework} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input required placeholder="عنوان الواجب" className="border p-3 rounded-lg" value={newHw.title} onChange={e => setNewHw({...newHw, title: e.target.value})} />
              <select required className="border p-3 rounded-lg" value={newHw.group_id} onChange={e => setNewHw({...newHw, group_id: e.target.value})}>
                <option value="">اختر المجموعة</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <input placeholder="الدرس" className="border p-3 rounded-lg" value={newHw.lesson} onChange={e => setNewHw({...newHw, lesson: e.target.value})} />
              <input type="date" placeholder="تاريخ التسليم" className="border p-3 rounded-lg" value={newHw.due_date} onChange={e => setNewHw({...newHw, due_date: e.target.value})} />
              <input placeholder="ملاحظات" className="border p-3 rounded-lg md:col-span-2" value={newHw.notes} onChange={e => setNewHw({...newHw, notes: e.target.value})} />
              <div className="md:col-span-3 flex gap-3">
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg">حفظ</button>
                <button type="button" onClick={() => setShowAdd(false)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homework.map((hw) => (
            <div key={hw.id} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileText size={24} className="text-primary" />
                </div>
                <button onClick={() => deleteHomework(hw.id)} className="text-red-400 hover:text-red-600 text-xl">×</button>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{hw.title}</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-slate-400" />
                  <span>{hw.groups?.name} — {hw.groups?.subject}</span>
                </div>
                {hw.lesson && (
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-slate-400" />
                    <span>الدرس: {hw.lesson}</span>
                  </div>
                )}
                {hw.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span>التسليم: {hw.due_date}</span>
                  </div>
                )}
              </div>
              {hw.notes && <p className="mt-3 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">{hw.notes}</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
