'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import QuickActions from '@/components/QuickActions'

export const metadata = {
  title: 'Smart Teacher',
  description: 'نظام إدارة المدرس',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const isLoginPage = pathname === '/login'
  const isParentPortal = pathname === '/parent'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !isLoginPage && !isParentPortal) {
        router.push('/login')
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage && !isParentPortal) {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router, isLoginPage, isParentPortal])

  if (loading && !isLoginPage && !isParentPortal) {
    return (
      <html lang="ar" dir="rtl">
        <body className="bg-slate-50 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">جاري التحميل...</p>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-50">
        {children}
        {!isLoginPage && !isParentPortal && <QuickActions />}
      </body>
    </html>
  )
}
