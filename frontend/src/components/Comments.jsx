import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function Comments({ postId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    try {
      const { data } = await api.get(`/comments/${postId}`)
      setComments(data.comments)
    } catch (e) {
      console.error('Failed to load comments:', e)
    }
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return
    
    setLoading(true)
    try {
      await api.post('/comments', {
        postId,
        content: newComment,
        parent: replyingTo
      })
      setNewComment('')
      setReplyingTo(null)
      loadComments()
    } catch (e) {
      console.error('Failed to add comment:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleReaction = async (commentId, action) => {
    if (!user) return
    try {
      await api.post(`/comments/${commentId}/react`, { action })
      loadComments()
    } catch (e) {
      console.error('Reaction failed:', e)
    }
  }

  const renderComment = (comment, depth = 0) => {
    const isLiked = comment.likes?.some(id => id === user?.id) || false
    const isDisliked = comment.dislikes?.some(id => id === user?.id) || false

    return (
      <div key={comment._id} className={`${depth > 0 ? 'ml-8 mt-2' : 'mt-4'}`}>
        <div className="bg-gray-50 p-3 rounded">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <span className="font-medium">{comment.author?.name || 'Anonymous'}</span>
            <span>•</span>
            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-gray-800 mb-2">{comment.content}</p>
          
          {user && (
            <div className="flex gap-2">
              <button
                onClick={() => toggleReaction(comment._id, 'like')}
                className={`text-xs px-2 py-1 rounded ${isLiked ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
              >
                👍 {comment.likes?.length || 0}
              </button>
              <button
                onClick={() => toggleReaction(comment._id, 'dislike')}
                className={`text-xs px-2 py-1 rounded ${isDisliked ? 'bg-red-100 text-red-600' : 'hover:bg-gray-200'}`}
              >
                👎 {comment.dislikes?.length || 0}
              </button>
              <button
                onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                className="text-xs px-2 py-1 rounded hover:bg-gray-200"
              >
                Reply
              </button>
            </div>
          )}
        </div>

        {replyingTo === comment._id && (
          <form onSubmit={addComment} className="mt-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-2 border rounded text-sm"
              rows="2"
            />
            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Reply'}
              </button>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="px-3 py-1 bg-gray-200 text-xs rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Render nested replies */}
        {comment.replies?.map(reply => renderComment(reply, depth + 1))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Comments</h3>
      
      {user ? (
        <form onSubmit={addComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 border rounded mb-2"
            rows="3"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <p className="text-gray-600 mb-4">Please log in to comment.</p>
      )}

      <div className="space-y-2">
        {comments.map(comment => renderComment(comment))}
      </div>
    </div>
  )
}
