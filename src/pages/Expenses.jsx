import { useState, useEffect } from 'react'
import { fmt } from '../api'

export default function Expenses({ api, currentWeekId, weeks, setCurrentWeekId, categories, showToast }) {
  const [expenses, setExpenses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedCat, setSelectedCat] = useState(null)

  function loadExpenses() {
    if (!currentWeekId) return
    api(`/expenses?week_id=${currentWeekId}`).then(setExpenses).catch(() => {})
  }

  useEffect(() => { loadExpenses() }, [currentWeekId])

  async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return
    await api(`/expenses?id=${id}`, 'DELETE')
    showToast('Expense deleted')
    loadExpenses()
  }

  async function saveExpense() {
    if (!selectedCat) { showToast('Please select a category'); return }
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { showToast('Please enter an amount'); return }
    await api('/expenses', 'POST', { week_id: currentWeekId, category: selectedCat, description: desc, amount: amt, date })
    setModalOpen(false)
    setAmount(''); setDesc(''); setSelectedCat(null)
    showToast('✅ Expense added!')
    loadExpenses()
  }

  function openModal() {
    setAmount(''); setDesc('')
    setDate(new Date().toISOString().split('T')[0])
    setSelectedCat(null)
    setModalOpen(true)
  }

  return (
    <>
      <button className="add-btn" onClick={openModal}>+ Add Expense</button>

      <div className="week-selector">
        {weeks.slice(0, 6).map(w => (
          <div key={w.id} className={`week-chip ${w.id === currentWeekId ? 'active' : ''}`} onClick={() => setCurrentWeekId(w.id)}>
            {w.week_label}
          </div>
        ))}
      </div>

      {expenses.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">💸</div>
          <div className="empty-title">No expenses yet</div>
          <div className="empty-sub">Tap the button above to add your first expense</div>
        </div>
      ) : expenses.map(e => (
        <div key={e.id} className="expense-item">
          <div className="expense-icon">{e.icon || '💰'}</div>
          <div className="expense-info">
            <div className="expense-desc">{e.description || e.category}</div>
            <div className="expense-meta">{e.category} · {e.date}</div>
          </div>
          <div className="expense-amount">{fmt(e.amount)}</div>
          <button className="delete-btn" onClick={() => deleteExpense(e.id)}>🗑</button>
        </div>
      ))}

      {/* Add Expense Modal */}
      <div className={`modal-overlay ${modalOpen ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
        <div className="modal">
          <div className="drag-handle" />
          <div className="modal-title">Add Expense</div>
          <div className="field">
            <label>Category</label>
            <div className="cat-grid">
              {categories.map(c => (
                <div key={c.name} className={`cat-chip ${selectedCat === c.name ? 'selected' : ''}`} onClick={() => setSelectedCat(c.name)}>
                  <span className="emoji">{c.icon}</span>{c.name.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Amount (NZD $)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" step="0.01" />
          </div>
          <div className="field">
            <label>Description (optional)</label>
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Coffee at Customs" />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={saveExpense}>Save Expense</button>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
        </div>
      </div>
    </>
  )
}
