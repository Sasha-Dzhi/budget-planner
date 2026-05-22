import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export default function Profile({ session, transactions, filtered, currentPeriodLabel }) {
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

  // All time stats
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpenses
  const biggestIncome = transactions.filter(t => t.type === 'income').reduce((max, t) => t.amount > max ? t.amount : max, 0)
  const biggestExpense = transactions.filter(t => t.type === 'expense').reduce((max, t) => t.amount > max ? t.amount : max, 0)

  // Period stats (respects filter)
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

  const memberSince = new Date(session.user.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  const initial = (displayName || session.user.email)[0].toUpperCase()
  const cardStyle = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' }
  const statBox = { background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '16px' }
  const inputClass = "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"

  return (
    <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Profile card */}
      <div style={cardStyle}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px' }}>Profile</p>

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
                  placeholder="Your name" className={inputClass} style={{ padding: '8px 12px' }} autoFocus />
                <button onClick={saveName} disabled={savingName} style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {savingName ? '...' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                  {displayName || 'Add your name'}
                </p>
                <button onClick={() => { setTempName(displayName); setEditing(true) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.25)', transition: 'color .15s' }}
                  onMouseOver={e => e.target.style.color = '#818cf8'}
                  onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.25)'}>✏️</button>
              </div>
            )}
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{session.user.email}</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>Member since {memberSince}</p>
          </div>
        </div>

        {/* Savings rate bar — period aware */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Savings rate · {currentPeriodLabel}</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: savingsRate > 0 ? '#34d399' : '#f87171' }}>{savingsRate}%</p>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(Math.max(savingsRate, 0), 100)}%`, background: savingsRate > 0 ? 'linear-gradient(90deg, #34d399, #10b981)' : '#f87171', borderRadius: '3px', transition: 'width .5s ease' }} />
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '6px' }}>
            {savingsRate > 50 ? '🔥 Excellent savings!' : savingsRate > 20 ? '👍 Good progress' : savingsRate > 0 ? '💡 Room to improve' : '⚠️ Spending exceeds income'}
          </p>
        </div>
      </div>

      {/* Financial summary — all time */}
      <div style={cardStyle}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Financial summary · All time</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Total balance', value: `€${balance.toFixed(2)}`, color: balance >= 0 ? '#fff' : '#f87171' },
            { label: 'Total income', value: `€${totalIncome.toFixed(2)}`, color: '#34d399' },
            { label: 'Total expenses', value: `€${totalExpenses.toFixed(2)}`, color: '#f87171' },
            { label: 'Transactions', value: transactions.length, color: '#818cf8' },
            { label: 'Biggest income', value: `€${biggestIncome.toFixed(2)}`, color: '#34d399' },
            { label: 'Biggest expense', value: `€${biggestExpense.toFixed(2)}`, color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={statBox}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div style={cardStyle}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Insights · All time</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { icon: '🏆', label: 'Top spending category', value: favouriteCategory },
            { icon: '📅', label: 'Most expensive month', value: mostExpensiveMonth ? `${mostExpensiveMonth[0]} (€${mostExpensiveMonth[1].toFixed(2)})` : '—' },
            { icon: '📊', label: 'Avg monthly spending', value: `€${avgMonthlySpending}` },
            { icon: '⏱️', label: 'Days tracking finances', value: `${daysSinceFirst} days` },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{s.icon}</span>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
              </div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}