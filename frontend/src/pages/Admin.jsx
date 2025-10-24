import { useEffect, useState } from 'react'
import api from '../lib/api'
import Notifications from '../components/Notifications'

export default function Admin() {
  const [pending, setPending] = useState([])
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalComments: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      const [pendingRes, postsRes, commentsRes] = await Promise.all([
        api.get('/posts', { params: { status: 'pending', limit: 50 } }),
        api.get('/posts', { params: { limit: 1000 } }),
        api.get('/comments', { params: { limit: 1000 } })
      ])
      
      setPending(pendingRes.data.data)
      
      // Calculate stats
      const totalPosts = postsRes.data.total || 0
      const totalComments = commentsRes.data.comments?.length || 0
      const totalUsers = new Set(postsRes.data.data.map(p => p.author?._id)).size
      
      setStats({ totalUsers, totalPosts, totalComments })
    } catch (e) {
      console.error('Failed to load admin data:', e)
    }
  }

  const setStatus = async (slug, status) => {
    setLoading(true)
    try {
      await api.put(`/posts/${slug}/status`, { status })
      setPending(p => p.filter(x => x.slug !== slug))
    } catch (e) {
      console.error('Failed to update post status:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Notifications />
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Comments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalComments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Moderation Queue ({pending.length})</h2>
        </div>
        
        {pending.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No posts pending moderation.</p>
          </div>
        ) : (
          <div className="divide-y">
            {pending.map(post => (
              <div key={post.slug} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {post.summary || 'No summary available'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>By {post.author?.name}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{post.readingTimeMinutes} min read</span>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex gap-2">
                    <button 
                      onClick={() => setStatus(post.slug, 'published')}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      ✓ Approve
                    </button>
                    <button 
                      onClick={() => setStatus(post.slug, 'rejected')}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


