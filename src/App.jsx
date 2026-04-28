import { useState, useEffect } from 'react'
import { apiFetch } from './api'
import Auth from './screens/Auth'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Notifications from './components/Notifications'

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [page, setPage] = useState('dashboard')
  const [token, setToken] = useState(() => localStorage.getItem('ks_token'))
  const [currentUser, setCurrentUser] = useState(null)
  const [weeks, setWeeks] = useState([])
  const [currentWeekId, setCurrentWeekId] = useState(null)
  const [categories, setCategories] = useState([])
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function api(path, method = 'GET', body = null) {
    return apiFetch(path, method, body, token)
  }

  // On mount: verify token or show auth
  useEffect(() => {
    if (!token) { setScreen('auth'); return }
    apiFetch('/auth', 'GET', null, token)
      .then(data => { setCurrentUser(data.user); setScreen('app') })
      .catch(() => { localStorage.removeItem('ks_token'); setToken(null); setScreen('auth') })
  }, [])

  // Load app data once authenticated
  useEffect(() => {
    if (screen !== 'app') return
    Promise.all([
      apiFetch('/weeks', 'GET', null, token),
      apiFetch('/weeks?id=current', 'GET', null, token),
      apiFetch('/categories', 'GET', null, token),
    ]).then(([allWeeks, cur, cats]) => {
      const merged = allWeeks.find(w => w.id === cur.id) ? allWeeks : [cur, ...allWeeks]
      setWeeks(merged)
      setCurrentWeekId(cur.id)
      setCategories(cats)
    })
  }, [screen])

  function login(tok, user) {
    localStorage.setItem('ks_token', tok)
    setToken(tok)
    setCurrentUser(user)
    setScreen('app')
  }

  function logout() {
    localStorage.removeItem('ks_token')
    setToken(null)
    setCurrentUser(null)
    setWeeks([])
    setCurrentWeekId(null)
    setScreen('auth')
    setPage('dashboard')
  }

  if (screen === 'loading') return null
  if (screen === 'auth') return <Auth onLogin={login} />

  const shared = { token, api, weeks, setWeeks, currentWeekId, setCurrentWeekId, categories, showToast }

  return (
    <div id="app">
      <header className="header">
        <div className="logo">Kiwi<span>Spend</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Notifications token={token} currentWeekId={currentWeekId} />
          <div className="user-chip" onClick={logout}>{currentUser?.display_name} · Logout</div>
        </div>
      </header>

      <div className="content">
        {page === 'dashboard' && <Dashboard {...shared} />}
        {page === 'expenses'  && <Expenses  {...shared} />}
        {page === 'reports'   && <Reports   {...shared} />}
        {page === 'settings'  && <Settings  {...shared} currentUser={currentUser} token={token} />}
      </div>

      <nav className="tab-bar">
        {[
          { id: 'dashboard', icon: '📊', label: 'Dashboard' },
          { id: 'expenses',  icon: '💸', label: 'Expenses'  },
          { id: 'reports',   icon: '📋', label: 'Reports'   },
          { id: 'settings',  icon: '⚙️', label: 'Settings'  },
        ].map(t => (
          <button key={t.id} className={`tab-btn ${page === t.id ? 'active' : ''}`} onClick={() => setPage(t.id)}>
            <span className="icon">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>

      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}
