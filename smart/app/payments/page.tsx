'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Plus, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newPayment, setNewPayment] = useState({
    student_id: '', amount: '', type: 'payment', date: new Date().toISOString().split('T')[0], notes: ''
  })
  const [treasury, setTreasury] = useState({ income: 0, expenses: 0, balance: 0 })

  useEffect(() => {
    loadPayments()
    loadStudents()
  }, [])

  async function loadPayments() {
    const { data } = await supabase.from('payments').select('*, students(name)').order('date', { ascending: false })
    if (data) {
      setPayments(data)
      const income = data.filter((p: any) => p.type === 'payment' || p.type === 'subscription').reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      const expenses = data.filter((p: any) => p.type === 'expense').reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      setTreasury({ income, expenses, balance: income - expenses })
    }
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('id, name').eq('status', 'active')
    if (data) setStudents(data)
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault()
    const paymentData = {
      ...newPayment,
      amount: parseFloat(newPayment.amount),
    }
    const { data, error } = await supabase.from('payments').insert([paymentData]).select()
    if (!error && data) {
      // Audit log
      await supabase.from('audit_logs').insert([{
        action: 'PAYMENT',
        table_name: 'payments',
        record_id: data[0].id,
        new_data: paymentData,
      }])
    }
    setNewPayment({ student_id: '', amount: '', type: 'payment', date: new Date().toISOString().split('T')[0], notes: '' })
    setShowAdd(false)
    loadPayments()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <Header title="المالية والخزنة" subtitle="إدارة المدفوعات والمصروفات" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{treasury.income.toLocaleString()} ج</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <ArrowUpCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">إجمالي المصروفات</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{treasury.expenses.toLocaleString()} ج</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <ArrowDownCircle size={24} className="text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">الرصيد الحالي</p>
                <p className="text-2xl font-bold text-primary mt-1">{treasury.balance.toLocaleString()} ج</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Wallet size={24} className="text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            عملية جديدة
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-6">
            <h3 className="text-lg font-bold mb-4">عملية مالية جديدة</h3>
            <form onSubmit={addPayment} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select required className="border p-3 rounded-lg" value={newPayment.student_id} onChange={e => setNewPayment({...newPayment, student_id: e.target.value})}>
                <option value="">اختر الطالب</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input required type="number" placeholder="المبلغ" className="border p-3 rounded-lg" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} />
              <select className="border p-3 rounded-lg" value={newPayment.type} onChange={e => setNewPayment({...newPayment, type: e.target.value})}>
                <option value="payment">دفعة</option>
                <option value="subscription">اشتراك</option>
                <option value="expense">مصروف</option>
              </select>
              <input type="date" className="border p-3 rounded-lg" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} />
              <input placeholder="ملاحظات" className="border p-3 rounded-lg md:col-span-4" value={newPayment.notes} onChange={e => setNewPayment({...newPayment, notes: e.target.value})} />
              <div className="md:col-span-4 flex gap-3">
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
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">التاريخ</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">الطالب</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">النوع</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">المبلغ</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-600">{p.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{p.students?.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      p.type === 'payment' ? 'bg-green-100 text-green-700' :
                      p.type === 'subscription' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {p.type === 'payment' ? 'دفعة' : p.type === 'subscription' ? 'اشتراك' : 'مصروف'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold">{p.amount?.toLocaleString()} ج</td>
                  <td className="px-6 py-4 text-slate-500">{p.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
