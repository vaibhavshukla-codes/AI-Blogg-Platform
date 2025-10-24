import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try { await login(email, password); nav('/dashboard') } catch (e) { setError(e.response?.data?.message || 'Login failed') }
  }
  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto bg-white p-6 rounded shadow space-y-3">
      <h1 className="text-xl font-semibold">Login</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full border p-2 rounded" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="w-full bg-blue-600 text-white p-2 rounded">Sign In</button>
    </form>
  )
}


