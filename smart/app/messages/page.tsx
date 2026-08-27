'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { MessageCircle, Copy, CheckCircle, Calendar, Users, Send } from 'lucide-react'

export default function MessagesPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [absentStudents, setAbsentStudents] = useState<any[]>([])
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const [settings, setSettings] = useState<any>({})

  useEffect(() => {
    loadGroups()
    loadSettings()
  }, [])

  useEffect(() => {
    if (selectedGroup && selectedDate) loadAbsentStudents()
  }, [selectedGroup, selectedDate])

  async function loadGroups() {
    const { data } = await supabase.from('groups').select('*')
    if (data) setGroups(data)
  }

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      const s: Record<string, string> = {}
      data.forEach((item: any) => { s[item.key] = item.value })
      setSettings(s)
    }
  }

  async function loadAbsentStudents() {
    const { data: students } = await supabase.from('students').select('*').eq('group_id', selectedGroup)
    if (!students) return

    const { data: attendance } = await supabase.from('attendance').select('*').eq('group_id', selectedGroup).eq('lesson_date', selectedDate)
    const attendedIds = new Set(attendance?.map((a: any) => a.student_id) || [])

    const absent = students.filter((s: any) => !attendedIds.has(s.id) && s.status === 'active')
    setAbsentStudents(absent)

    // Generate messages
    const teacherName = settings.teacher_name || 'مدرس'
    const centerName = settings.center_name || 'السنتر'
    const groupName = groups.find(g => g.id === selectedGroup)?.name || ''

    const msgs: Record<string, string> = {}
    absent.forEach((student) => {
      msgs[student.id] = `السلام عليكم،\nنحيطكم علمًا بأن الطالب ${student.name} لم يحضر حصة ${groupName} يوم ${selectedDate}.\nمع تحيات،\n${teacherName} — ${centerName}`
    })
    setMessages(msgs)
  }

  function copyMessage(studentId: string) {
    navigator.clipboard.writeText(messages[studentId])
    setCopied({...copied, [studentId]: true})
    setTimeout(() => setCopied(prev => ({...prev, [studentId]: false})), 2000)
  }

  function copyAll() {
    const allMessages = Object.values(messages).join('\n\n----------\n\n')
    navigator.clipboard.writeText(allMessages)
    setCopied({...copied, all: true})
    setTimeout(() => setCopied(prev => ({...prev, all: false})), 2000)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <Header title="رسائل WhatsApp" subtitle="إعداد رسائل الغياب والتأخير" />

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

        {selectedGroup && absentStudents.length > 0 && (
          <div className="mb-4">
            <button
              onClick={copyAll}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition"
            >
              {copied.all ? <CheckCircle size={18} /> : <Copy size={18} />}
              {copied.all ? 'تم نسخ الكل!' : 'نسخ كل الرسائل'}
            </button>
          </div>
        )}

        {selectedGroup && absentStudents.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-green-800">لا يوجد غياب</h3>
            <p className="text-green-600">جميع الطلاب حاضرون في هذا اليوم</p>
          </div>
        )}

        <div className="space-y-4">
          {absentStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                    {student.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{student.name}</p>
                    <p className="text-sm text-slate-500">{student.parent_phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => copyMessage(student.id)}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  {copied[student.id] ? <CheckCircle size={16} /> : <Copy size={16} />}
                  {copied[student.id] ? 'تم النسخ!' : 'نسخ'}
                </button>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-line font-mono leading-relaxed">
                {messages[student.id]}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
