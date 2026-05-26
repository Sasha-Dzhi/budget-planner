import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export default function Profile({ session, transactions, filtered, currentPeriodLabel, darkMode }) {
  const [displayName, setDisplayName] = useState('')
  const [editing, setEditing] = useState(false)
  const [tempName, setTempName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [avatar, setAvatar] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    if (data) {
      setDisplayName(data.display_name || '')
      setAvatar(data.avatar_url || null)
    }
  }

  const saveName = async () => {
    setSavingName(true)
    await supabase.from('profiles').upsert({
      id: session.user.id,
      display_name: tempName,
      updated_at: new Date().toISOString()
    })
    setDisplayName(tempName)
    setEditing(false)
    setSavingName(false)
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}.${fileExt}`
    const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await supabase.from('profiles').upsert({
        id: session.user.id,
        avatar_url: data.publicUrl,
        updated_at: new Date().toISOString()
      })
      setAvatar(data.publicUrl)
    }
    setUploadingAvatar(false)
  }

  const exportCSV = () => {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Description']
  const rows = transactions.map(t => [
    t.date,
    t.type,
    t.category,
    t.amount,
    `"${(t.description || '').replace(/"/g, '""')}"`
  ])
  const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'transactions.csv'
  a.click()
}

  const d = darkMode

  // Color shortcuts
  const text       = d ? '#fff'                      : '#111'
  const textMuted  = d ? 'rgba(255,255,255,0.35)'    : 'rgba(0,0,0,0.45)'
  const textFaint  = d ? 'rgba(255,255,255,0.2)'     : 'rgba(0,0,0,0.3)'
  const textLabel  = d ? 'rgba(255,255,255,0.4)'     : 'rgba(0,0,0,0.4)'
  const cardBg     = d ? 'rgba(255,255,255,0.02)'    : '#fff'
  const cardBorder = d ? 'rgba(255,255,255,0.06)'    : 'rgba(0,0,0,0.07)'
  const statBg     = d ? 'rgba(255,255,255,0.03)'    : 'rgba(0,0,0,0.03)'
  const inputBg    = d ? 'rgba(255,255,255,0.05)'    : 'rgba(0,0,0,0.04)'
  const inputBorder= d ? 'rgba(255,255,255,0.1)'     : 'rgba(0,0,0,0.1)'
  const cancelBg   = d ? 'rgba(255,255,255,0.06)'    : 'rgba(0,0,0,0.05)'
  const cancelColor= d ? 'rgba(255,255,255,0.5)'     : 'rgba(0,0,0,0.4)'
  const editBtn    = d ? 'rgba(255,255,255,0.25)'    : 'rgba(0,0,0,0.2)'
  const barBg      = d ? 'rgba(255,255,255,0.06)'    : 'rgba(0,0,0,0.07)'
  const headerColor= d ? 'rgba(255,255,255,0.3)'     : 'rgba(0,0,0,0.35)'

  const cardStyle = { background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '20px', padding: '24px' }
  const statBox   = { background: statBg, borderRadius: '14px', padding: '16px' }

  // Stats
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpenses
  const biggestIncome = transactions.filter(t => t.type === 'income').reduce((max, t) => t.amount > max ? t.amount : max, 0)
  const biggestExpense = transactions.filter(t => t.type === 'expense').reduce((max, t) => t.amount > max ? t.amount : max, 0)

  const periodIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const periodExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savingsRate = periodIncome > 0 ? ((periodIncome - periodExpenses) / periodIncome * 100).toFixed(0) : 0

  const categoryTotals = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
  })
  const favouriteCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  const monthlyTotals = {}
  transactions.forEach(t => {
    const month = t.date.slice(0, 7)
    if (!monthlyTotals[month]) monthlyTotals[month] = 0
    if (t.type === 'expense') monthlyTotals[month] += t.amount
  })
  const mostExpensiveMonth = Object.entries(monthlyTotals).sort((a, b) => b[1] - a[1])[0]
  const avgMonthlySpending = Object.values(monthlyTotals).length > 0
    ? (Object.values(monthlyTotals).reduce((s, v) => s + v, 0) / Object.values(monthlyTotals).length).toFixed(2)
    : 0

  const firstTransaction = transactions.length > 0 ? transactions[transactions.length - 1].date : null
  const daysSinceFirst = firstTransaction
    ? Math.floor((new Date() - new Date(firstTransaction)) / (1000 * 60 * 60 * 24))
    : 0
    // Spending streak
const sortedDates = [...new Set(transactions.map(t => t.date))].sort()
let streak = 0
let currentStreak = 0
const today = new Date().toISOString().split('T')[0]
for (let i = 0; i < sortedDates.length; i++) {
  if (i === 0) { currentStreak = 1; continue }
  const diff = (new Date(sortedDates[i]) - new Date(sortedDates[i-1])) / (1000*60*60*24)
  currentStreak = diff === 1 ? currentStreak + 1 : 1
  streak = Math.max(streak, currentStreak)
}
const todayHasTransaction = transactions.some(t => t.date === today)
const activeStreak = todayHasTransaction ? currentStreak : 0

// Best month
const monthlyNet = {}
transactions.forEach(t => {
  const month = t.date.slice(0, 7)
  if (!monthlyNet[month]) monthlyNet[month] = 0
  monthlyNet[month] += t.type === 'income' ? t.amount : -t.amount
})
const bestMonth = Object.entries(monthlyNet).sort((a, b) => b[1] - a[1])[0]

// Health score
const savingsScore = Math.min(savingsRate * 0.4, 40)
const consistencyScore = Math.min(daysSinceFirst > 0 ? (transactions.length / daysSinceFirst * 30) * 30 : 0, 30)
const streakScore = Math.min(streak * 2, 30)
const healthScore = Math.round(savingsScore + consistencyScore + streakScore)

// Badge
const badge = healthScore >= 80 ? { label: 'Finance Pro', emoji: '🏆', color: '#f59e0b' }
  : healthScore >= 60 ? { label: 'On Track', emoji: '🚀', color: '#6366f1' }
  : healthScore >= 40 ? { label: 'Building Habits', emoji: '💪', color: '#10b981' }
  : { label: 'Getting Started', emoji: '🌱', color: '#34d399' }

  const memberSince = new Date(session.user.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  const initial = (displayName || session.user.email)[0].toUpperCase()

  return (
    <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Profile card */}
      <div style={cardStyle}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: headerColor, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px' }}>Profile</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatar ? (
              <img src={avatar} alt="avatar" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.4)' }} />
            ) : (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: '#fff', border: '2px solid rgba(99,102,241,0.4)' }}>
                {initial}
              </div>
            )}
            <label style={{ position: 'absolute', bottom: 0, right: 0, width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(99,102,241,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>
              {uploadingAvatar ? '⏳' : '📷'}
              <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ flex: 1 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                <input type="text" value={tempName} onChange={e => setTempName(e.target.value)}
                  placeholder="Your name" autoFocus
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: `1px solid ${inputBorder}`, background: inputBg, color: text, fontSize: '13px', outline: 'none' }} />
                <button onClick={saveName} disabled={savingName} style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {savingName ? '...' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: cancelBg, color: cancelColor, fontSize: '12px' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: text, letterSpacing: '-0.3px' }}>
                  {displayName || 'Add your name'}
                </p>
                <button onClick={() => { setTempName(displayName); setEditing(true) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: editBtn, transition: 'color .15s' }}
                  onMouseOver={e => e.target.style.color = '#818cf8'}
                  onMouseOut={e => e.target.style.color = editBtn}>✏️</button>
              </div>
            )}
            <p style={{ fontSize: '13px', color: textMuted }}>{session.user.email}</p>
            <p style={{ fontSize: '11px', color: textFaint, marginTop: '4px' }}>Member since {memberSince}</p>
          </div>
        </div>

        {/* Savings rate bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: textLabel }}>Savings rate · {currentPeriodLabel}</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: savingsRate > 0 ? '#34d399' : '#f87171' }}>{savingsRate}%</p>
          </div>
          <div style={{ height: '6px', background: barBg, borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(Math.max(savingsRate, 0), 100)}%`, background: savingsRate > 0 ? 'linear-gradient(90deg, #34d399, #10b981)' : '#f87171', borderRadius: '3px', transition: 'width .5s ease' }} />
          </div>
          <p style={{ fontSize: '11px', color: textFaint, marginTop: '6px' }}>
            {savingsRate > 50 ? '🔥 Excellent savings!' : savingsRate > 20 ? '👍 Good progress' : savingsRate > 0 ? '💡 Room to improve' : '⚠️ Spending exceeds income'}
          </p>
        </div>
      </div>

      {/* Financial summary */}
      <div style={cardStyle}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: headerColor, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Financial summary · All time</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Total balance',   value: `€${balance.toFixed(2)}`,        color: balance >= 0 ? text : '#f87171' },
            { label: 'Total income',    value: `€${totalIncome.toFixed(2)}`,     color: '#34d399' },
            { label: 'Total expenses',  value: `€${totalExpenses.toFixed(2)}`,   color: '#f87171' },
            { label: 'Transactions',    value: transactions.length,              color: '#818cf8' },
            { label: 'Biggest income',  value: `€${biggestIncome.toFixed(2)}`,   color: '#34d399' },
            { label: 'Biggest expense', value: `€${biggestExpense.toFixed(2)}`,  color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={statBox}>
              <p style={{ fontSize: '11px', color: textLabel, marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div style={cardStyle}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: headerColor, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Insights · All time</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { icon: '🏆', label: 'Top spending category',  value: favouriteCategory },
            { icon: '📅', label: 'Most expensive month',   value: mostExpensiveMonth ? `${mostExpensiveMonth[0]} (€${mostExpensiveMonth[1].toFixed(2)})` : '—' },
            { icon: '📊', label: 'Avg monthly spending',   value: `€${avgMonthlySpending}` },
            { icon: '⏱️', label: 'Days tracking finances', value: `${daysSinceFirst} days` },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: statBg, borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{s.icon}</span>
                <p style={{ fontSize: '12px', color: textLabel }}>{s.label}</p>
              </div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: text }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
      
<div style={cardStyle}>
  <p style={{ fontSize: '11px', fontWeight: 600, color: headerColor, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Achievement</p>
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: statBg, borderRadius: '14px', marginBottom: '12px' }}>
    <span style={{ fontSize: '36px' }}>{badge.emoji}</span>
    <div>
      <p style={{ fontSize: '16px', fontWeight: 700, color: badge.color, marginBottom: '2px' }}>{badge.label}</p>
      <p style={{ fontSize: '12px', color: textMuted }}>Health score: {healthScore}/100</p>
    </div>
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
    <div style={statBox}>
      <p style={{ fontSize: '11px', color: textLabel, marginBottom: '6px' }}>🔥 Longest streak</p>
      <p style={{ fontSize: '18px', fontWeight: 700, color: text }}>{streak} days</p>
    </div>
    <div style={statBox}>
      <p style={{ fontSize: '11px', color: textLabel, marginBottom: '6px' }}>⚡ Active streak</p>
      <p style={{ fontSize: '18px', fontWeight: 700, color: activeStreak > 0 ? '#34d399' : textMuted }}>{activeStreak} days</p>
    </div>
    <div style={{ ...statBox, gridColumn: '1 / -1' }}>
      <p style={{ fontSize: '11px', color: textLabel, marginBottom: '6px' }}>🏅 Best month</p>
      <p style={{ fontSize: '18px', fontWeight: 700, color: '#34d399' }}>{bestMonth ? `${bestMonth[0]} (€${bestMonth[1].toFixed(2)})` : '—'}</p>
    </div>
  </div>
</div>
 <div style={cardStyle}>
  <p style={{ fontSize: '11px', fontWeight: 600, color: headerColor, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Data</p>
  <button onClick={exportCSV} style={{
    width: '100%', padding: '12px', borderRadius: '12px', cursor: 'pointer',
    border: `1px solid ${cardBorder}`, background: statBg,
    color: text, fontSize: '14px', fontWeight: 600, textAlign: 'left'
  }}>
    📥 Export transactions as CSV
  </button>
</div>

    </div>
  )
}