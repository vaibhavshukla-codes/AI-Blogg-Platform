import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import api from '../lib/api'

const AuthCtx = createContext(null)

function normalizeUser(user) {
  if (!user) return null
  return {
    ...user,
    id: user.id ?? user._id,
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) return null

    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        return normalizeUser(JSON.parse(storedUser))
      } catch {
        return null
      }
    }
    return null
  })
  const [authLoading, setAuthLoading] = useState(() => !!localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  const clearSession = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  useEffect(() => {
    const onSessionExpired = () => clearSession()
    window.addEventListener('auth:logout', onSessionExpired)
    return () => window.removeEventListener('auth:logout', onSessionExpired)
  }, [clearSession])

  useEffect(() => {
    if (!token) {
      setAuthLoading(false)
      if (user) setUser(null)
      return
    }

    let cancelled = false
    setAuthLoading(true)

    api.get('/auth/me')
      .then(({ data }) => {
        if (!cancelled && data.user) setUser(normalizeUser(data.user))
      })
      .catch(() => {
        if (!cancelled) clearSession()
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false)
      })

    return () => { cancelled = true }
  }, [token, clearSession])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setToken(data.token)
    setUser(normalizeUser(data.user))
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    setToken(data.token)
    setUser(normalizeUser(data.user))
  }, [])

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const value = useMemo(
    () => ({ token, user, authLoading, login, register, logout }),
    [token, user, authLoading, login, register, logout]
  )
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() { return useContext(AuthCtx) }


