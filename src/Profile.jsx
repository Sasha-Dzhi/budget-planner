import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export default function Profile({ session, transactions, filtered, currentPeriodLabel, darkMode, isMobile }) {
  const [displayName, setDisplayName] = useState('')
  const [editing, setEditing] = useState(false)
  const [tempName, setTempName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [avatar, setAvatar] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) { setDisplayName(data.display_name || ''); setAvatar(data.avatar_url || null) }
  }

  const saveName = async () => {
    setSavingName(true)
    await supabase.from('profiles').upsert({ id: session.user.id, display_name: tempName, updated_at: new Date().toISOString() })
    setDisplayName(tempName); setEditing(false); setSavingName(false)
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    const fileName = `${session.user.id}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await supabase.from('profiles').upsert({ id: session.user.id, avatar_url: data.publicUrl, updated_at: new Date().toISOString() })
      setAvatar(data.publicUrl)
    }
    setUploadingAvatar(false)
  }

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description']
    const rows = transactions.map(t => [t.date, t.type, t.category, t.amount, `"${(t.description || '').replace(/"/g, '""')}"`])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click()
  }

  // Colors
  const d = darkMode
  const text        = d ? '#fff'                    : '#111'
  const textMuted   = d ? 'rgba(255,255,255,0.45)'  : 'rgba(0,0,0,0.45)'
  const textFaint   = d ? 'rgba(255,255,255,0.25)'  : 'rgba(0,0,0,0.3)'
  const cardBg      = d ? '#1a1b2e'                 : '#fff'
  const cardBorder  = d ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.07)'
  const statBg      = d ? 'rgba(255,255,255,0.04)'  : 'rgba(0,0,0,0.03)'
  const inputBg     = d ? 'rgba(255,255,255,0.05)'  : 'rgba(0,0,0,0.04)'
  const inputBorder = d ? 'rgba(255,255,255,0.1)'   : 'rgba(0,0,0,0.1)'
  const cancelBg    = d ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.05)'
  const cancelColor = d ? 'rgba(255,255,255,0.5)'   : 'rgba(0,0,0,0.4)'
  const editBtn     = d ? 'rgba(255,255,255,0.25)'  : 'rgba(0,0,0,0.2)'
  const cardShadow  = d ? 'none'                    : '0 1px 4px rgba(0,0,0,0.06)'
  const divider     = d ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.06)'

  const card  = { background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '20px', padding: '24px', boxShadow: cardShadow }
  const stat  = { background: statBg, borderRadius: '14px', padding: '16px 18px' }
  const label = { fontSize: '11px', fontWeight: 600, color: textFaint, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }
  const cols3 = isMobile ? '1fr 1fr' : '1fr 1fr 1fr'

  // ── Data ──────────────────────────────────────────────
  const totalIncome   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance       = totalIncome - totalExpenses
  const biggestIncome  = transactions.filter(t => t.type === 'income').reduce((mx, t) => t.amount > mx ? t.amount : mx, 0)
  const biggestExpense = transactions.filter(t => t.type === 'expense').reduce((mx, t) => t.amount > mx ? t.amount : mx, 0)

  const periodIncome   = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const periodExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savingsRate    = periodIncome > 0 ? Math.round((periodIncome - periodExpenses) / periodIncome * 100) : 0

  const categoryTotals = {}
  transactions.filter(t => t.type === 'expense').forEach(t => { categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount })
  const favouriteCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  const monthlyTotals = {}
  transactions.forEach(t => {
    const m = t.date.slice(0, 7)
    if (!monthlyTotals[m]) monthlyTotals[m] = 0
    if (t.type === 'expense') monthlyTotals[m] += t.amount
  })
  const mostExpensiveMonth = Object.entries(monthlyTotals).sort((a, b) => b[1] - a[1])[0]
  const avgMonthlySpending = Object.values(monthlyTotals).length > 0
    ? Math.round(Object.values(monthlyTotals).reduce((s, v) => s + v, 0) / Object.values(monthlyTotals).length)
    : 0

  const firstTx = transactions.length > 0 ? transactions[transactions.length - 1].date : null
  const daysSinceFirst = firstTx ? Math.floor((new Date() - new Date(firstTx)) / (1000 * 60 * 60 * 24)) : 0

  const sortedDates = [...new Set(transactions.map(t => t.date))].sort()
  let streak = 0, currentStreak = 0
  const today = new Date().toISOString().split('T')[0]
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) { currentStreak = 1; continue }
    const diff = (new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) / (1000 * 60 * 60 * 24)
    currentStreak = diff === 1 ? currentStreak + 1 : 1
    streak = Math.max(streak, currentStreak)
  }
  const activeStreak = transactions.some(t => t.date === today) ? currentStreak : 0

  const monthlyNet = {}
  transactions.forEach(t => {
    const m = t.date.slice(0, 7)
    if (!monthlyNet[m]) monthlyNet[m] = 0
    monthlyNet[m] += t.type === 'income' ? t.amount : -t.amount
  })
  const bestMonth = Object.entries(monthlyNet).sort((a, b) => b[1] - a[1])[0]

  const healthScore = Math.round(
    Math.min(savingsRate * 0.4, 40) +
    Math.min(daysSinceFirst > 0 ? (transactions.length / daysSinceFirst * 30) * 30 : 0, 30) +
    Math.min(streak * 2, 30)
  )
  const badge = healthScore >= 80 ? { label: 'Finance Pro',     emoji: '🏆', color: '#f59e0b' }
    : healthScore >= 60            ? { label: 'On Track',        emoji: '🚀', color: '#6366f1' }
    : healthScore >= 40            ? { label: 'Building Habits', emoji: '💪', color: '#10b981' }
    :                                { label: 'Getting Started', emoji: '🌱', color: '#34d399' }

  const memberSince = new Date(session.user.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  const initial = (displayName || session.user.email)[0].toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── 1. Identity ───────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatar
              ? <img src={avatar} alt="avatar" style={{ width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.4)' }} />
              : <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 700, color: '#fff', border: '2px solid rgba(99,102,241,0.3)' }}>{initial}</div>
            }
            <label style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(99,102,241,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px' }}>
              {uploadingAvatar ? '⏳' : '📷'}
              <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} placeholder="Your name" autoFocus
                  style={{ flex: 1, minWidth: '120px', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${inputBorder}`, background: inputBg, color: text, fontSize: '14px', outline: 'none' }} />
                <button onClick={saveName} disabled={savingName}
                  style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {savingName ? '...' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)}
                  style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: cancelBg, color: cancelColor, fontSize: '13px' }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: text, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{displayName || 'Add your name'}</p>
                <button onClick={() => { setTempName(displayName); setEditing(true) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: editBtn, transition: 'color .15s', padding: '2px 4px' }}
                  onMouseOver={e => e.target.style.color = '#818cf8'}
                  onMouseOut={e => e.target.style.color = editBtn}>✏️</button>
              </div>
            )}
            <p style={{ fontSize: '13px', color: textMuted, marginBottom: '2px' }}>{session.user.email}</p>
            <p style={{ fontSize: '11px', color: textFaint, marginBottom: '14px' }}>Member since {memberSince}</p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: badge.color + '20', border: `1px solid ${badge.color}40`, color: badge.color }}>
              {badge.emoji} {badge.label}
            </span>
          </div>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: textMuted }}>Savings rate · {currentPeriodLabel}</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: savingsRate > 0 ? '#34d399' : '#f87171' }}>{savingsRate}%</p>
          </div>
          <div style={{ height: '6px', background: statBg, borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(Math.max(savingsRate, 0), 100)}%`, background: savingsRate > 0 ? 'linear-gradient(90deg, #34d399, #10b981)' : '#f87171', borderRadius: '3px', transition: 'width .5s ease' }} />
          </div>
          <p style={{ fontSize: '11px', color: textFaint, marginTop: '6px' }}>
            {savingsRate > 50 ? '🔥 Excellent savings!' : savingsRate > 20 ? '👍 Good progress' : savingsRate > 0 ? '💡 Room to improve' : '⚠️ Spending exceeds income'}
          </p>
        </div>
      </div>

      {/* ── 2. This month ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: cols3, gap: '12px' }}>
        <div style={{ ...stat, border: `1px solid rgba(52,211,153,0.2)`, background: 'rgba(52,211,153,0.06)' }}>
          <p style={{ fontSize: '11px', color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Income · {currentPeriodLabel}</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: '#34d399', letterSpacing: '-1px' }}>€{periodIncome.toFixed(0)}</p>
        </div>
        <div style={{ ...stat, border: `1px solid rgba(248,113,113,0.2)`, background: 'rgba(248,113,113,0.06)' }}>
          <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Expenses · {currentPeriodLabel}</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: '#f87171', letterSpacing: '-1px' }}>€{periodExpenses.toFixed(0)}</p>
        </div>
        <div style={{ ...stat, border: `1px solid ${cardBorder}`, gridColumn: isMobile ? '1 / -1' : 'auto' }}>
          <p style={{ fontSize: '11px', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Savings rate</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: savingsRate > 0 ? '#34d399' : '#f87171', letterSpacing: '-1px' }}>{savingsRate}%</p>
        </div>
      </div>

      {/* ── 3. All time ───────────────────────────────── */}
      <div style={card}>
        <p style={label}>All time</p>
        <div style={{ display: 'grid', gridTemplateColumns: cols3, gap: '10px' }}>
          {[
            { l: 'Balance',          v: `€${balance.toFixed(0)}`,         c: balance >= 0 ? text : '#f87171' },
            { l: 'Total income',     v: `€${totalIncome.toFixed(0)}`,      c: '#34d399' },
            { l: 'Total expenses',   v: `€${totalExpenses.toFixed(0)}`,    c: '#f87171' },
            { l: 'Transactions',     v: transactions.length,               c: '#818cf8' },
            { l: 'Biggest income',   v: `€${biggestIncome.toFixed(0)}`,    c: '#34d399' },
            { l: 'Biggest expense',  v: `€${biggestExpense.toFixed(0)}`,   c: '#f87171' },
          ].map(s => (
            <div key={s.l} style={stat}>
              <p style={{ fontSize: '11px', color: textFaint, marginBottom: '6px' }}>{s.l}</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: s.c, letterSpacing: '-0.5px' }}>{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Achievements ───────────────────────────── */}
      <div style={card}>
        <p style={label}>Achievements</p>
        <div style={{ display: 'grid', gridTemplateColumns: cols3, gap: '10px' }}>
          <div style={stat}>
            <p style={{ fontSize: '11px', color: textFaint, marginBottom: '6px' }}>🔥 Longest streak</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: text }}>{streak} days</p>
          </div>
          <div style={stat}>
            <p style={{ fontSize: '11px', color: textFaint, marginBottom: '6px' }}>⚡ Active streak</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: activeStreak > 0 ? '#34d399' : textMuted }}>{activeStreak} days</p>
          </div>
          <div style={{ ...stat, gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <p style={{ fontSize: '11px', color: textFaint, marginBottom: '6px' }}>📊 Health score</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#818cf8' }}>{healthScore}/100</p>
          </div>
          <div style={{ ...stat, gridColumn: '1 / -1' }}>
            <p style={{ fontSize: '11px', color: textFaint, marginBottom: '6px' }}>🏅 Best month</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#34d399' }}>{bestMonth ? `${bestMonth[0]} · €${bestMonth[1].toFixed(0)}` : '—'}</p>
          </div>
        </div>
      </div>

      {/* ── 5. Insights ───────────────────────────────── */}
      <div style={card}>
        <p style={label}>Insights · All time</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { icon: '🏆', l: 'Top spending category',  v: favouriteCategory },
            { icon: '📅', l: 'Most expensive month',   v: mostExpensiveMonth ? `${mostExpensiveMonth[0]} · €${mostExpensiveMonth[1].toFixed(0)}` : '—' },
            { icon: '📊', l: 'Avg monthly spending',   v: `€${avgMonthlySpending}` },
            { icon: '⏱️', l: 'Days tracking finances', v: `${daysSinceFirst} days` },
          ].map(s => (
            <div key={s.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: statBg, borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>{s.icon}</span>
                <p style={{ fontSize: '13px', color: textMuted }}>{s.l}</p>
              </div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: text }}>{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Data ───────────────────────────────────── */}
      <div style={card}>
        <p style={label}>Data</p>
        <button onClick={exportCSV} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', border: `1px solid ${cardBorder}`, background: statBg, color: text, fontSize: '14px', fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📥 Export transactions as CSV
        </button>
      </div>

    </div>
  )
}
