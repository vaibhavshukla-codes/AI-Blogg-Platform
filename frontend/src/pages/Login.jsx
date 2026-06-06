import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getEmailError } from '../lib/validateEmail'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    const emailValidationError = getEmailError(trimmedEmail)
    setEmailError(emailValidationError)

    if (emailValidationError) return

    if (!password.trim()) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    try {
      await login(trimmedEmail, password)
      nav('/dashboard')
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 md:py-12 px-4">
      <form onSubmit={onSubmit} className="max-w-md w-full bg-white p-6 md:p-8 rounded-lg shadow-lg space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">Welcome Back</h1>
          <p className="text-sm md:text-base text-gray-600 text-center mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              autoComplete="email"
              className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                emailError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError('')
              }}
              onBlur={() => setEmailError(getEmailError(email))}
              disabled={loading}
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '🔄 Signing in...' : '🔐 Sign In'}
        </button>

        <div className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Create one
          </Link>
        </div>
      </form>
    </div>
  )
}
