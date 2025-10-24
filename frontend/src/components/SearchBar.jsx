import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (query.length > 2) {
      const timeoutId = setTimeout(() => {
        searchPosts()
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [query])

  const searchPosts = async () => {
    try {
      const { data } = await api.get('/search', { params: { q: query } })
      setResults(data.results || [])
      setShowResults(true)
    } catch (e) {
      console.error('Search failed:', e)
    }
  }

  const handleResultClick = (slug) => {
    navigate(`/post/${slug}`)
    setQuery('')
    setShowResults(false)
  }

  return (
    <div className="relative mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => query && searchPosts()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
          {results.map((post) => (
            <div
              key={post.slug}
              onClick={() => handleResultClick(post.slug)}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
            >
              <h4 className="font-medium text-gray-900">{post.title}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{post.summary}</p>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.length > 2 && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 p-3">
          <p className="text-gray-500">No posts found for "{query}"</p>
        </div>
      )}
    </div>
  )
}
