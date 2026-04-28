import { useState, useEffect } from 'react'
import { fmt } from '../api'

export default function Dashboard({ api, currentWeekId, weeks, setCurrentWeekId }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!currentWeekId) return
    api(`/analytics?week_id=${currentWeekId}`).then(setData).catch(() => {})
  }, [currentWeekId])

  const totalSpent = data?.totalSpent || 0
  const income = parseFloat(data?.week?.income || 0)
  const budget = parseFloat(data?.week?.budget_target || 0)
  const rem = income - totalSpent
  const budgetLeft = budget - totalSpent
  const pct = income > 0 ? Math.min((totalSpent / income) * 100, 100) : 0
  const progColor = pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--warn)' : 'var(--accent3)'
  const cats = data ? Object.entries(data.byCategory).sort((a, b) => b[1].total - a[1].total) : []
  const maxCat = cats[0]?.[1].total || 1

  return (
    <>
      <div className="week-selector">
        {weeks.slice(0, 6).map(w => (
          <div key={w.id} className={`week-chip ${w.id === currentWeekId ? 'active' : ''}`} onClick={() => setCurrentWeekId(w.id)}>
            {w.week_label}
          </div>
        ))}
      </div>

      <div className="hero-card">
        <div className="hero-label">SPENT THIS WEEK</div>
        <div className="hero-amount">{fmt(totalSpent)}</div>
        <div className="hero-sub">
          <div className="hero-stat"><div className="val green">{fmt(income)}</div><div className="lbl">WEEKLY INCOME</div></div>
          <div className="hero-stat"><div className={`val ${rem < 0 ? 'red' : 'green'}`}>{fmt(Math.abs(rem))}</div><div className="lbl">REMAINING</div></div>
          <div className="hero-stat"><div className="val blue">{data?.savingsRate || 0}%</div><div className="lbl">SAVINGS RATE</div></div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: pct + '%', background: progColor }} />
        </div>
      </div>

      <div className="grid2">
        <div className="stat-tile"><div className="lbl">BUDGET TARGET</div><div className="val">{fmt(budget)}</div></div>
        <div className="stat-tile"><div className="lbl">BUDGET LEFT</div><div className={`val ${budgetLeft < 0 ? 'red' : 'green'}`}>{fmt(Math.abs(budgetLeft))}</div></div>
      </div>

      <div className="card">
        <div className="card-title">Spending by Category</div>
        {cats.length === 0 ? (
          <div className="empty"><div className="empty-icon">🍃</div><div className="empty-sub">No expenses this week</div></div>
        ) : cats.map(([name, info]) => (
          <div key={name} className="cat-row">
            <div className="cat-icon">{info.icon || '💰'}</div>
            <div className="cat-info">
              <div className="cat-name">{name}</div>
              <div className="cat-bar" style={{ width: (info.total / maxCat * 100).toFixed(0) + '%', background: info.color || '#6366f1' }} />
              <div className="cat-count">{info.count} transaction{info.count !== 1 ? 's' : ''}</div>
            </div>
            <div className="cat-amount">{fmt(info.total)}</div>
          </div>
        ))}
      </div>
    </>
  )
}
