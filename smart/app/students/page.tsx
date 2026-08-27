'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Search, Plus, Phone, UserCircle, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newStudent, setNewStudent] = useState({
    name: '', phone: '', parent_phone: '', center_id: '', grade: '', group_id: '', notes: ''
  })

  useEffect(() => {
    loadStudents()
    loadGroups()
  }, [])

  async function loadStudents() {
    const { data } = await supabase.from('students').select('*, groups(name)').order('created_at', { ascending: false })
    if (data) setStudents(data)
  }

  async function loadGroups() {
    const { data } = await supabase.from('groups').select('*')
    if (data) setGroups(data)
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase.from('students').insert([newStudent]).select()
    if (!error && data) {
      // Audit log
      await supabase.from('audit_logs').insert([{
        action: 'INSERT',
        table_name: 'students',
        record_id: data[0].id,
        new_data: newStudent,
      }])
    }
    setNewStudent({ name: '', phone: '', parent_phone: '', center_id: '', grade: '', group_id: '', notes: '' })
    setShowAdd(false)
    loadStudents()
  }

  async function deleteStudent(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return
    const student = students.find(s => s.id === id)
    await supabase.from('students').delete().eq('id', id)
    // Audit log
    await supabase.from('audit_logs').insert([{
      action: 'DELETE',
      table_name: 'students',
      record_id: id,
      old_data: student,
    }])
    loadStudents()
  }

  const filtered = students.filter(s => 
    s.name?.includes(search) || s.phone?.includes(search) || s.center_id?.includes(search)
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <Header title="إدارة الطلاب" subtitle="إضافة، تعديل، وحذف الطلاب" />

        <div className="flex items-center justify-between mb-6">
          <div className="relative w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف أو Center ID..."
              className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            إضافة طالب
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-6">
            <h3 className="text-lg font-bold mb-4">طالب جديد</h3>
            <form onSubmit={addStudent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input required placeholder="الاسم" className="border p-3 rounded-lg" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
              <input placeholder="رقم الهاتف" className="border p-3 rounded-lg" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
              <input placeholder="رقم ولي الأمر" className="border p-3 rounded-lg" value={newStudent.parent_phone} onChange={e => setNewStudent({...newStudent, parent_phone: e.target.value})} />
              <input placeholder="Center ID" className="border p-3 rounded-lg" value={newStudent.center_id} onChange={e => setNewStudent({...newStudent, center_id: e.target.value})} />
              <input placeholder="الصف" className="border p-3 rounded-lg" value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})} />
              <select className="border p-3 rounded-lg" value={newStudent.group_id} onChange={e => setNewStudent({...newStudent, group_id: e.target.value})}>
                <option value="">اختر المجموعة</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <input placeholder="ملاحظات" className="border p-3 rounded-lg md:col-span-3" value={newStudent.notes} onChange={e => setNewStudent({...newStudent, notes: e.target.value})} />
              <div className="md:col-span-3 flex gap-3">
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg">حفظ</button>
                <button type="button" onClick={() => setShowAdd(false)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">الاسم</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">الهاتف</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">المجموعة</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">الحالة</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {student.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{student.name}</p>
                        <p className="text-xs text-slate-400">{student.center_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{student.phone}</td>
                  <td className="px-6 py-4 text-slate-600">{student.groups?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {student.status === 'active' ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/student/${student.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Eye size={18} />
                      </Link>
                      <button className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => deleteStudent(student.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
