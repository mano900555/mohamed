'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Check, X, Clock, Calendar } from 'lucide-react'

export default function AttendancePage() {
  const [groups, setGroups] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Record<string, string>>({})

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    if (selectedGroup) loadStudents()
  }, [selectedGroup])

  useEffect(() => {
    if (selectedGroup && selectedDate) loadAttendance()
  }, [selectedGroup, selectedDate])

  async function loadGroups() {
    const { data } = await supabase.from('groups').select('*')
    if (data) setGroups(data)
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('*').eq('group_id', selectedGroup).eq('status', 'active')
    if (data) {
      setStudents(data)
      const initial: Record<string, string> = {}
      data.forEach((s: any) => { initial[s.id] = '' })
      setAttendance(initial)
    }
  }

  async function loadAttendance() {
    const { data } = await supabase.from('attendance').select('*').eq('group_id', selectedGroup).eq('lesson_date', selectedDate)
    if (data) {
      const existing: Record<string, string> = {}
      data.forEach((a: any) => { existing[a.student_id] = a.status })
      setAttendance(prev => ({ ...prev, ...existing }))
    }
  }

  async function saveAttendance() {
    const records = Object.entries(attendance)
      .filter(([_, status]) => status !== '')
      .map(([student_id, status]) => ({
        student_id,
        group_id: selectedGroup,
        lesson_date: selectedDate,
        status,
      }))

    if (records.length === 0) {
      alert('اختر حالة الحضور للطلاب أولاً')
      return
    }

    // احذف القديم وأضف الجديد
    await supabase.from('attendance').delete().eq('group_id', selectedGroup).eq('lesson_date', selectedDate)
    await supabase.from('attendance').insert(records)
    alert('تم حفظ الحضور بنجاح!')
  }

  const statusConfig = {
    present: { label: 'حاضر', color: 'bg-green-500', icon: Check },
    absent: { label: 'غائب', color: 'bg-red-500', icon: X },
    late: { label: 'متأخر', color: 'bg-orange-500', icon: Clock },
    excused: { label: 'بعذر', color: 'bg-blue-500', icon: Calendar },
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <Header title="تسجيل الحضور" subtitle="سجل حضور طلاب المجموعة" />

        <div className="flex items-center gap-4 mb-6">
          <select
            className="border p-3 rounded-lg min-w-[200px]"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">اختر المجموعة</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input
            type="date"
            className="border p-3 rounded-lg"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {selectedGroup && students.length > 0 && (
          <>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">الطالب</th>
                    <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">حاضر</th>
                    <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">غائب</th>
                    <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">متأخر</th>
                    <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">بعذر</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-t border-slate-100">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {student.name?.charAt(0)}
                          </div>
                          <p className="font-medium text-slate-800">{student.name}</p>
                        </div>
                      </td>
                      {Object.entries(statusConfig).map(([key, config]) => {
                        const Icon = config.icon
                        const isSelected = attendance[student.id] === key
                        return (
                          <td key={key} className="px-6 py-4 text-center">
                            <button
                              onClick={() => setAttendance({...attendance, [student.id]: key})}
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                isSelected ? config.color + ' text-white shadow-lg scale-110' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              <Icon size={20} />
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                حاضر: {Object.values(attendance).filter(v => v === 'present').length} | 
                غائب: {Object.values(attendance).filter(v => v === 'absent').length} | 
                متأخر: {Object.values(attendance).filter(v => v === 'late').length}
              </div>
              <button
                onClick={saveAttendance}
                className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                حفظ الحضور
              </button>
            </div>
          </>
        )}

        {selectedGroup && students.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>لا يوجد طلاب نشطون في هذه المجموعة</p>
          </div>
        )}
      </main>
    </div>
  )
}
