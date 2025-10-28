import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import api from '../lib/api'
import { useToast } from '../components/Toast'

export default function PostEditor() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const editingPost = location.state?.post // Get post data if editing
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [cover, setCover] = useState(null)
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPreview, setShowPreview] = useState(false)
  const [categories, setCategories] = useState([])
  const [autoSaveStatus, setAutoSaveStatus] = useState('')
  const [lastSaved, setLastSaved] = useState(null)
  
  // Load existing post data if editing
  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || '')
      setContent(editingPost.content || '')
      setSummary(editingPost.summary || '')
      setCategory(editingPost.category || '')
      setTags(editingPost.tags?.join(', ') || '')
      setCoverImageUrl(editingPost.coverImageUrl || '')
    }
  }, [editingPost])

  // Calculate reading time and word count
  const contentStats = useMemo(() => {
    const plainText = content.replace(/<[^>]*>/g, '').trim()
    const words = plainText.split(/\s+/).filter(Boolean).length
    const characters = plainText.length
    const readingTime = Math.max(1, Math.ceil(words / 200)) // 200 words per minute
    
    return { words, characters, readingTime }
  }, [content])

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    const draft = {
      title,
      content,
      summary,
      category,
      tags,
      timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('blog_draft', JSON.stringify(draft))
    setAutoSaveStatus('Saved')
    setLastSaved(new Date())
    
    setTimeout(() => setAutoSaveStatus(''), 3000)
  }, [title, content, summary, category, tags])

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    const savedDraft = localStorage.getItem('blog_draft')
    if (savedDraft) {
      const draft = JSON.parse(savedDraft)
      setTitle(draft.title || '')
      setContent(draft.content || '')
      setSummary(draft.summary || '')
      setCategory(draft.category || '')
      setTags(draft.tags || '')
      toast.showSuccess('Draft loaded successfully!')
    }
  }, [toast])

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem('blog_draft')
    setTitle('')
    setContent('')
    setSummary('')
    setCategory('')
    setTags('')
    setCover(null)
    setCoverPreview('')
    toast.showSuccess('Draft cleared!')
  }, [toast])

  // Remove cover image
  const removeCoverImage = () => {
    setCover(null)
    setCoverPreview('')
    setCoverImageUrl('')
    toast.showSuccess('Cover image removed!')
  }

  // Auto-generate summary if empty
  const generateSummary = useCallback(() => {
    if (summary) return // Don't overwrite existing summary
    
    const plainText = content.replace(/<[^>]*>/g, '').trim()
    const sentences = plainText.split(/[.!?]+/).filter(Boolean)
    const firstSentences = sentences.slice(0, 2).join('. ')
    const autoSummary = firstSentences.length > 150 
      ? firstSentences.substring(0, 150) + '...'
      : firstSentences
    
    if (autoSummary) {
      setSummary(autoSummary)
      toast.showSuccess('Summary auto-generated from your content!')
    }
  }, [content, summary, toast])

  // Load categories for dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get('/categories')
        setCategories(data.categories || [])
      } catch (e) {
        console.error('Failed to load categories:', e)
      }
    }
    loadCategories()
  }, [])

  // Auto-save draft functionality
  useEffect(() => {
    if (!title && !content) return // Don't save empty content
    
    const autoSaveTimer = setTimeout(() => {
      saveDraft()
    }, 30000) // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer)
  }, [title, content, summary, category, tags, saveDraft])

  // Handle cover image preview
  useEffect(() => {
    if (cover) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result)
      }
      reader.readAsDataURL(cover)
    } else {
      setCoverPreview('')
    }
  }, [cover])

  const onUpload = async () => {
    if (!cover) return null
    try {
      const fd = new FormData()
      fd.append('file', cover)
      const { data } = await api.post('/upload/image', fd)
      return data.url
    } catch (error) {
      console.error('Upload error:', error)
      throw new Error('Failed to upload image: ' + (error.response?.data?.message || error.message))
    }
  }

  const onGenerate = async () => {
    if (!aiPrompt) {
      toast.showWarning('Please enter a prompt for AI generation')
      return
    }
    setLoading(true)
    setErrors({})
    try {
      const { data } = await api.post('/ai/generate', { prompt: aiPrompt })
      const r = data.result || {}
      
      // Set generated content
      if (r.title) setTitle(r.title)
      if (r.content) setContent(r.content)
      if (r.summary) setSummary(r.summary)
      if (r.category) setCategory(r.category)
      if (Array.isArray(r.tags)) {
        setTags(r.tags.join(', '))
      } else if (r.tags) {
        setTags(String(r.tags))
      }
      
      toast.showSuccess('AI content generated successfully! Review and edit before publishing.')
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.message || 'AI generation failed'
      toast.showError('AI Feature Unavailable\n\n' + errorMsg + '\n\nNote: You can still write posts manually without the AI feature.', 6000)
      console.error('AI generation error:', e)
    } finally { setLoading(false) }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title must not exceed 200 characters'
    }
    
    const plainText = content.replace(/<[^>]*>/g, '').trim()
    if (!plainText) {
      newErrors.content = 'Content is required'
    } else if (plainText.length < 50) {
      newErrors.content = 'Content must be at least 50 characters'
    }
    
    if (summary && summary.length > 500) {
      newErrors.summary = 'Summary must not exceed 500 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onSaveDraft = async () => {
    if (!title.trim() && !content.trim()) {
      toast.showWarning('Please add some content before saving')
      return
    }

    setLoading(true)
    try {
      const newCoverUrl = cover ? await onUpload() : null
      
      // Determine cover image URL: if explicitly removed (empty string), set to null
      let finalCoverUrl = newCoverUrl
      if (!newCoverUrl && coverImageUrl !== '') {
        finalCoverUrl = coverImageUrl
      } else if (coverImageUrl === '') {
        finalCoverUrl = null
      }
      
      const body = { 
        title: title.trim() || 'Untitled Draft', 
        content: content.trim() || '<p>Draft content</p>', 
        summary: summary.trim() || undefined, 
        category: category.trim() || undefined, 
        tags: tags.split(',').map(t => t.trim()).filter(Boolean), 
        coverImageUrl: finalCoverUrl, 
        status: 'draft'
      }
      
      if (editingPost) {
        await api.put(`/posts/${editingPost.slug}`, body)
        toast.showSuccess('Draft updated successfully!')
      } else {
        await api.post('/posts', body)
        toast.showSuccess('Draft saved successfully!')
      }
      
      // Clear localStorage draft
      localStorage.removeItem('blog_draft')
      
      setTimeout(() => navigate('/dashboard'), 1000)
    } catch (e) {
      toast.showError('Failed to save draft: ' + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }

  const onPublish = async () => {
    if (!validateForm()) {
      toast.showWarning('Please fix the form errors before publishing')
      return
    }

    setLoading(true)
    try {
      // Only upload cover if a new file was selected
      const newCoverUrl = cover ? await onUpload() : null
      
      // Determine cover image URL: if explicitly removed (empty string), set to null
      let finalCoverUrl = newCoverUrl
      if (!newCoverUrl && coverImageUrl !== '') {
        finalCoverUrl = coverImageUrl
      } else if (coverImageUrl === '') {
        finalCoverUrl = null
      }
      
      const body = { 
        title: title.trim(), 
        content: content.trim(), 
        summary: summary.trim() || undefined, 
        category: category.trim() || undefined, 
        tags: tags.split(',').map(t => t.trim()).filter(Boolean), 
        coverImageUrl: finalCoverUrl, 
        status: 'published'
      }
      
      let response
      if (editingPost) {
        // Update existing post
        response = await api.put(`/posts/${editingPost.slug}`, body)
        toast.showSuccess('Post updated successfully! Redirecting...')
      } else {
        // Create new post
        response = await api.post('/posts', body)
        toast.showSuccess('Post published successfully! Redirecting...')
      }
      
      // Clear localStorage draft
      localStorage.removeItem('blog_draft')
      
      // Redirect after successful operation
      setTimeout(() => {
        if (editingPost) {
          navigate(`/post/${response.data.post.slug}`)
        } else {
          navigate('/dashboard')
        }
      }, 1000)
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.message || `Failed to ${editingPost ? 'update' : 'create'} post`
      toast.showError('Error: ' + errorMsg)
      console.error(`Post ${editingPost ? 'update' : 'creation'} error:`, e)
    } finally { setLoading(false) }
  }

  // Enhanced Rich Text Editor Modules
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ]
  }), [])

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-lg shadow">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {editingPost ? '✏️ Edit Post' : '✍️ Create New Post'}
          </h1>
          {editingPost && (
            <p className="text-sm text-gray-600 mt-1">Editing: {editingPost.title}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {autoSaveStatus && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              ✓ {autoSaveStatus}
              {lastSaved && ` - ${lastSaved.toLocaleTimeString()}`}
            </span>
          )}
          <button
            onClick={saveDraft}
            className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            💾 Save Draft
          </button>
          {!editingPost && localStorage.getItem('blog_draft') && (
            <>
              <button
                onClick={loadDraft}
                className="text-sm px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
              >
                📂 Load Draft
              </button>
              <button
                onClick={clearDraft}
                className="text-sm px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
              >
                🗑️ Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">📝 Words:</span>
            <span className="text-gray-900">{contentStats.words}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">🔤 Characters:</span>
            <span className="text-gray-900">{contentStats.characters}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">⏱️ Read Time:</span>
            <span className="text-gray-900">{contentStats.readingTime} min</span>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="ml-auto px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium border border-gray-300"
          >
            {showPreview ? '✏️ Edit Mode' : '👁️ Preview Mode'}
          </button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow space-y-4">
        {!showPreview ? (
          <>
            {/* Title Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-500">
                  {title.length}/200 characters
                </span>
              </div>
              <input 
                className={`w-full border-2 p-3 rounded-lg text-base md:text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter an engaging title for your post..." 
                value={title} 
                onChange={e => { setTitle(e.target.value); setErrors({...errors, title: ''}) }}
                maxLength={200}
              />
              {errors.title && <p className="text-red-500 text-xs md:text-sm mt-1">⚠️ {errors.title}</p>}
            </div>
            
            {/* Rich Text Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Content <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="prose-editor">
                <ReactQuill 
                  theme="snow"
                  value={content} 
                  onChange={(val) => { setContent(val); setErrors({...errors, content: ''}) }}
                  modules={quillModules}
                  className="bg-white min-h-[400px]"
                  placeholder="Write your amazing content here... Use the toolbar above for formatting."
                />
              </div>
              {errors.content && <p className="text-red-500 text-xs md:text-sm mt-2">⚠️ {errors.content}</p>}
            </div>
          </>
        ) : (
          /* Preview Mode */
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{title || 'Untitled Post'}</h1>
            {summary && (
              <p className="text-lg text-gray-600 italic border-l-4 border-blue-500 pl-4">{summary}</p>
            )}
            {(coverPreview || coverImageUrl) && (
              <div className="relative">
                <img 
                  src={coverPreview || coverImageUrl} 
                  alt="Cover" 
                  className="w-full h-64 md:h-96 object-cover rounded-lg"
                />
                <button
                  onClick={removeCoverImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all transform hover:scale-110"
                  title="Remove cover image"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">No content yet...</p>' }}
            />
            <div className="flex flex-wrap gap-2">
              {category && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  📁 {category}
                </span>
              )}
              {tags.split(',').filter(Boolean).map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metadata Section */}
      {!showPreview && (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2">📋 Post Metadata</h3>
          
          {/* Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Summary</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{summary.length}/500 characters</span>
                {content && !summary && (
                  <button
                    onClick={generateSummary}
                    className="text-xs px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded transition-colors"
                  >
                    ✨ Auto-generate
                  </button>
                )}
              </div>
            </div>
            <textarea
              className={`w-full border-2 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.summary ? 'border-red-500' : 'border-gray-300'
              }`}
              rows="3"
              placeholder="Write a brief summary of your post (optional)..." 
              value={summary} 
              onChange={e => setSummary(e.target.value)}
              maxLength={500}
            />
            {errors.summary && <p className="text-red-500 text-xs mt-1">⚠️ {errors.summary}</p>}
          </div>
        
          {/* Category and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Dropdown */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Category</label>
              {categories.length > 0 ? (
                <select
                  className="w-full border-2 border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="">Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                  <option value="_custom">+ Add Custom Category</option>
                </select>
              ) : (
                <input 
                  className="w-full border-2 border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="e.g., Technology, Health, Travel..." 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                />
              )}
            </div>

            {/* Tags Input */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Tags</label>
              <input 
                className="w-full border-2 border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="react, javascript, tutorial (comma separated)" 
                value={tags} 
                onChange={e => setTags(e.target.value)} 
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Use comma-separated tags for better discoverability
              </p>
            </div>
          </div>
          
          {/* Cover Image Upload */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Cover Image</label>
            
            {/* Image Preview */}
            {(coverPreview || coverImageUrl) && (
              <div className="mb-3 relative">
                <img 
                  src={coverPreview || coverImageUrl} 
                  alt="Cover preview" 
                  className="h-48 md:h-64 w-full object-cover rounded-lg border-2 border-gray-300" 
                />
                <button
                  onClick={removeCoverImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all transform hover:scale-110"
                  title="Remove cover image"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  {coverPreview ? '📸 New cover image selected' : '🖼️ Current cover image'}
                </p>
              </div>
            )}
            
            {/* File Input */}
            <div className="relative">
              <input 
                type="file" 
                accept="image/*"
                onChange={e => setCover(e.target.files?.[0])} 
                className="block w-full text-xs md:text-sm text-gray-500 
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-gradient-to-r file:from-blue-500 file:to-blue-600
                  file:text-white
                  hover:file:from-blue-600 hover:file:to-blue-700
                  file:cursor-pointer file:transition-all
                  cursor-pointer"
                id="cover-upload"
              />
            </div>
            
            {cover && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-green-600">✓ Selected: {cover.name}</span>
                <span className="text-gray-500">({(cover.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
            
            {coverImageUrl && cover && (
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ This will replace your current cover image
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button 
              onClick={onPublish} 
              disabled={loading} 
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base font-semibold shadow-lg transition-all transform hover:scale-105"
            >
              {loading ? '⏳ Processing...' : (editingPost ? '💾 Update Post' : '📝 Publish Post')}
            </button>
            
            <button 
              onClick={onSaveDraft} 
              disabled={loading} 
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base font-semibold shadow-lg transition-all"
            >
              {loading ? '⏳ Saving...' : '💾 Save as Draft'}
            </button>
            
            {editingPost && (
              <button 
                onClick={() => navigate(`/post/${editingPost.slug}`)} 
                disabled={loading}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base font-semibold shadow-lg transition-all"
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </div>
      )}
      {/* AI Assistant Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-6 rounded-lg shadow-lg border-2 border-green-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="text-3xl">🤖</div>
          <div>
            <h3 className="font-bold text-lg md:text-xl text-gray-900">AI Writing Assistant</h3>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Describe your topic, and AI will generate a complete blog post draft with title, content, summary, and tags.
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <textarea 
            className="w-full border-2 border-green-300 p-4 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base bg-white" 
            rows="5" 
            placeholder="Example: Write a comprehensive blog post about the benefits of machine learning in healthcare, including real-world applications, challenges, and future prospects..." 
            value={aiPrompt} 
            onChange={e => setAiPrompt(e.target.value)} 
          />
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              onClick={onGenerate} 
              disabled={loading || !aiPrompt.trim()} 
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base font-semibold shadow-lg transition-all transform hover:scale-105"
            >
              {loading ? '⏳ Generating with AI...' : '✨ Generate Draft with AI'}
            </button>
          </div>
          
          <div className="bg-white/50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-semibold mb-1">💡 Tips for better AI-generated content:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Be specific about your topic and target audience</li>
              <li>Mention the tone (professional, casual, technical, etc.)</li>
              <li>Include key points you want to cover</li>
              <li>Review and edit the generated content before publishing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-blue-900 mb-2">📚 Writing Tips</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-blue-800">
          <div>
            <strong>✓ Engaging Titles:</strong> Use numbers, questions, or power words
          </div>
          <div>
            <strong>✓ Clear Structure:</strong> Use headings, lists, and short paragraphs
          </div>
          <div>
            <strong>✓ Good Summary:</strong> 1-2 sentences that hook readers
          </div>
          <div>
            <strong>✓ SEO Tags:</strong> 3-5 relevant keywords for discoverability
          </div>
        </div>
      </div>
    </div>
  )
}


