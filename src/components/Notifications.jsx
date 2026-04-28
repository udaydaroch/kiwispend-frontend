import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { apiFetch, fmt } from '../api'

function generateNotifications(data, currentWeekId) {
  const notifs = []
  if (!data?.week) return notifs

  const { totalSpent, savingsRate, week } = data
  const income = parseFloat(week.income || 0)
  const budget = parseFloat(week.budget_target || 0)
  const budgetPct = budget > 0 ? (totalSpent / budget * 100) : 0
  const incomePct = income > 0 ? (totalSpent / income * 100) : 0
  const wid = currentWeekId

  if (income === 0) {
    notifs.push({ id: `no-income-${wid}`, type: 'info', icon: '💡', title: 'Income not set', body: 'Go to Settings to set your weekly income and track your savings rate.' })
  }

  if (budget > 0 && budgetPct >= 100) {
    notifs.push({ id: `over-budget-${wid}-${Math.floor(budgetPct)}`, type: 'danger', icon: '🚨', title: 'Over budget!', body: `You've exceeded your ${fmt(budget)} budget by ${fmt(totalSpent - budget)} this week.` })
  } else if (budget > 0 && budgetPct >= 90) {
    notifs.push({ id: `budget-90-${wid}-${Math.floor(budgetPct)}`, type: 'warning', icon: '⚠️', title: 'Budget almost gone', body: `${Math.round(budgetPct)}% of your ${fmt(budget)} budget used — only ${fmt(budget - totalSpent)} left.` })
  } else if (budget > 0 && budgetPct >= 70) {
    notifs.push({ id: `budget-70-${wid}-${Math.floor(budgetPct)}`, type: 'warning', icon: '⚠️', title: 'Budget check', body: `You've used ${Math.round(budgetPct)}% of your spending budget this week.` })
  }

  if (income > 0 && incomePct > 90 && budget === 0) {
    notifs.push({ id: `high-spend-${wid}-${Math.floor(incomePct)}`, type: 'warning', icon: '📊', title: 'High spending', body: `You've spent ${Math.round(incomePct)}% of your weekly income.` })
  }

  if (income > 0 && parseFloat(savingsRate) >= 25) {
    notifs.push({ id: `great-savings-${wid}-${Math.floor(savingsRate)}`, type: 'success', icon: '🎉', title: 'Great savings!', body: `You're on track to save ${savingsRate}% of your income this week. Keep it up!` })
  } else if (income > 0 && parseFloat(savingsRate) >= 10) {
    notifs.push({ id: `good-savings-${wid}-${Math.floor(savingsRate)}`, type: 'success', icon: '✅', title: 'Saving well', body: `You're saving ${savingsRate}% of your income this week.` })
  }

  const catEntries = Object.entries(data.byCategory || {}).sort((a, b) => b[1].total - a[1].total)
  if (catEntries.length > 0) {
    const [topCat, topInfo] = catEntries[0]
    notifs.push({ id: `top-cat-${wid}-${topCat}`, type: 'info', icon: '📈', title: 'Top spending category', body: `${topCat} is your biggest expense this week at ${fmt(topInfo.total)}.` })
  }

  return notifs
}

const TYPE_COLOR = {
  danger:  'var(--danger)',
  warning: 'var(--warn)',
  success: 'var(--accent3)',
  info:    'var(--accent)',
}

export default function Notifications({ token, currentWeekId }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ks_read_notifs') || '[]') } catch { return [] }
  })
  const panelRef = useRef(null)
  const btnRef = useRef(null)

  useEffect(() => {
    if (!currentWeekId) return
    apiFetch(`/analytics?week_id=${currentWeekId}`, 'GET', null, token)
      .then(data => setNotifs(generateNotifications(data, currentWeekId)))
      .catch(() => {})
  }, [currentWeekId])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      // mark all current as read when opening
      const ids = notifs.map(n => n.id)
      const merged = [...new Set([...readIds, ...ids])]
      setReadIds(merged)
      localStorage.setItem('ks_read_notifs', JSON.stringify(merged))
    }
  }

  const unread = notifs.filter(n => !readIds.includes(n.id)).length

  return (
    <>
      <button ref={btnRef} className="notif-btn" onClick={toggle} aria-label="Notifications">
        🔔
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>

      {open && createPortal(
        <div ref={panelRef} className="notif-panel">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            <button className="notif-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          {notifs.length === 0 ? (
            <div className="notif-empty">All clear — no alerts right now.</div>
          ) : notifs.map(n => (
            <div key={n.id} className="notif-item">
              <div className="notif-icon">{n.icon}</div>
              <div className="notif-content">
                <div className="notif-title" style={{ color: TYPE_COLOR[n.type] }}>{n.title}</div>
                <div className="notif-body">{n.body}</div>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
