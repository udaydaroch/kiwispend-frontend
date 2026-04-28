import { useState, useEffect, useRef } from 'react'
import { API, fmt } from '../api'

function parseCsv(text) {
  return text.trim().split('\n').map(line => {
    const cells = []; let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') inQ = !inQ
      else if (ch === ',' && !inQ) { cells.push(cur); cur = '' }
      else cur += ch
    }
    cells.push(cur)
    return cells
  })
}

export default function Reports({ token, api, weeks, showToast }) {
  const [selectedWeekId, setSelectedWeekId] = useState('')
  const [summary, setSummary] = useState([])
  const [preview, setPreview] = useState(null) // { blob, format, label }
  const [previewUrl, setPreviewUrl] = useState(null)
  const [csvRows, setCsvRows] = useState(null)
  const blobUrlRef = useRef(null)

  useEffect(() => {
    if (weeks.length) setSelectedWeekId(String(weeks[0].id))
    api('/analytics?type=summary').then(setSummary).catch(() => {})
  }, [weeks])

  async function generateReport(format) {
    if (!selectedWeekId) { showToast('Select a week first'); return }
    const label = weeks.find(w => String(w.id) === selectedWeekId)?.week_label || 'Report'
    showToast(`⏳ Generating ${format.toUpperCase()}...`)
    try {
      const res = await fetch(`${API}/report?week_id=${selectedWeekId}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      openPreview(blob, format, label)
    } catch { showToast('❌ Generation failed') }
  }

  function openPreview(blob, format, label) {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    setCsvRows(null)
    if (format === 'pdf') {
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      setPreviewUrl(url)
    } else {
      blob.text().then(text => setCsvRows(parseCsv(text)))
    }
    setPreview({ blob, format, label })
  }

  function closePreview() {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    setPreviewUrl(null)
    setPreview(null)
    setCsvRows(null)
  }

  function downloadPreview() {
    if (!preview) return
    const url = URL.createObjectURL(preview.blob)
    const a = document.createElement('a')
    a.href = url; a.download = `KiwiSpend_report.${preview.format}`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    showToast(`✅ ${preview.format.toUpperCase()} downloaded!`)
  }

  const canEmbedPdf = !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)

  return (
    <>
      <div className="card">
        <div className="card-title">Weekly Summary Report</div>
        <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '16px', lineHeight: '1.6' }}>
          Preview and download a full breakdown of any week's spending.
        </p>
        <div className="field">
          <label>Select Week</label>
          <select value={selectedWeekId} onChange={e => setSelectedWeekId(e.target.value)}>
            {weeks.map(w => <option key={w.id} value={w.id}>{w.week_label}</option>)}
          </select>
        </div>
        <button className="report-btn" onClick={() => generateReport('pdf')}>
          <span className="r-icon">📄</span>
          <div className="r-info"><div className="r-title">Preview PDF</div><div className="r-sub">Formatted report with charts & summary</div></div>
          <span>↓</span>
        </button>
        <button className="report-btn" onClick={() => generateReport('csv')}>
          <span className="r-icon">📊</span>
          <div className="r-info"><div className="r-title">Preview CSV</div><div className="r-sub">Raw data for Excel or Sheets</div></div>
          <span>↓</span>
        </button>
      </div>

      <div className="card">
        <div className="card-title">Past 8 Weeks Overview</div>
        {summary.length === 0 ? (
          <div className="empty"><div className="empty-sub">No weeks yet</div></div>
        ) : summary.map(w => {
          const pct = w.income > 0 ? ((w.totalSpent / w.income) * 100).toFixed(0) : 0
          const col = pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--warn)' : 'var(--accent3)'
          return (
            <div key={w.id} className="cat-row">
              <div className="cat-info">
                <div className="cat-name">{w.week_label}</div>
                <div style={{ height: '3px', borderRadius: '2px', marginTop: '4px', width: Math.min(pct, 100) + '%', background: col }} />
                <div className="cat-count">{fmt(w.totalSpent)} spent of {fmt(w.income)} income</div>
              </div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: '700', fontSize: '.85rem', color: col }}>{pct}%</div>
            </div>
          )
        })}
      </div>

      {/* Preview Overlay */}
      {preview && (
        <div className="preview-overlay">
          <div className="preview-header">
            <button className="preview-close" onClick={closePreview}>✕</button>
            <div className="preview-title">{preview.label} · {preview.format.toUpperCase()}</div>
            <button className="preview-dl" onClick={downloadPreview}>↓ Download</button>
          </div>
          <div className="preview-body">
            {preview.format === 'pdf' ? (
              canEmbedPdf ? (
                <iframe className="preview-iframe" src={previewUrl} title="PDF Preview" />
              ) : (
                <div className="preview-no-pdf">
                  <div className="big">📄</div>
                  <div>PDF preview isn't supported in this browser.</div>
                  <div style={{ fontSize: '.7rem' }}>Tap Download to save the file.</div>
                </div>
              )
            ) : csvRows ? (
              <div className="csv-table-wrap">
                <table className="csv-table">
                  <thead><tr>{csvRows[0]?.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
                  <tbody>{csvRows.slice(1).map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
                </table>
              </div>
            ) : (
              <div className="preview-no-pdf"><div>Loading…</div></div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
