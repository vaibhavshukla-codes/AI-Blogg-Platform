import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import Comments from '../components/Comments'
import SearchBar from '../components/SearchBar'

export default function PostView() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { 
    (async () => { 
      const { data } = await api.get(`/posts/${slug}`)
      setPost(data.post)
      setLiked(data.post.likes?.some(id => id === user?.id) || false)
      setDisliked(data.post.dislikes?.some(id => id === user?.id) || false)
      api.post(`/posts/${slug}/views`) 
    })() 
  }, [slug, user?.id])

  const handleReaction = async (action) => {
    if (!user) return
    setLoading(true)
    try {
      await api.post(`/posts/${slug}/react`, { action })
      if (action === 'like') {
        setLiked(!liked)
        setDisliked(false)
      } else {
        setDisliked(!disliked)
        setLiked(false)
      }
    } catch (e) {
      console.error('Reaction failed:', e)
    } finally {
      setLoading(false)
    }
  }

  if (!post) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <SearchBar />
      <article className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span>By {post.author?.name}</span>
          <span>•</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>{post.readingTimeMinutes} min read</span>
          <span>•</span>
          <span>{post.views} views</span>
        </div>
        {post.coverImageUrl && (
          <img src={post.coverImageUrl} alt={post.title} className="w-full h-64 object-cover rounded mb-6" />
        )}
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        
        {user && (
          <div className="flex gap-4 mt-6 pt-6 border-t">
            <button 
              onClick={() => handleReaction('like')} 
              disabled={loading}
              className={`px-4 py-2 rounded ${liked ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              👍 {post.likes?.length || 0}
            </button>
            <button 
              onClick={() => handleReaction('dislike')} 
              disabled={loading}
              className={`px-4 py-2 rounded ${disliked ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
            >
              👎 {post.dislikes?.length || 0}
            </button>
          </div>
        )}
      </article>
      
      <Comments postId={post._id} />
    </div>
  )
}


