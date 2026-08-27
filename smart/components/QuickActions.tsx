'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, UserPlus, Calendar, CreditCard, FileText, BookOpen, Play } from 'lucide-react'

export default function QuickActions() {
  const [open, setOpen] = useState(false)

  const actions = [
    { href: '/students', label: 'إضافة طالب', icon: UserPlus, color: 'bg-blue-500' },
    { href: '/session', label: 'بدء حصة', icon: Play, color: 'bg-green-500' },
    { href: '/payments', label: 'تسجيل دفعة', icon: CreditCard, color: 'bg-emerald-500' },
    { href: '/exams', label: 'إضافة اختبار', icon: FileText, color: 'bg-amber-500' },
    { href: '/homework', label: 'إضافة واجب', icon: BookOpen, color: 'bg-purple-500' },
  ]

  return (
    <div className="fixed left-6 bottom-6 z-50">
      {open && (
        <div className="absolute bottom-16 left-0 space-y-2 mb-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 ${action.color} text-white px-4 py-3 rounded-lg shadow-lg hover:opacity-90 transition whitespace-nowrap`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            )
          })}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform ${
          open ? 'bg-red-500 rotate-45' : 'bg-primary hover:bg-blue-700'
        }`}
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
