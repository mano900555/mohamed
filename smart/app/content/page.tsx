'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Plus, BookOpen, FileText, Video, Link as LinkIcon, Trash2 } from 'lucide-react'

export default function ContentPage() {
  const [content, setContent] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newContent, setNewContent] = useState({
    title: '', subject: '', unit: '', lesson: '', file_url: '', video_url: '', notes: '', group_ids: [] as string[]
  })

  useEffect(() => {
    loadContent()
    loadGroups()
  }, [])

  async function loadContent() {
    const { data } = await supabase.from('content').select('*').order('created_at', { ascending: false })
    if (data) setContent(data)
  }

  async function loadGroups() {
    const { data } = await supabase.from('groups').select('*')
    if (data) setGroups(data)
  }

  async function addContent(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('content').insert([{
      ...newContent,
      group_ids: newContent.group_ids.length > 0 ? newContent.group_ids : null,
    }])
    setNewContent({ title: '', subject: '', unit: '', lesson: '', file_url: '', video_url: '', notes: '', group_ids: [] })
    setShowAdd(false)
    loadContent()
  }

  async function deleteContent(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى؟')) return
    await supabase.from('content').delete().eq('id', id)
    loadContent()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8">
        <Header title="المحتوى التعليمي" subtitle="إدارة المذكرات والفيديوهات والملفات" />

        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            محتوى جديد
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-6">
            <h3 className="text-lg font-bold mb-4">محتوى تعليمي جديد</h3>
            <form onSubmit={addContent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input required placeholder="عنوان المحتوى" className="border p-3 rounded-lg" value={newContent.title} onChange={e => setNewContent({...newContent, title: e.target.value})} />
              <input placeholder="المادة" className="border p-3 rounded-lg" value={newContent.subject} onChange={e => setNewContent({...newContent, subject: e.target.value})} />
              <input placeholder="الوحدة" className="border p-3 rounded-lg" value={newContent.unit} onChange={e => setNewContent({...newContent, unit: e.target.value})} />
              <input placeholder="الدرس" className="border p-3 rounded-lg" value={newContent.lesson} onChange={e => setNewContent({...newContent, lesson: e.target.value})} />
              <input placeholder="رابط الملف (PDF)" className="border p-3 rounded-lg" value={newContent.file_url} onChange={e => setNewContent({...newContent, file_url: e.target.value})} />
              <input placeholder="رابط الفيديو" className="border p-3 rounded-lg" value={newContent.video_url} onChange={e => setNewContent({...newContent, video_url: e.target.value})} />
              <div className="md:col-span-3">
                <p className="text-sm text-slate-600 mb-2">المجموعات المسموح لها:</p>
                <div className="flex flex-wrap gap-2">
                  {groups.map(g => (
                    <label key={g.id} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        value={g.id}
                        checked={newContent.group_ids.includes(g.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewContent({...newContent, group_ids: [...newContent.group_ids, g.id]})
                          } else {
                            setNewContent({...newContent, group_ids: newContent.group_ids.filter(id => id !== g.id)})
                          }
                        }}
                      />
                      <span className="text-sm">{g.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <textarea placeholder="ملاحظات" className="border p-3 rounded-lg md:col-span-3" rows={3} value={newContent.notes} onChange={e => setNewContent({...newContent, notes: e.target.value})} />
              <div className="md:col-span-3 flex gap-3">
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg">حفظ</button>
                <button type="button" onClick={() => setShowAdd(false)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <BookOpen size={24} className="text-purple-600" />
                </div>
                <button onClick={() => deleteContent(item.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
              <div className="space-y-2 text-sm text-slate-600 mb-4">
                {item.subject && <p><span className="text-slate-400">المادة:</span> {item.subject}</p>}
                {item.unit && <p><span className="text-slate-400">الوحدة:</span> {item.unit}</p>}
                {item.lesson && <p><span className="text-slate-400">الدرس:</span> {item.lesson}</p>}
              </div>
              <div className="flex gap-2">
                {item.file_url && (
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100">
                    <FileText size={14} /> ملف
                  </a>
                )}
                {item.video_url && (
                  <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100">
                    <Video size={14} /> فيديو
                  </a>
                )}
              </div>
              {item.notes && <p className="mt-3 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">{item.notes}</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
