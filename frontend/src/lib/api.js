import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.dispatchEvent(new Event('auth:logout'))

      const requestUrl = error.config?.url || ''
      const isAuthCheck = requestUrl.includes('/auth/me')
      const onAuthPage = window.location.pathname.includes('/login')
        || window.location.pathname.includes('/register')

      if (!isAuthCheck && !onAuthPage) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api


