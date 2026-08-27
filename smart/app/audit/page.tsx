'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { History, UserPlus, Edit, Trash2, CreditCard, FileText } from 'lucide-react'

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadLogs()
  }, [filter])

  async function loadLogs() {
    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)

    if (filter !== 'all') {
      query = query.eq('action', filter)
    }

    const { data } = await query
    if (data) setLogs(data)
  }

  const actionConfig: Record<string, { label: string; color: string; icon: any }> = {
    INSERT: { label: 'إضافة', color: 'bg-green-100 text-green-700', icon: UserPlus },
    UPDATE: { label: 'تعديل', color: 'bg-amber-100 text-amber-700', icon: Edit },
    DELETE: { label: 'حذف', color: 'bg-red-100 text-red-700', icon: Trash2 },
    PAYMENT: { label: 'دفع', color: 'bg-blue-100 text-blue-700', icon: CreditCard },
    ATTENDANCE: { label: 'حضور', color: 'bg-purple-100 text-purple-700', icon: FileText },
  }

  const tableNames: Record<string, string> = {
    students: 'الطلاب',
    groups: 'المجموعات',
    attendance: 'الحضور',
    payments: 'المدفوعات',
    exams: 'الاختبارات',
    grades: 'الدرجات',
    homework: 'الواجبات',
    content: 'المحتوى',
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <Header title="سجل العمليات" subtitle="تتبع كل التغييرات في النظام" />

        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'الكل' },
            { key: 'INSERT', label: 'إضافات' },
            { key: 'UPDATE', label: 'تعديلات' },
            { key: 'DELETE', label: 'حذف' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f.key
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">التاريخ</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">العملية</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">الجدول</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const config = actionConfig[log.action] || { label: log.action, color: 'bg-slate-100 text-slate-700', icon: History }
                const Icon = config.icon
                return (
                  <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        <Icon size={14} />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {tableNames[log.table_name] || log.table_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {log.new_data?.name || log.old_data?.name || log.record_id?.slice(0, 8) || '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <History size={48} className="mx-auto mb-4 opacity-30" />
              <p>لا توجد عمليات مسجلة</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
