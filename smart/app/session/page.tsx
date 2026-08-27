'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { Check, X, Clock, Calendar, Play, Square, MessageCircle, Copy, CheckCircle } from 'lucide-react'

export default function SessionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const groupId = searchParams.get('group')
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const [group, setGroup] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [sessionStatus, setSessionStatus] = useState<'ready' | 'active' | 'ended'>('ready')
  const [absentStudents, setAbsentStudents] = useState<any[]>([])
  const [whatsappMessages, setWhatsappMessages] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [settings, setSettings] = useState<any>({})

  useEffect(() => {
    if (groupId) {
      loadGroup()
      loadStudents()
      loadExistingAttendance()
      loadSettings()
    }
  }, [groupId])

  async function loadGroup() {
    const { data } = await supabase.from('groups').select('*').eq('id', groupId).single()
    if (data) setGroup(data)
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('*').eq('group_id', groupId).eq('status', 'active')
    if (data) {
      setStudents(data)
      const initial: Record<string, string> = {}
      data.forEach((s: any) => { initial[s.id] = '' })
      setAttendance(initial)
    }
  }

  async function loadExistingAttendance() {
    const { data } = await supabase.from('attendance').select('*').eq('group_id', groupId).eq('lesson_date', dateParam)
    if (data && data.length > 0) {
      const existing: Record<string, string> = {}
      data.forEach((a: any) => { existing[a.student_id] = a.status })
      setAttendance(existing)
      setSessionStatus('ended')
    }
  }

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      const s: Record<string, string> = {}
      data.forEach((item: any) => { s[item.key] = item.value })
      setSettings(s)
    }
  }

  function startSession() {
    setSessionStatus('active')
  }

  async function endSession() {
    // Save attendance first
    const records = Object.entries(attendance)
      .filter(([_, status]) => status !== '')
      .map(([student_id, status]) => ({
        student_id,
        group_id: groupId,
        lesson_date: dateParam,
        status,
      }))

    if (records.length > 0) {
      await supabase.from('attendance').delete().eq('group_id', groupId).eq('lesson_date', dateParam)
      await supabase.from('attendance').insert(records)
    }

    // Find absent students
    const absent = students.filter(s => attendance[s.id] === 'absent' || attendance[s.id] === 'late')
    setAbsentStudents(absent)

    // Generate WhatsApp messages
    const teacherName = settings.teacher_name || 'مدرس'
    const centerName = settings.center_name || 'السنتر'
    const groupName = group?.name || ''

    let messages = ''
    absent.forEach((student, index) => {
      if (index > 0) messages += '\n\n----------\n\n'
      messages += `السلام عليكم،\n`
      messages += `نحيطكم علمًا بأن الطالب ${student.name} لم يحضر حصة ${groupName} اليوم ${dateParam}.\n`
      messages += `مع تحيات،\n${teacherName} — ${centerName}`
    })

    setWhatsappMessages(messages)
    setSessionStatus('ended')
  }

  function copyMessages() {
    navigator.clipboard.writeText(whatsappMessages)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusConfig = {
    present: { label: 'حاضر', color: 'bg-green-500', icon: Check },
    absent: { label: 'غائب', color: 'bg-red-500', icon: X },
    late: { label: 'متأخر', color: 'bg-orange-500', icon: Clock },
    excused: { label: 'بعذر', color: 'bg-blue-500', icon: Calendar },
  }

  const presentCount = Object.values(attendance).filter(v => v === 'present').length
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length
  const lateCount = Object.values(attendance).filter(v => v === 'late').length

  if (!groupId) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 mr-64 p-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 text-lg">اختر مجموعة من الجدول لبدء الحصة</p>
            <button onClick={() => router.push('/')} className="mt-4 bg-primary text-white px-6 py-2 rounded-lg">
              العودة للرئيسية
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{group?.name}</h2>
            <p className="text-slate-500">{group?.subject} — {group?.grade} — {dateParam}</p>
          </div>
          <div className="flex items-center gap-3">
            {sessionStatus === 'ready' && (
              <button onClick={startSession} className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
                <Play size={20} /> بدء الحصة
              </button>
            )}
            {sessionStatus === 'active' && (
              <button onClick={endSession} className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition">
                <Square size={20} /> إنهاء الحصة
              </button>
            )}
            {sessionStatus === 'ended' && (
              <span className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-lg">
                <CheckCircle size={20} /> تم إنهاء الحصة
              </span>
            )}
          </div>
        </div>

        {sessionStatus === 'ready' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <Play size={48} className="text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-blue-800 mb-2">جاهز لبدء الحصة</h3>
            <p className="text-blue-600">اضغط "بدء الحصة" لبدء تسجيل الحضور</p>
          </div>
        )}

        {(sessionStatus === 'active' || sessionStatus === 'ended') && (
          <>
            <div className="flex items-center gap-6 mb-6 bg-white rounded-xl p-4 border border-slate-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                <p className="text-sm text-slate-500">حاضر</p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                <p className="text-sm text-slate-500">غائب</p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{lateCount}</p>
                <p className="text-sm text-slate-500">متأخر</p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-700">{students.length}</p>
                <p className="text-sm text-slate-500">إجمالي</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
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
                              disabled={sessionStatus === 'ended'}
                              onClick={() => setAttendance({...attendance, [student.id]: key})}
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                isSelected ? config.color + ' text-white shadow-lg scale-110' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              } ${sessionStatus === 'ended' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          </>
        )}

        {sessionStatus === 'ended' && absentStudents.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MessageCircle size={20} className="text-green-600" />
                رسائل الغياب جاهزة ({absentStudents.length} طالب)
              </h3>
              <button
                onClick={copyMessages}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                {copied ? 'تم النسخ!' : 'نسخ الرسائل'}
              </button>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-line text-sm text-slate-700 font-mono leading-relaxed">
              {whatsappMessages}
            </div>
            <p className="mt-3 text-sm text-slate-500">
              انسخ الرسائل ثم افتح WhatsApp Web والصقها في المحادثات
            </p>
          </div>
        )}

        {sessionStatus === 'ended' && absentStudents.length === 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-green-800">ممتاز!</h3>
            <p className="text-green-600">جميع الطلاب حاضرون اليوم</p>
          </div>
        )}
      </main>
    </div>
  )
}
