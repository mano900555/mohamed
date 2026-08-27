'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Plus, Clock, MapPin, Users } from 'lucide-react'

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newGroup, setNewGroup] = useState({
    name: '', subject: '', grade: '', days: [] as string[], start_time: '', end_time: '', room: ''
  })

  const weekDays = [
    { value: 'Saturday', label: 'السبت' },
    { value: 'Sunday', label: 'الأحد' },
    { value: 'Monday', label: 'الإثنين' },
    { value: 'Tuesday', label: 'الثلاثاء' },
    { value: 'Wednesday', label: 'الأربعاء' },
    { value: 'Thursday', label: 'الخميس' },
    { value: 'Friday', label: 'الجمعة' },
  ]

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    const { data } = await supabase.from('groups').select('*').order('created_at', { ascending: false })
    if (data) setGroups(data)
  }

  async function addGroup(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('groups').insert([newGroup])
    setNewGroup({ name: '', subject: '', grade: '', days: [], start_time: '', end_time: '', room: '' })
    setShowAdd(false)
    loadGroups()
  }

  const dayLabels: Record<string, string> = {
    Saturday: 'السبت', Sunday: 'الأحد', Monday: 'الإثنين',
    Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة'
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <Header title="المجموعات" subtitle="إدارة المجموعات الدراسية" />

        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            مجموعة جديدة
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-6">
            <h3 className="text-lg font-bold mb-4">مجموعة جديدة</h3>
            <form onSubmit={addGroup} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input required placeholder="اسم المجموعة" className="border p-3 rounded-lg" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
              <input required placeholder="المادة" className="border p-3 rounded-lg" value={newGroup.subject} onChange={e => setNewGroup({...newGroup, subject: e.target.value})} />
              <input required placeholder="الصف" className="border p-3 rounded-lg" value={newGroup.grade} onChange={e => setNewGroup({...newGroup, grade: e.target.value})} />
              <input type="time" className="border p-3 rounded-lg" value={newGroup.start_time} onChange={e => setNewGroup({...newGroup, start_time: e.target.value})} />
              <input type="time" className="border p-3 rounded-lg" value={newGroup.end_time} onChange={e => setNewGroup({...newGroup, end_time: e.target.value})} />
              <input placeholder="القاعة" className="border p-3 rounded-lg" value={newGroup.room} onChange={e => setNewGroup({...newGroup, room: e.target.value})} />
              <div className="md:col-span-3">
                <p className="text-sm text-slate-600 mb-2">أيام المجموعة:</p>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <label key={day.value} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        value={day.value}
                        checked={newGroup.days.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewGroup({...newGroup, days: [...newGroup.days, day.value]})
                          } else {
                            setNewGroup({...newGroup, days: newGroup.days.filter(d => d !== day.value)})
                          }
                        }}
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-3 flex gap-3">
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg">حفظ</button>
                <button type="button" onClick={() => setShowAdd(false)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">{group.name}</h3>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">{group.grade}</span>
              </div>
              <p className="text-slate-500 mb-4">{group.subject}</p>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  <span>{group.start_time?.slice(0, 5)} - {group.end_time?.slice(0, 5)}</span>
                </div>
                {group.room && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{group.room}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-slate-400" />
                  <span>{group.days?.map((d: string) => dayLabels[d] || d).join('، ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
