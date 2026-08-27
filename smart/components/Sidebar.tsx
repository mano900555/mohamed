'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BookOpen, Calendar, CreditCard, UserCircle, FileText, Award, BarChart3, Layers, MessageCircle, History, Settings, Play } from 'lucide-react'

const menu = [
  { href: '/', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/students', label: 'الطلاب', icon: Users },
  { href: '/groups', label: 'المجموعات', icon: Layers },
  { href: '/attendance', label: 'الحضور', icon: Calendar },
  { href: '/session', label: 'الحصة', icon: Play },
  { href: '/content', label: 'المحتوى', icon: BookOpen },
  { href: '/homework', label: 'الواجبات', icon: FileText },
  { href: '/exams', label: 'الاختبارات', icon: Award },
  { href: '/payments', label: 'المالية', icon: CreditCard },
  { href: '/messages', label: 'رسائل WhatsApp', icon: MessageCircle },
  { href: '/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/audit', label: 'سجل العمليات', icon: History },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
  { href: '/parent', label: 'ولي الأمر', icon: UserCircle },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-l border-slate-200 min-h-screen fixed right-0 top-0 z-10 overflow-y-auto">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold text-primary">Smart Teacher</h1>
        <p className="text-xs text-slate-400 mt-1">نظام إدارة المدرس</p>
      </div>
      <nav className="p-4 space-y-1">
        {menu.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
