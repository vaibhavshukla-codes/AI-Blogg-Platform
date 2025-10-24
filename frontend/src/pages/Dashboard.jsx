import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Notifications from '../components/Notifications'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState({ totalViews: 0, totalLikes: 0, totalComments: 0 })
  const [recentPosts, setRecentPosts] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [postsRes, allPostsRes] = await Promise.all([
        api.get('/users/me/posts'),
        api.get('/posts', { params: { author: user?.id, limit: 10 } })
      ])
      
      setPosts(postsRes.data.posts)
      setRecentPosts(allPostsRes.data.data)
      
      // Calculate stats
      const totalViews = allPostsRes.data.data.reduce((sum, post) => sum + (post.views || 0), 0)
      const totalLikes = allPostsRes.data.data.reduce((sum, post) => sum + (post.likes?.length || 0), 0)
      const totalComments = allPostsRes.data.data.reduce((sum, post) => sum + (post.comments?.length || 0), 0)
      
      setStats({ totalViews, totalLikes, totalComments })
    } catch (e) {
      console.error('Failed to load dashboard data:', e)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'Author'}!</h1>
        <div className="flex items-center gap-4">
          <Notifications />
          <button onClick={logout} className="text-red-600 hover:text-red-800">Logout</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">👁️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">👍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLikes}</p>
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

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link 
          to="/editor" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ✍️ Write New Post
        </Link>
        <Link 
          to="/" 
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
        >
          📖 Browse Posts
        </Link>
        {user?.role === 'admin' && (
          <Link 
            to="/admin" 
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            ⚙️ Admin Panel
          </Link>
        )}
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Your Posts</h2>
        </div>
        <div className="divide-y">
          {posts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>You haven't written any posts yet.</p>
              <Link to="/editor" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                Start writing your first post →
              </Link>
            </div>
          ) : (
            posts.map(post => (
              <div key={post._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link 
                      to={`/post/${post.slug}`}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600"
                    >
                      {post.title}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {post.summary || 'No summary available'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{post.views || 0} views</span>
                      <span>•</span>
                      <span>{post.likes?.length || 0} likes</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


