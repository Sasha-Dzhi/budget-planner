import { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabase'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import Profile from './Profile'

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other']
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other']

const CATEGORY_ICONS = {
  Salary: '💼', Freelance: '💻', Business: '🏢', Investment: '📈', Gift: '🎁',
  Food: '🍽️', Transport: '🚗', Housing: '🏠', Entertainment: '🎬',
  Health: '❤️', Shopping: '🛍️', Education: '📚', Other: '📌'
}

const COLORS = ['#818cf8', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#f87171', '#2dd4bf']

const PERIODS = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_quarter', label: 'This quarter' },
  { key: 'this_year', label: 'This year' },
  { key: 'all_time', label: 'All time' },
]

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'transactions', icon: '💸', label: 'Transactions' },
  { key: 'charts', icon: '📈', label: 'Charts' },
  { key: 'settings', icon: '⚙️', label: 'Settings' },
]

const PAGES_PER_VIEW = 10

const tooltipStyle = {
  backgroundColor: '#1e1b4b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '12px'
}

const getPeriodRange = (period) => {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (period) {
    case 'this_month': return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0) }
    case 'last_month': return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) }
    case 'this_quarter': { const q = Math.floor(m / 3); return { start: new Date(y, q * 3, 1), end: new Date(y, q * 3 + 3, 0) } }
    case 'this_year': return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) }
    default: return { start: new Date('2000-01-01'), end: new Date('2099-12-31') }
  }
}

// Responsive hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

const AddForm = ({ type, setType, amount, setAmount, category, setCategory, categories, description, setDescription, date, setDate, onSubmit }) => {
  const inputClass = "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['expense', 'income'].map(t => (
          <button key={t} type="button" onClick={() => setType(t)} style={{
            flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, textTransform: 'capitalize', transition: 'all .15s',
            background: type === t ? (t === 'expense' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)') : 'rgba(255,255,255,0.04)',
            color: type === t ? (t === 'expense' ? '#f87171' : '#34d399') : 'rgba(255,255,255,0.3)',
            outline: type === t ? (t === 'expense' ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(52,211,153,0.3)') : '1px solid transparent'
          }}>{t}</button>
        ))}
      </div>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input type="number" placeholder="Amount (€)" value={amount}
          onChange={e => setAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
        <select value={category} onChange={e => setCategory(e.target.value)}
          className={inputClass} style={{ background: '#12121e', color: '#fff' }}>
          {categories.map(c => <option key={c} value={c} style={{ background: '#12121e' }}>{CATEGORY_ICONS[c]} {c}</option>)}
        </select>
        <input type="text" placeholder="Description (optional)" value={description}
          onChange={e => setDescription(e.target.value)} className={inputClass} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className={inputClass} style={{ colorScheme: 'dark' }} />
        <button type="submit" style={{
          padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff'
        }}>Save Transaction</button>
      </form>
    </div>
  )
}

const TxRow = ({ t, last, onDelete }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 16px', borderBottom: !last ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background .15s'
  }}
    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
        {CATEGORY_ICONS[t.category] || '📌'}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{t.category}</p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description && `${t.description} · `}{t.date}</p>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: t.type === 'income' ? '#34d399' : '#f87171' }}>
        {t.type === 'income' ? '+' : '-'}€{t.amount.toFixed(2)}
      </p>
      <button onClick={() => onDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.15)', fontSize: '18px', lineHeight: 1, padding: '0 2px', transition: 'color .15s' }}
        onMouseOver={e => e.target.style.color = '#f87171'}
        onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.15)'}>×</button>
    </div>
  </div>
)

export default function Dashboard({ session }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [period, setPeriod] = useState('this_month')
  const [txPage, setTxPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const isMobile = useIsMobile()

  useEffect(() => { fetchTransactions() }, [])
  useEffect(() => { setCategory(type === 'income' ? 'Salary' : 'Food') }, [type])
  useEffect(() => { setTxPage(1) }, [period, page])

  // Close sidebar when switching to desktop
  useEffect(() => { if (!isMobile) setSidebarOpen(false) }, [isMobile])

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  const addTransaction = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('transactions').insert({
      user_id: session.user.id, type,
      amount: Math.round(parseFloat(amount) * 100) / 100,
      category, description, date
    })
    if (!error) { setAmount(''); setDescription(''); setShowForm(false); fetchTransactions() }
  }

  const deleteTransaction = async (id) => {
    await supabase.from('transactions').delete().eq('id', id)
    fetchTransactions()
  }

  const filtered = useMemo(() => {
    const { start, end } = getPeriodRange(period)
    return transactions.filter(t => { const d = new Date(t.date); return d >= start && d <= end })
  }, [transactions, period])

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpenses

  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
    name: cat, value: filtered.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0)
  })).filter(d => d.value > 0)

  const incomeByCategory = INCOME_CATEGORIES.map(cat => ({
    name: cat, value: filtered.filter(t => t.type === 'income' && t.category === cat).reduce((s, t) => s + t.amount, 0)
  })).filter(d => d.value > 0)

  const monthlyData = () => {
    const months = {}
    filtered.forEach(t => {
      const month = t.date.slice(0, 7)
      if (!months[month]) months[month] = { month, income: 0, expenses: 0 }
      if (t.type === 'income') months[month].income += t.amount
      else months[month].expenses += t.amount
    })
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
  }

  const totalTxPages = Math.ceil(filtered.length / PAGES_PER_VIEW)
  const paginatedTx = filtered.slice((txPage - 1) * PAGES_PER_VIEW, txPage * PAGES_PER_VIEW)
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const currentPeriodLabel = PERIODS.find(p => p.key === period)?.label

  const navigateTo = (p) => { setPage(p); setSidebarOpen(false); setShowForm(false) }

  const PeriodSelector = () => (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {PERIODS.map(p => (
        <button key={p.key} onClick={() => setPeriod(p.key)} style={{
          padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
          fontSize: '11px', fontWeight: 500, transition: 'all .15s',
          background: period === p.key ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
          color: period === p.key ? '#818cf8' : 'rgba(255,255,255,0.35)',
          outline: period === p.key ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent'
        }}>{p.label}</button>
      ))}
    </div>
  )

  // Responsive stat cards: 1 column on mobile, 3 on desktop
  const StatCards = () => (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: isMobile ? '16px' : '20px' }}>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Balance</p>
        <p style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: balance >= 0 ? '#fff' : '#f87171', letterSpacing: '-1px' }}>€{balance.toFixed(2)}</p>
      </div>
      <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '16px', padding: isMobile ? '16px' : '20px' }}>
        <p style={{ fontSize: '10px', color: 'rgba(52,211,153,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Income</p>
        <p style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: '#34d399', letterSpacing: '-1px' }}>€{totalIncome.toFixed(2)}</p>
      </div>
      <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '16px', padding: isMobile ? '16px' : '20px' }}>
        <p style={{ fontSize: '10px', color: 'rgba(248,113,113,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Expenses</p>
        <p style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: '#f87171', letterSpacing: '-1px' }}>€{totalExpenses.toFixed(2)}</p>
      </div>
    </div>
  )

  const EmptyState = () => (
    <div style={{ textAlign: 'center', padding: '48px 32px' }}>
      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', marginBottom: '6px' }}>No transactions for {currentPeriodLabel?.toLowerCase()}</p>
      <p style={{ color: 'rgba(255,255,255,0.1)', fontSize: '12px' }}>Switch period or add a transaction</p>
    </div>
  )

  const Pagination = () => totalTxPages > 1 ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '8px' }}>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
        {((txPage - 1) * PAGES_PER_VIEW) + 1}–{Math.min(txPage * PAGES_PER_VIEW, filtered.length)} of {filtered.length}
      </p>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1} style={{
          padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)', color: txPage === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
          fontSize: '12px', cursor: txPage === 1 ? 'default' : 'pointer'
        }}>← Prev</button>
        <button onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))} disabled={txPage === totalTxPages} style={{
          padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)', color: txPage === totalTxPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
          fontSize: '12px', cursor: txPage === totalTxPages ? 'default' : 'pointer'
        }}>Next →</button>
      </div>
    </div>
  ) : null

  const AddButton = () => (
    <button onClick={() => setShowForm(!showForm)} style={{
      width: '100%', padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
      fontSize: '14px', fontWeight: 600, transition: 'all .2s',
      background: showForm ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: showForm ? 'rgba(255,255,255,0.5)' : '#fff'
    }}>{showForm ? 'Cancel' : '+ Add Transaction'}</button>
  )

  // Mobile bottom nav
  const BottomNav = () => (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', padding: '8px 0 max(8px, env(safe-area-inset-bottom))'
    }}>
      {NAV.map(n => (
        <button key={n.key} onClick={() => navigateTo(n.key)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
          background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px'
        }}>
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{n.icon}</span>
          <span style={{ fontSize: '10px', fontWeight: 500, color: page === n.key ? '#818cf8' : 'rgba(255,255,255,0.3)' }}>{n.label}</span>
        </button>
      ))}
      <button onClick={() => navigateTo('profile')} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
        background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px'
      }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>
          {session.user.email[0].toUpperCase()}
        </div>
        <span style={{ fontSize: '10px', fontWeight: 500, color: page === 'profile' ? '#818cf8' : 'rgba(255,255,255,0.3)' }}>Profile</span>
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080810', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

      {/* Desktop Sidebar — hidden on mobile */}
      {!isMobile && (
        <div style={{
          width: '220px', flexShrink: 0, background: 'rgba(255,255,255,0.02)',
          borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column',
          padding: '20px 12px', position: 'sticky', top: 0, height: '100vh'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', marginBottom: '20px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>💰</div>
            <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px' }}>Budget</span>
          </div>

          <button onClick={() => navigateTo('profile')} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
            borderRadius: '14px', border: 'none', cursor: 'pointer', marginBottom: '20px', transition: 'all .15s', textAlign: 'left',
            background: page === 'profile' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
            outline: page === 'profile' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {session.user.email[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: page === 'profile' ? '#818cf8' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>My Profile</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user.email}</p>
            </div>
          </button>

          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 8px', marginBottom: '6px' }}>Menu</p>
          {NAV.map(n => (
            <button key={n.key} onClick={() => navigateTo(n.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px',
              borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '2px',
              transition: 'all .15s', textAlign: 'left',
              background: page === n.key ? 'rgba(99,102,241,0.15)' : 'transparent',
            }}
              onMouseOver={e => { if (page !== n.key) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseOut={e => { if (page !== n.key) e.currentTarget.style.background = 'transparent' }}>
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{n.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: page === n.key ? '#818cf8' : 'rgba(255,255,255,0.45)' }}>{n.label}</span>
            </button>
          ))}

          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', marginBottom: '4px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                {session.user.email[0].toUpperCase()}
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user.email}</p>
            </div>
            <button onClick={() => supabase.auth.signOut()} style={{
              width: '100%', padding: '8px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 500, background: 'rgba(248,113,113,0.08)', color: '#f87171', textAlign: 'left', transition: 'background .15s'
            }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(248,113,113,0.15)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}>
              Log out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top header */}
        <div style={{
          padding: isMobile ? '12px 16px' : '16px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          position: 'sticky', top: 0, zIndex: 30, background: 'rgba(8,8,16,0.9)', backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>💰</div>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Budget</span>
              </div>
            )}
            <h1 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
              {isMobile ? '' : (NAV.find(n => n.key === page)?.label || 'Profile')}
            </h1>
          </div>
          {page !== 'settings' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <PeriodSelector />
            </div>
          )}
        </div>

        {/* Page content */}
        <div style={{
          flex: 1, padding: isMobile ? '16px 12px' : '32px',
          overflowY: 'auto',
          paddingBottom: isMobile ? '90px' : '32px' // space for bottom nav on mobile
        }}>

          {/* DASHBOARD */}
          {page === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <StatCards />
              <AddButton />
              {showForm && (
                <AddForm
                  type={type} setType={setType}
                  amount={amount} setAmount={setAmount}
                  category={category} setCategory={setCategory}
                  categories={categories}
                  description={description} setDescription={setDescription}
                  date={date} setDate={setDate}
                  onSubmit={addTransaction}
                />
              )}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Recent · {currentPeriodLabel}
                  </p>
                  <button onClick={() => navigateTo('transactions')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#818cf8', fontWeight: 500 }}>
                    View all →
                  </button>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
                  {loading && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '32px' }}>Loading...</p>}
                  {!loading && filtered.length === 0 && <EmptyState />}
                  {filtered.slice(0, 5).map((t, i) => (
                    <TxRow key={t.id} t={t} last={i === Math.min(4, filtered.length - 1)} onDelete={deleteTransaction} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TRANSACTIONS */}
          {page === 'transactions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <StatCards />
              <AddButton />
              {showForm && (
                <AddForm
                  type={type} setType={setType}
                  amount={amount} setAmount={setAmount}
                  category={category} setCategory={setCategory}
                  categories={categories}
                  description={description} setDescription={setDescription}
                  date={date} setDate={setDate}
                  onSubmit={addTransaction}
                />
              )}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    All · {currentPeriodLabel}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{filtered.length} total</p>
                </div>
                {filtered.length === 0 && <EmptyState />}
                {paginatedTx.map((t, i) => (
                  <TxRow key={t.id} t={t} last={i === paginatedTx.length - 1} onDelete={deleteTransaction} />
                ))}
                <Pagination />
              </div>
            </div>
          )}

          {/* CHARTS */}
          {page === 'charts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filtered.length === 0 ? <EmptyState /> : (
                <>
                  {/* Pie charts: stacked on mobile, side by side on desktop */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                    {[{ title: 'Expenses by category', data: expenseByCategory }, { title: 'Income by category', data: incomeByCategory }].map(({ title, data }) => (
                      <div key={title} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '20px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>{title}</p>
                        {data.length === 0 ? (
                          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '32px 0', fontSize: '12px' }}>No data yet.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={data} cx="50%" cy="45%" outerRadius={65} dataKey="value">
                                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `€${v.toFixed(2)}`} />
                              <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '20px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Monthly overview</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={monthlyData()} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `€${v.toFixed(2)}`} />
                        <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
                        <Bar dataKey="income" fill="#34d399" radius={[6, 6, 0, 0]} name="Income" />
                        <Bar dataKey="expenses" fill="#f87171" radius={[6, 6, 0, 0]} name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          )}

          {/* PROFILE */}
          {page === 'profile' && (
            <Profile session={session} transactions={transactions} filtered={filtered} period={period} currentPeriodLabel={currentPeriodLabel} />
          )}

          {/* SETTINGS */}
          {page === 'settings' && (
            <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Account</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 }}>
                    {session.user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{session.user.email}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Free plan</p>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Email</p>
                  <p style={{ fontSize: '14px', color: '#fff' }}>{session.user.email}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Member since</p>
                  <p style={{ fontSize: '14px', color: '#fff' }}>{new Date(session.user.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Stats</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Total transactions', value: transactions.length },
                    { label: 'This period', value: filtered.length },
                    { label: 'Total income', value: `€${transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0).toFixed(2)}` },
                    { label: 'Total expenses', value: `€${transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toFixed(2)}` },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px 16px' }}>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>{s.label}</p>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => supabase.auth.signOut()} style={{
                width: '100%', padding: '14px', borderRadius: '14px', cursor: 'pointer',
                border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)',
                color: '#f87171', fontSize: '14px', fontWeight: 600, transition: 'all .15s'
              }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(248,113,113,0.15)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom navigation */}
      {isMobile && <BottomNav />}
    </div>
  )
}