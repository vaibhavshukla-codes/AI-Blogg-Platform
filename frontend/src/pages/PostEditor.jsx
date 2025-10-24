import { useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import api from '../lib/api'

export default function PostEditor() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [cover, setCover] = useState(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const onUpload = async () => {
    if (!cover) return null
    const fd = new FormData(); fd.append('file', cover)
    const { data } = await api.post('/upload/image', fd)
    return data.url
  }

  const onGenerate = async () => {
    if (!aiPrompt) return
    setLoading(true)
    try {
      const { data } = await api.post('/ai/generate', { prompt: aiPrompt })
      const r = data.result || {}
      if (r.title) setTitle(r.title)
      if (r.content) setContent(r.content)
      if (r.summary) setSummary(r.summary)
      if (r.category) setCategory(r.category)
      if (Array.isArray(r.tags)) setTags(r.tags.join(','))
    } finally { setLoading(false) }
  }

  const onPublish = async () => {
    setLoading(true)
    try {
      const coverImageUrl = await onUpload()
      const body = { title, content, summary, category, tags: tags.split(',').map(t=>t.trim()).filter(Boolean), coverImageUrl, status: 'pending' }
      await api.post('/posts', body)
      alert('Post submitted for review')
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create post')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded shadow space-y-3">
        <input className="w-full border p-2 rounded" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <ReactQuill value={content} onChange={setContent} />
        <input className="w-full border p-2 rounded" placeholder="Summary" value={summary} onChange={e=>setSummary(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="border p-2 rounded" placeholder="Category" value={category} onChange={e=>setCategory(e.target.value)} />
          <input className="border p-2 rounded" placeholder="tags (comma separated)" value={tags} onChange={e=>setTags(e.target.value)} />
        </div>
        <input type="file" onChange={e=>setCover(e.target.files?.[0])} />
        <div className="flex gap-2">
          <button onClick={onPublish} disabled={loading} className="bg-blue-600 text-white px-3 py-2 rounded">{loading? 'Saving...' : 'Submit for Review'}</button>
        </div>
      </div>
      <div className="bg-white p-4 rounded shadow space-y-3">
        <h3 className="font-semibold">AI Assistant</h3>
        <textarea className="w-full border p-2 rounded" rows="4" placeholder="Describe your article..." value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} />
        <button onClick={onGenerate} disabled={loading} className="bg-green-600 text-white px-3 py-2 rounded">{loading? 'Generating...' : 'Generate Draft'}</button>
      </div>
    </div>
  )
}


