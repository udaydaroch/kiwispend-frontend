import { useState } from 'react'
import { apiFetch } from '../api'

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [slots, setSlots] = useState([])
  const [setupFull, setSetupFull] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [showForm, setShowForm] = useState(false)

  // Login state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // Setup state
  const [displayName, setDisplayName] = useState('')
  const [setupUser, setSetupUser] = useState('')
  const [setupPass, setSetupPass] = useState('')
  const [setupError, setSetupError] = useState('')

  async function loadSetup() {
    const data = await apiFetch('/setup')
    setSlots(data.slots)
    setSetupFull(data.setupFull)
    setMode('setup')
  }

  async function doLogin() {
    setAuthError('')
    try {
      const data = await apiFetch('/auth', 'POST', { username, password })
      onLogin(data.token, data.user)
    } catch (e) { setAuthError(e.message) }
  }

  async function doSetup() {
    setSetupError('')
    try {
      const data = await apiFetch('/setup', 'POST', { slot: selectedSlot, username: setupUser, password: setupPass, display_name: displayName })
      onLogin(data.token, data.user)
    } catch (e) { setSetupError(e.message) }
  }

  if (mode === 'login') {
    return (
      <div className="auth-screen">
        <div className="auth-logo">Kiwi<span>Spend</span></div>
        <div className="auth-sub">Your personal weekly expense tracker</div>
        <div className="auth-card">
          <div className="auth-title">Welcome back</div>
          <div className="field">
            <label>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="your username" autoComplete="username" autoCapitalize="none"
              onKeyDown={e => e.key === 'Enter' && doLogin()} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••" autoComplete="current-password"
              onKeyDown={e => e.key === 'Enter' && doLogin()} />
          </div>
          <button className="btn-primary" onClick={doLogin}>Sign In</button>
          <button className="btn-secondary" onClick={loadSetup}>Create Account →</button>
          {authError && <div style={{ color: 'var(--danger)', fontSize: '.75rem', marginTop: '10px', textAlign: 'center' }}>{authError}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">Kiwi<span>Spend</span></div>
      <div className="auth-sub">{setupFull ? 'All 4 accounts are taken' : 'Choose your account slot'}</div>
      <div className="auth-card">
        <div className="auth-title">Create Account</div>
        {!showForm ? (
          <div className="slot-grid">
            {slots.map(s => (
              <div key={s.slot} className={`slot-btn ${s.claimed ? 'taken' : ''}`}
                onClick={() => { if (!s.claimed) { setSelectedSlot(s.slot); setShowForm(true) } }}>
                <div className="slot-num">{s.slot}</div>
                <div className="slot-label">{s.claimed ? 'Taken' : 'Available'}</div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="field"><label>Display Name</label><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Uday" /></div>
            <div className="field"><label>Username</label><input type="text" value={setupUser} onChange={e => setSetupUser(e.target.value)} placeholder="e.g. uday" autoCapitalize="none" /></div>
            <div className="field"><label>Password (min 6 chars)</label><input type="password" value={setupPass} onChange={e => setSetupPass(e.target.value)} placeholder="••••••" /></div>
            <button className="btn-primary" onClick={doSetup}>Create Account</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setSelectedSlot(null) }}>← Back</button>
            {setupError && <div style={{ color: 'var(--danger)', fontSize: '.75rem', marginTop: '10px', textAlign: 'center' }}>{setupError}</div>}
          </>
        )}
      </div>
    </div>
  )
}
