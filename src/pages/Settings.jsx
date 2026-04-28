import { useState, useEffect } from 'react'

export default function Settings({ api, currentUser, weeks, currentWeekId, setWeeks, setCurrentWeekId, showToast }) {
  const [income, setIncome] = useState('')
  const [budget, setBudget] = useState('')

  useEffect(() => {
    const w = weeks.find(w => w.id === currentWeekId)
    if (w) { setIncome(w.income || ''); setBudget(w.budget_target || '') }
  }, [currentWeekId, weeks])

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
