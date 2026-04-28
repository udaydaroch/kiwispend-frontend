import { useState, useEffect } from 'react'
import { isPushSupported, getSubscriptionStatus, subscribe, unsubscribe } from '../utils/push'

export default function Settings({ api, token, currentUser, weeks, currentWeekId, setWeeks, setCurrentWeekId, showToast }) {
  const [income, setIncome] = useState('')
  const [budget, setBudget] = useState('')
  const [pushStatus, setPushStatus] = useState('loading') // loading | unsupported | denied | unsubscribed | subscribed

  useEffect(() => {
    const w = weeks.find(w => w.id === currentWeekId)
    if (w) { setIncome(w.income || ''); setBudget(w.budget_target || '') }
  }, [currentWeekId, weeks])

  useEffect(() => {
    getSubscriptionStatus().then(setPushStatus)
  }, [])

  async function saveWeekSettings() {
    const w = weeks.find(w => w.id === currentWeekId)
    await api(`/weeks?id=${currentWeekId}`, 'PUT', {
      income: parseFloat(income) || 0,
      budget_target: parseFloat(budget) || 0,
      week_label: w?.week_label
    })
    const [updated, cur] = await Promise.all([api('/weeks'), api('/weeks?id=current')])
    setWeeks(updated.find(w => w.id === cur.id) ? updated : [cur, ...updated])
    showToast('✅ Week settings saved!')
  }

  async function createNewWeek() {
    await api('/weeks', 'POST', {})
    const [updated, cur] = await Promise.all([api('/weeks'), api('/weeks?id=current')])
    setWeeks(updated.find(w => w.id === cur.id) ? updated : [cur, ...updated])
    setCurrentWeekId(cur.id)
    showToast('✅ New week created!')
  }

  async function enableNotifications() {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setPushStatus('denied')
      showToast('Notifications blocked — enable them in browser settings')
      return
    }
    try {
      await subscribe(token)
      setPushStatus('subscribed')
      showToast('✅ Notifications enabled!')
    } catch (e) {
      showToast('❌ Could not enable notifications')
    }
  }

  async function disableNotifications() {
    try {
      await unsubscribe(token)
      setPushStatus('unsubscribed')
      showToast('Notifications disabled')
    } catch (e) {
      showToast('❌ Could not disable notifications')
    }
  }

  const pushLabel = {
    loading:      { text: 'Checking…',        sub: '' },
    unsupported:  { text: 'Not supported',    sub: 'Your browser does not support push notifications' },
    denied:       { text: 'Blocked',          sub: 'Allow notifications in your browser / OS settings' },
    unsubscribed: { text: 'Off',              sub: 'Get budget alerts and expense updates on this device' },
    subscribed:   { text: 'On',               sub: 'You\'ll receive budget alerts and expense confirmations' },
  }[pushStatus]

  return (
    <>
      <div className="card">
        <div className="card-title">This Week's Setup</div>
        <div className="field">
          <label>Weekly Income (NZD $)</label>
          <input type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="e.g. 900" inputMode="decimal" />
        </div>
        <div className="field">
          <label>Spending Budget Target (NZD $)</label>
          <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 600" inputMode="decimal" />
        </div>
        <button className="btn-primary" onClick={saveWeekSettings}>Save Week Settings</button>
      </div>

      <div className="card">
        <div className="card-title">New Week</div>
        <button className="btn-secondary" style={{ margin: 0 }} onClick={createNewWeek}>+ Start New Week</button>
      </div>

      <div className="card">
        <div className="card-title">Push Notifications</div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Device Notifications</div>
            <div className="settings-sublabel">{pushLabel.sub}</div>
          </div>
          <div className="settings-val">{pushLabel.text}</div>
        </div>
        {pushStatus === 'unsubscribed' && (
          <button className="btn-primary" style={{ marginTop: '12px' }} onClick={enableNotifications}>Enable Notifications</button>
        )}
        {pushStatus === 'denied' && (
          <div style={{ fontSize: '.7rem', color: 'var(--warn)', marginTop: '8px', lineHeight: '1.5' }}>
            Open your browser or OS settings and allow notifications for this site, then reload.
          </div>
        )}
        {pushStatus === 'subscribed' && (
          <button className="btn-secondary" onClick={disableNotifications}>Disable Notifications</button>
        )}
      </div>

      <div className="card">
        <div className="card-title">Account</div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Signed in as</div>
            <div className="settings-sublabel">{currentUser?.display_name} (@{currentUser?.username})</div>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Install as App</div>
            <div className="settings-sublabel">iOS: Share → Add to Home Screen</div>
          </div>
          <span>📱</span>
        </div>
      </div>
    </>
  )
}
