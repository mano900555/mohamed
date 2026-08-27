'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Settings, Download, Upload, Save, User, Building, DollarSign, Clock, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      const s: Record<string, string> = {}
      data.forEach((item: any) => { s[item.key] = item.value })
      setSettings(s)
    }
  }

  async function saveSettings() {
    setLoading(true)
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    }
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Export students to CSV
  async function exportStudents() {
    const { data } = await supabase.from('students').select('*, groups(name)')
    if (!data) return

    const headers = ['الاسم', 'الهاتف', 'ولي الأمر', 'Center ID', 'الصف', 'المجموعة', 'الحالة']
    const rows = data.map((s: any) => [
      s.name, s.phone, s.parent_phone, s.center_id, s.grade, s.groups?.name || '', s.status
    ])

    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `students_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Export attendance to CSV
  async function exportAttendance() {
    const { data } = await supabase.from('attendance').select('*, students(name), groups(name)')
    if (!data) return

    const headers = ['التاريخ', 'الطالب', 'المجموعة', 'الحالة']
    const rows = data.map((a: any) => [
      a.lesson_date, a.students?.name, a.groups?.name,
      a.status === 'present' ? 'حاضر' : a.status === 'absent' ? 'غائب' : a.status === 'late' ? 'متأخر' : 'بعذر'
    ])

    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Export payments to CSV
  async function exportPayments() {
    const { data } = await supabase.from('payments').select('*, students(name)')
    if (!data) return

    const headers = ['التاريخ', 'الطالب', 'المبلغ', 'النوع', 'ملاحظات']
    const rows = data.map((p: any) => [
      p.date, p.students?.name, p.amount,
      p.type === 'payment' ? 'دفعة' : p.type === 'subscription' ? 'اشتراك' : 'مصروف',
      p.notes
    ])

    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `payments_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Import students from CSV
  async function importStudents(file: File) {
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) {
      alert('الملف فارغ أو غير صالح')
      return
    }

    // Skip header, parse rows
    const rows = lines.slice(1)
    const imported: any[] = []

    for (const line of rows) {
      const cols = line.split(',').map(c => c.trim())
      if (cols.length >= 4) {
        imported.push({
          name: cols[0],
          phone: cols[1] || '',
          parent_phone: cols[2] || '',
          center_id: cols[3] || '',
          grade: cols[4] || '',
          status: 'active',
        })
      }
    }

    if (imported.length > 0) {
      const { error } = await supabase.from('students').insert(imported)
      if (error) {
        alert('خطأ في الاستيراد: ' + error.message)
      } else {
        alert(`تم استيراد ${imported.length} طالب بنجاح!`)
        // Log audit
        await supabase.from('audit_logs').insert([{
          action: 'IMPORT',
          table_name: 'students',
          record_id: 'batch',
          new_data: { count: imported.length },
        }])
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <Header title="الإعدادات" subtitle="إعدادات النظام والاستيراد والتصدير" />

        {/* System Settings */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm mb-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Settings size={20} className="text-primary" />
            إعدادات النظام
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <User size={16} /> اسم المدرس
              </label>
              <input
                className="w-full border p-3 rounded-lg"
                value={settings.teacher_name || ''}
                onChange={e => setSettings({...settings, teacher_name: e.target.value})}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <Building size={16} /> اسم المركز
              </label>
              <input
                className="w-full border p-3 rounded-lg"
                value={settings.center_name || ''}
                onChange={e => setSettings({...settings, center_name: e.target.value})}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <DollarSign size={16} /> قيمة الاشتراك الافتراضية
              </label>
              <input
                type="number"
                className="w-full border p-3 rounded-lg"
                value={settings.subscription_amount || ''}
                onChange={e => setSettings({...settings, subscription_amount: e.target.value})}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <Clock size={16} /> تأخير إرسال رسائل الغياب (دقائق)
              </label>
              <input
                type="number"
                className="w-full border p-3 rounded-lg"
                value={settings.whatsapp_delay || ''}
                onChange={e => setSettings({...settings, whatsapp_delay: e.target.value})}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <AlertTriangle size={16} /> حد الغياب للتنبيه
              </label>
              <input
                type="number"
                className="w-full border p-3 rounded-lg"
                value={settings.absence_threshold || ''}
                onChange={e => setSettings({...settings, absence_threshold: e.target.value})}
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={saveSettings}
              disabled={loading}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save size={18} />
              {saved ? 'تم الحفظ!' : loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </div>

        {/* Export */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm mb-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Download size={20} className="text-green-600" />
            تصدير البيانات (CSV)
          </h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportStudents} className="flex items-center gap-2 bg-green-50 text-green-700 px-5 py-3 rounded-lg hover:bg-green-100 transition">
              <Download size={18} /> تصدير الطلاب
            </button>
            <button onClick={exportAttendance} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-5 py-3 rounded-lg hover:bg-blue-100 transition">
              <Download size={18} /> تصدير الحضور
            </button>
            <button onClick={exportPayments} className="flex items-center gap-2 bg-amber-50 text-amber-700 px-5 py-3 rounded-lg hover:bg-amber-100 transition">
              <Download size={18} /> تصدير المدفوعات
            </button>
          </div>
        </div>

        {/* Import */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Upload size={20} className="text-purple-600" />
            استيراد الطلاب (CSV)
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            يجب أن يكون الملف CSV بالترتيب: الاسم، الهاتف، ولي الأمر، Center ID، الصف
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) importStudents(file)
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-purple-50 text-purple-700 px-5 py-3 rounded-lg hover:bg-purple-100 transition"
          >
            <Upload size={18} /> اختيار ملف CSV
          </button>
        </div>
      </main>
    </div>
  )
}
