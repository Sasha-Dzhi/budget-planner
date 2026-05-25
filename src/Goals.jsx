import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const EMOJIS = ['🎯','✈️','🏠','🚗','💻','📱','🎓','💍','🏖️','🎸','💪','🐶']

export default function Goals({ session, c, isMobile }) {
  const [goals, setGoals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', emoji: '🎯', target_amount: '', saved_amount: '', deadline: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchGoals() }, [])

  const fetchGoals = async () => {
    const { data } = await supabase.from('goals').select('*').order('created_at', { ascending: true })
    setGoals(data || [])
    setLoading(false)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', emoji: '🎯', target_amount: '', saved_amount: '', deadline: '' })
    setShowForm(true)
  }

  const openEdit = (g) => {
    setEditing(g.id)
    setForm({ name: g.name, emoji: g.emoji || '🎯', target_amount: g.target_amount, saved_amount: g.saved_amount, deadline: g.deadline || '' })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name || !form.target_amount) return
    const payload = {
      name: form.name,
      emoji: form.emoji,
      target_amount: parseFloat(form.target_amount),
      saved_amount: parseFloat(form.saved_amount) || 0,
      deadline: form.deadline || null,
      user_id: session.user.id
    }
    if (editing) {
      await supabase.from('goals').update(payload).eq('id', editing)
    } else {
      await supabase.from('goals').insert(payload)
    }
    setShowForm(false)
    fetchGoals()
  }

  const deleteGoal = async (id) => {
    await supabase.from('goals').delete().eq('id', id)
    fetchGoals()
  }

  const daysLeft = (deadline) => {
    if (!deadline) return null
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'Overdue'
    if (diff === 0) return 'Today!'
    return `${diff} days left`
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '32px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: c.text }}>Savings Goals</h1>
        <button onClick={openNew} style={{
          padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
          fontSize: '14px', fontWeight: 600
        }}>+ New Goal</button>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,1)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '16px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ background: c.inputBg || c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '420px', marginTop: '20px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: c.text, marginBottom: '20px' }}>{editing ? 'Edit Goal' : 'New Goal'}</h2>

            {/* Emoji picker */}
            <p style={{ fontSize: '12px', color: c.textMuted, marginBottom: '8px', fontWeight: 600 }}>ICON</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))} style={{
                  width: '36px', height: '36px', borderRadius: '10px', border: `2px solid ${form.emoji === e ? '#6366f1' : c.cardBorder}`,
                  background: form.emoji === e ? 'rgba(99,102,241,0.15)' : c.periodBg,
                  fontSize: '18px', cursor: 'pointer'
                }}>{e}</button>
              ))}
            </div>

            <p style={{ fontSize: '12px', color: c.textMuted, marginBottom: '6px', fontWeight: 600 }}>GOAL NAME</p>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. New laptop" style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${c.cardBorder}`,
                background: c.periodBg, color: c.text, fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box'
              }} />

            <p style={{ fontSize: '12px', color: c.textMuted, marginBottom: '6px', fontWeight: 600 }}>TARGET AMOUNT (€)</p>
            <input type="number" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
              placeholder="1500" style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${c.cardBorder}`,
                background: c.periodBg, color: c.text, fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box'
              }} />

            <p style={{ fontSize: '12px', color: c.textMuted, marginBottom: '6px', fontWeight: 600 }}>ALREADY SAVED (€)</p>
            <input type="number" value={form.saved_amount} onChange={e => setForm(f => ({ ...f, saved_amount: e.target.value }))}
              placeholder="0" style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${c.cardBorder}`,
                background: c.periodBg, color: c.text, fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box'
              }} />

            <p style={{ fontSize: '12px', color: c.textMuted, marginBottom: '6px', fontWeight: 600 }}>DEADLINE (optional)</p>
            <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${c.cardBorder}`,
                background: c.periodBg, color: c.text, fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box'
              }} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowForm(false)} style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${c.cardBorder}`,
                background: c.periodBg, color: c.textMuted, fontSize: '14px', fontWeight: 600, cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={save} style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer'
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* GOALS LIST */}
      {loading ? (
        <p style={{ color: c.textMuted }}>Loading...</p>
      ) : goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: c.textMuted }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</p>
          <p style={{ fontSize: '16px', fontWeight: 600, color: c.text, marginBottom: '6px' }}>No goals yet</p>
          <p style={{ fontSize: '14px' }}>Add your first savings goal to get started</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {goals.map(g => {
            const pct = Math.min(100, Math.round((g.saved_amount / g.target_amount) * 100))
            const remaining = Math.max(0, g.target_amount - g.saved_amount)
            const dl = daysLeft(g.deadline)
            const done = pct >= 100
            const daysRemaining = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null
            const monthlyNeeded = (() => {
              if (!g.deadline || done || daysRemaining <= 0) return null
             if (daysRemaining <= 30) {
           const perDay = Math.ceil((g.target_amount - g.saved_amount) / daysRemaining)
           return { amount: perDay, unit: 'day' }
         }
             const months = (new Date(g.deadline).getFullYear() - new Date().getFullYear()) * 12
           + new Date(g.deadline).getMonth() - new Date().getMonth()
             if (months <= 0) return null
             return { amount: Math.ceil((g.target_amount - g.saved_amount) / months), unit: 'month' }
})()
            return (
              <div key={g.id} style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: done ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{g.emoji || '🎯'}</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '16px', color: c.text }}>{g.name}</p>
                      {dl && <p style={{ fontSize: '12px', color: dl === 'Overdue' ? '#f87171' : c.textMuted, marginTop: '2px' }}>{dl}</p>}
                    {monthlyNeeded && <p style={{ fontSize: '12px', color: '#a78bfa', marginTop: '2px', fontWeight: 600 }}>💡 Save €{monthlyNeeded.amount}/{monthlyNeeded.unit} to reach goal</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(g)} style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${c.cardBorder}`, background: c.periodBg, color: c.textMuted, fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteGoal(g.id)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: '8px', borderRadius: '99px', background: c.periodBg, marginBottom: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: done ? 'linear-gradient(90deg,#34d399,#10b981)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.5s ease' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: c.textMuted }}>€{g.saved_amount.toLocaleString()} saved</span>
                  <span style={{ fontWeight: 700, color: done ? '#34d399' : c.text }}>{done ? '🎉 Reached!' : `${pct}% · €${remaining.toLocaleString()} to go`}</span>
                  <span style={{ color: c.textMuted }}>€{g.target_amount.toLocaleString()} goal</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}