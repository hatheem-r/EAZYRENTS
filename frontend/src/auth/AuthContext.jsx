import { createContext, useContext, useEffect, useState } from 'react'
import { getToken, setToken, clearToken } from '../api/client.js'
import { loginUser, registerUser } from '../api/auth.js'

const USER_KEY = 'eazyrents_user'

const AuthContext = createContext(null)

function readStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function getInitialState() {
  const user = readStoredUser()
  const token = getToken()

  // A token without a valid stored user (or vice versa) is an inconsistent
  // session, so treat it as logged out rather than risk mismatched state.
  if (!user || !token) {
    return { user: null, token: null, sessionExpired: false }
  }

  return { user, token, sessionExpired: false }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(getInitialState)

  useEffect(() => {
    function handleAuthExpired() {
      clearToken()
      localStorage.removeItem(USER_KEY)
      setState({ user: null, token: null, sessionExpired: true })
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [])

  async function login(credentials) {
    const { token, user } = await loginUser(credentials)
    setToken(token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setState({ user, token, sessionExpired: false })

    console.log('Logged in user:', user)

    return user
  }

  async function register(data) {
    await registerUser(data)
    return login({ email: data.email, password: data.password })
  }

  function logout() {
    console.log('Logging out user:', state.user)
    clearToken()
    localStorage.removeItem(USER_KEY)
    setState({ user: null, token: null, sessionExpired: false })
  }

  const value = {
    user: state.user,
    token: state.token,
    sessionExpired: state.sessionExpired,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
