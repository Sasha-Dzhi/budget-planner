import { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabase'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
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

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

const getColors = (dark) => dark ? {
  appBg: '#080810',
  sidebarBg: 'rgba(255,255,255,0.02)',
  sidebarBorder: 'rgba(255,255,255,0.06)',
  headerBg: 'rgba(8,8,16,0.9)',
  headerBorder: 'rgba(255,255,255,0.05)',
  cardBg: 'rgba(255,255,255,0.02)',
  cardBorder: 'rgba(255,255,255,0.06)',
  cardBgAlt: 'rgba(255,255,255,0.03)',
  cardBorderAlt: 'rgba(255,255,255,0.08)',
  rowHover: 'rgba(255,255,255,0.02)',
  inputBg: '#12121e',
  inputBorder: 'rgba(255,255,255,0.1)',
  inputText: '#fff',
  text: '#fff',
  textMuted: 'rgba(255,255,255,0.4)',
  textFaint: 'rgba(255,255,255,0.25)',
  textSubtle: 'rgba(255,255,255,0.3)',
  textNav: 'rgba(255,255,255,0.45)',
  divider: 'rgba(255,255,255,0.04)',
  dividerStrong: 'rgba(255,255,255,0.05)',
  navActive: 'rgba(99,102,241,0.15)',
  periodActive: 'rgba(99,102,241,0.2)',
  periodActiveBorder: 'rgba(99,102,241,0.4)',
  periodActiveColor: '#818cf8',
  periodBg: 'rgba(255,255,255,0.05)',
  periodColor: 'rgba(255,255,255,0.35)',
  iconBg: 'rgba(255,255,255,0.06)',
  statBg: 'rgba(255,255,255,0.03)',
  statBorder: 'rgba(255,255,255,0.08)',
  bottomNavBg: 'rgba(8,8,16,0.95)',
  bottomNavBorder: 'rgba(255,255,255,0.08)',
  tooltipBg: '#1e1b4b',
  toggleBg: 'rgba(255,255,255,0.06)',
  toggleColor: 'rgba(255,255,255,0.5)',
  deleteBtn: 'rgba(255,255,255,0.15)',
  miniStatBg: 'rgba(255,255,255,0.03)',
  logoutBg: 'rgba(248,113,113,0.08)',
  logoutBgHover: 'rgba(248,113,113,0.15)',
  formBg: 'rgba(255,255,255,0.03)',
  formBorder: 'rgba(255,255,255,0.08)',
} : {
  appBg: '#f5f5f7',
  sidebarBg: '#fff',
  sidebarBorder: 'rgba(0,0,0,0.07)',
  headerBg: 'rgba(245,245,247,0.9)',
  headerBorder: 'rgba(0,0,0,0.07)',
  cardBg: '#fff',
  cardBorder: 'rgba(0,0,0,0.07)',
  cardBgAlt: '#fff',
  cardBorderAlt: 'rgba(0,0,0,0.07)',
  rowHover: 'rgba(0,0,0,0.02)',
  inputBg: '#f5f5f7',
  inputBorder: 'rgba(0,0,0,0.1)',
  inputText: '#111',
  text: '#111',
  textMuted: 'rgba(0,0,0,0.45)',
  textFaint: 'rgba(0,0,0,0.3)',
  textSubtle: 'rgba(0,0,0,0.35)',
  textNav: 'rgba(0,0,0,0.5)',
  divider: 'rgba(0,0,0,0.05)',
  dividerStrong: 'rgba(0,0,0,0.06)',
  navActive: 'rgba(99,102,241,0.08)',
  periodActive: 'rgba(99,102,241,0.1)',
  periodActiveBorder: 'rgba(99,102,241,0.3)',
  periodActiveColor: '#6366f1',
  periodBg: 'rgba(0,0,0,0.04)',
  periodColor: 'rgba(0,0,0,0.4)',
  iconBg: 'rgba(0,0,0,0.05)',
  statBg: '#fff',
  statBorder: 'rgba(0,0,0,0.07)',
  bottomNavBg: 'rgba(255,255,255,0.95)',
  bottomNavBorder: 'rgba(0,0,0,0.08)',
  tooltipBg: '#fff',
  toggleBg: 'rgba(0,0,0,0.06)',
  toggleColor: 'rgba(0,0,0,0.5)',
  deleteBtn: 'rgba(0,0,0,0.15)',
  miniStatBg: 'rgba(0,0,0,0.03)',
  logoutBg: 'rgba(248,113,113,0.08)',
  logoutBgHover: 'rgba(248,113,113,0.15)',
  formBg: '#fff',
  formBorder: 'rgba(0,0,0,0.07)',
}

const relativeDate = (dateStr) => {
  const days = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return dateStr
}

const TopCategories = ({ filtered, c }) => {
  const expenseTotals = {}
  filtered.filter(t => t.type === 'expense').forEach(t => {
    expenseTotals[t.category] = (expenseTotals[t.category] || 0) + t.amount
  })
  const sortedExpenses = Object.entries(expenseTotals).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const maxExpense = sortedExpenses[0]?.[1] || 1

  const incomeTotals = {}
  filtered.filter(t => t.type === 'income').forEach(t => {
    incomeTotals[t.category] = (incomeTotals[t.category] || 0) + t.amount
  })
  const sortedIncome = Object.entries(incomeTotals).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const maxIncome = sortedIncome[0]?.[1] || 1

  if (sortedExpenses.length === 0 && sortedIncome.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sortedExpenses.length > 0 && (
        <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Top spending</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedExpenses.map(([cat, amount]) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', color: c.text }}>{CATEGORY_ICONS[cat]} {cat}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f87171' }}>€{amount.toFixed(2)}</span>
                </div>
                <div style={{ height: '5px', background: c.statBg, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(amount / maxExpense) * 100}%`, background: 'linear-gradient(90deg, #f87171, #f472b6)', borderRadius: '3px', transition: 'width .5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {sortedIncome.length > 0 && (
        <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Top income</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedIncome.map(([cat, amount]) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', color: c.text }}>{CATEGORY_ICONS[cat]} {cat}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#34d399' }}>€{amount.toFixed(2)}</span>
                </div>
                <div style={{ height: '5px', background: c.statBg, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(amount / maxIncome) * 100}%`, background: 'linear-gradient(90deg, #34d399, #10b981)', borderRadius: '3px', transition: 'width .5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const SpendingProgress = ({ filtered, c }) => {
  const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  if (income === 0) return null
  const pct = Math.min((expenses / income) * 100, 100).toFixed(0)
  const color = pct < 50 ? '#34d399' : pct < 80 ? '#fbbf24' : '#f87171'
  const label = pct < 50 ? '✅ Spending is under control' : pct < 80 ? '⚠️ Getting close' : '🔴 Spending most of income'
  return (
    <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Monthly budget used</p>
        <p style={{ fontSize: '12px', fontWeight: 700, color }}>{pct}%</p>
      </div>
      <div style={{ height: '8px', background: c.statBg, borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width .5s ease' }} />
      </div>
      <p style={{ fontSize: '11px', color: c.textFaint }}>{label} · €{expenses.toFixed(2)} of €{income.toFixed(2)}</p>
    </div>
  )
}

const AddForm = ({ type, setType, amount, setAmount, category, setCategory, categories, description, setDescription, date, setDate, onSubmit, c, darkMode }) => (
  <div style={{ background: c.formBg, border: `1px solid ${c.formBorder}`, borderRadius: '20px', padding: '20px' }}>
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
      {['expense', 'income'].map(t => (
        <button key={t} type="button" onClick={() => setType(t)} style={{
          flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          fontSize: '13px', fontWeight: 600, textTransform: 'capitalize', transition: 'all .15s',
          background: type === t ? (t === 'expense' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)') : c.periodBg,
          color: type === t ? (t === 'expense' ? '#f87171' : '#34d399') : c.textSubtle,
          outline: type === t ? (t === 'expense' ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(52,211,153,0.3)') : '1px solid transparent'
        }}>{t}</button>
      ))}
    </div>
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input type="number" placeholder="Amount (€)" value={amount}
        onChange={e => setAmount(e.target.value)} required min="0" step="0.01"
        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.inputText, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
      <select value={category} onChange={e => setCategory(e.target.value)}
        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.inputText, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}>
        {categories.map(cat => <option key={cat} value={cat} style={{ background: c.inputBg }}>{CATEGORY_ICONS[cat]} {cat}</option>)}
      </select>
      <input type="text" placeholder="Description (optional)" value={description}
        onChange={e => setDescription(e.target.value)}
        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.inputText, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.inputText, fontSize: '14px', outline: 'none', boxSizing: 'border-box', colorScheme: darkMode ? 'dark' : 'light' }} />
      <button type="submit" style={{
        padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer',
        fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff'
      }}>Save Transaction</button>
    </form>
  </div>
)
const MiniTrendChart = ({ transactions, c }) => {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('en-US', { month: 'short' })
    const income = transactions.filter(t => t.date.startsWith(key) && t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter(t => t.date.startsWith(key) && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    months.push({ label, income, expenses })
  }

  const hasData = months.some(m => m.income > 0 || m.expenses > 0)
  if (!hasData) return null

  return (
    <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '20px' }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>6-month trend</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={months} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.cardBorder}`, borderRadius: '12px', color: c.text, fontSize: '12px' }} formatter={(v) => `€${v.toFixed(2)}`} />
          <Line type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: '#34d399' }} name="Income" />
          <Line type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} dot={{ r: 3, fill: '#f87171' }} name="Expenses" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
export default function Dashboard({ session, darkMode, toggleDarkMode }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [period, setPeriod] = useState('this_month')
  const [txPage, setTxPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [filterType, setFilterType] = useState('all')
  const [filterCategories, setFilterCategories] = useState([])
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const isMobile = useIsMobile()
  const c = getColors(darkMode)

  const tooltipStyle = {
    backgroundColor: c.tooltipBg,
    border: `1px solid ${c.cardBorder}`,
    borderRadius: '12px',
    color: c.text,
    fontSize: '12px'
  }

  useEffect(() => { fetchTransactions() }, [])
  useEffect(() => { setCategory(type === 'income' ? 'Salary' : 'Food') }, [type])
  useEffect(() => { setTxPage(1) }, [period, page])

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
const txFiltered = filtered.filter(t => {
  if (filterType !== 'all' && t.type !== filterType) return false
  if (filterCategories.length > 0 && !filterCategories.includes(t.category)) return false
  if (filterFrom && t.date < filterFrom) return false
  if (filterTo && t.date > filterTo) return false
  return true
})
const isFiltered = filterType !== 'all' || filterCategories.length > 0 || filterFrom || filterTo
const totalTxPages = Math.ceil(txFiltered.length / PAGES_PER_VIEW)
const paginatedTx = txFiltered.slice((txPage - 1) * PAGES_PER_VIEW, txPage * PAGES_PER_VIEW)
  
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const currentPeriodLabel = PERIODS.find(p => p.key === period)?.label

  const navigateTo = (p) => { setPage(p); setShowForm(false) }

  const ThemeToggle = () => (
    <button onClick={toggleDarkMode} title="Toggle theme" style={{
      background: c.toggleBg, border: 'none', cursor: 'pointer', flexShrink: 0,
      borderRadius: '20px', padding: '6px 12px', fontSize: '12px',
      color: c.toggleColor, transition: 'all 0.2s', fontWeight: 500
    }}>
      {darkMode ? '☀️ Light' : '🌙 Dark'}
    </button>
  )

  const PeriodSelector = () => (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {PERIODS.map(p => (
        <button key={p.key} onClick={() => setPeriod(p.key)} style={{
          padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
          fontSize: '11px', fontWeight: 500, transition: 'all .15s',
          background: period === p.key ? c.periodActive : c.periodBg,
          color: period === p.key ? c.periodActiveColor : c.periodColor,
          outline: period === p.key ? `1px solid ${c.periodActiveBorder}` : '1px solid transparent'
        }}>{p.label}</button>
      ))}
    </div>
  )

  const StatCards = () => {
    const lastMonthRange = getPeriodRange('last_month')
    const lastMonth = transactions.filter(t => {
      const d = new Date(t.date)
      return d >= lastMonthRange.start && d <= lastMonthRange.end
    })
    const lastIncome = lastMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const lastExpenses = lastMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const lastBalance = lastIncome - lastExpenses

    const Trend = ({ current, previous, invert }) => {
      if (previous === 0 && current === 0) return null
      if (previous === 0) return null
      const diff = current - previous
      if (diff === 0) return null
      const pct = ((diff / previous) * 100).toFixed(0)
      const up = diff > 0
      const positive = invert ? !up : up
      return (
        <p style={{ fontSize: '11px', marginTop: '4px', color: positive ? '#34d399' : '#f87171' }}>
          {up ? '↑' : '↓'} {Math.abs(pct)}% vs last month
        </p>
      )
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px' }}>
        <div style={{ background: c.statBg, border: `1px solid ${c.statBorder}`, borderRadius: '16px', padding: isMobile ? '16px' : '20px' }}>
          <p style={{ fontSize: '10px', color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Balance</p>
          <p style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: balance >= 0 ? c.text : '#f87171', letterSpacing: '-1px' }}>€{balance.toFixed(2)}</p>
          <Trend current={balance} previous={lastBalance} invert={false} />
        </div>
        <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '16px', padding: isMobile ? '16px' : '20px' }}>
          <p style={{ fontSize: '10px', color: 'rgba(52,211,153,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Income</p>
          <p style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: '#34d399', letterSpacing: '-1px' }}>€{totalIncome.toFixed(2)}</p>
          <Trend current={totalIncome} previous={lastIncome} invert={false} />
        </div>
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '16px', padding: isMobile ? '16px' : '20px' }}>
          <p style={{ fontSize: '10px', color: 'rgba(248,113,113,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Expenses</p>
          <p style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: '#f87171', letterSpacing: '-1px' }}>€{totalExpenses.toFixed(2)}</p>
          <Trend current={totalExpenses} previous={lastExpenses} invert={true} />
        </div>
      </div>
    )
  }

  const TxRow = ({ t, last }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 16px', borderBottom: !last ? `1px solid ${c.divider}` : 'none', transition: 'background .15s'
    }}
      onMouseOver={e => e.currentTarget.style.background = c.rowHover}
      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
          {CATEGORY_ICONS[t.category] || '📌'}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '2px' }}>{t.category}</p>
          <p style={{ fontSize: '11px', color: c.textSubtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description && `${t.description} · `}{relativeDate(t.date)}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: t.type === 'income' ? '#34d399' : '#f87171' }}>
          {t.type === 'income' ? '+' : '-'}€{t.amount.toFixed(2)}
        </p>
        <button onClick={() => deleteTransaction(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.deleteBtn, fontSize: '18px', lineHeight: 1, padding: '0 2px', transition: 'color .15s' }}
          onMouseOver={e => e.target.style.color = '#f87171'}
          onMouseOut={e => e.target.style.color = c.deleteBtn}>×</button>
      </div>
    </div>
  )

  const EmptyState = () => (
    <div style={{ textAlign: 'center', padding: '48px 32px' }}>
      <p style={{ color: c.textFaint, fontSize: '14px', marginBottom: '6px' }}>No transactions for {currentPeriodLabel?.toLowerCase()}</p>
      <p style={{ color: c.textFaint, fontSize: '12px' }}>Switch period or add a transaction</p>
    </div>
  )

  const Pagination = () => {
  const changePage = (n) => {
  setTxPage(n)
  setTimeout(() => document.getElementById('pagination')?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100)
}

  return totalTxPages > 1 ? (
    <div id="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: `1px solid ${c.dividerStrong}`, flexWrap: 'wrap', gap: '8px' }}>
      <p style={{ fontSize: '11px', color: c.textFaint }}>
        {((txPage - 1) * PAGES_PER_VIEW) + 1}–{Math.min(txPage * PAGES_PER_VIEW, filtered.length)} of {filtered.length}
      </p>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button onClick={() => changePage(Math.max(1, txPage - 1))} disabled={txPage === 1} style={{
          padding: '6px 10px', borderRadius: '8px', border: `1px solid ${c.cardBorder}`,
          background: c.periodBg, color: txPage === 1 ? c.textFaint : c.textMuted,
          fontSize: '12px', cursor: txPage === 1 ? 'default' : 'pointer'
        }}>←</button>
        {Array.from({ length: totalTxPages }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => changePage(n)} style={{
            padding: '6px 10px', borderRadius: '8px', border: 'none', fontSize: '12px', cursor: 'pointer',
            fontWeight: n === txPage ? 700 : 400,
            background: n === txPage ? 'rgba(99,102,241,0.3)' : c.periodBg,
            color: n === txPage ? '#818cf8' : c.textMuted
          }}>{n}</button>
        ))}
        <button onClick={() => changePage(Math.min(totalTxPages, txPage + 1))} disabled={txPage === totalTxPages} style={{
          padding: '6px 10px', borderRadius: '8px', border: `1px solid ${c.cardBorder}`,
          background: c.periodBg, color: txPage === totalTxPages ? c.textFaint : c.textMuted,
          fontSize: '12px', cursor: txPage === totalTxPages ? 'default' : 'pointer'
        }}>→</button>
      </div>
    </div>
  ) : null
}

  const AddButton = () => (
    <button onClick={() => setShowForm(!showForm)} style={{
      width: '100%', padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
      fontSize: '14px', fontWeight: 600, transition: 'all .2s',
      background: showForm ? c.periodBg : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: showForm ? c.textMuted : '#fff'
    }}>{showForm ? 'Cancel' : '+ Add Transaction'}</button>
  )

  const BottomNav = () => (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: c.bottomNavBg, backdropFilter: 'blur(12px)',
      borderTop: `1px solid ${c.bottomNavBorder}`,
      display: 'flex', padding: '8px 0 max(8px, env(safe-area-inset-bottom))'
    }}>
      {NAV.map(n => (
        <button key={n.key} onClick={() => navigateTo(n.key)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
          background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px'
        }}>
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{n.icon}</span>
          <span style={{ fontSize: '10px', fontWeight: 500, color: page === n.key ? '#818cf8' : c.textNav }}>{n.label}</span>
        </button>
      ))}
      <button onClick={() => navigateTo('profile')} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
        background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px'
      }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>
          {session.user.email[0].toUpperCase()}
        </div>
        <span style={{ fontSize: '10px', fontWeight: 500, color: page === 'profile' ? '#818cf8' : c.textNav }}>Profile</span>
      </button>
    </div>
  )

  const SidebarContent = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', marginBottom: '20px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>💰</div>
        <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px', color: c.text }}>Budget</span>
      </div>
      <button onClick={() => navigateTo('profile')} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
        borderRadius: '14px', border: 'none', cursor: 'pointer', marginBottom: '20px', transition: 'all .15s', textAlign: 'left',
        background: page === 'profile' ? c.navActive : c.statBg,
        outline: page === 'profile' ? `1px solid ${c.periodActiveBorder}` : `1px solid ${c.cardBorder}`
      }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {session.user.email[0].toUpperCase()}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: page === 'profile' ? '#818cf8' : c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>My Profile</p>
          <p style={{ fontSize: '11px', color: c.textSubtle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user.email}</p>
        </div>
      </button>
      <p style={{ fontSize: '10px', color: c.textFaint, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 8px', marginBottom: '6px' }}>Menu</p>
      {NAV.map(n => (
        <button key={n.key} onClick={() => navigateTo(n.key)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px',
          borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '2px',
          transition: 'all .15s', textAlign: 'left',
          background: page === n.key ? c.navActive : 'transparent',
        }}
          onMouseOver={e => { if (page !== n.key) e.currentTarget.style.background = c.periodBg }}
          onMouseOut={e => { if (page !== n.key) e.currentTarget.style.background = 'transparent' }}>
          <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{n.icon}</span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: page === n.key ? '#818cf8' : c.textNav }}>{n.label}</span>
        </button>
      ))}
      <div style={{ marginTop: 'auto', borderTop: `1px solid ${c.dividerStrong}`, paddingTop: '16px' }}>
        <div style={{ padding: '4px 2px', marginBottom: '8px' }}>
          <ThemeToggle />
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{
          width: '100%', padding: '8px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          fontSize: '12px', fontWeight: 500, background: c.logoutBg, color: '#f87171', textAlign: 'left', transition: 'background .15s'
        }}
          onMouseOver={e => e.currentTarget.style.background = c.logoutBgHover}
          onMouseOut={e => e.currentTarget.style.background = c.logoutBg}>
          Log out
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.appBg, color: c.text, fontFamily: 'system-ui, sans-serif', transition: 'background 0.2s, color 0.2s' }}>

      {!isMobile && (
        <div style={{
          width: '220px', flexShrink: 0, background: c.sidebarBg,
          borderRight: `1px solid ${c.sidebarBorder}`, display: 'flex', flexDirection: 'column',
          padding: '20px 12px', position: 'sticky', top: 0, height: '100vh'
        }}>
          <SidebarContent />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{
          padding: isMobile ? '12px 16px' : '16px 32px',
          borderBottom: `1px solid ${c.headerBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          position: 'sticky', top: 0, zIndex: 30, background: c.headerBg, backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>💰</div>
                <span style={{ fontWeight: 700, fontSize: '14px', color: c.text }}>Budget</span>
              </div>
            )}
            {!isMobile && (
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: c.text, letterSpacing: '-0.5px' }}>
                {NAV.find(n => n.key === page)?.label || 'Profile'}
              </h1>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isMobile && <ThemeToggle />}
            {page !== 'settings' && (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <PeriodSelector />
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, padding: isMobile ? '16px 12px' : '32px', overflowY: 'auto', paddingBottom: isMobile ? '90px' : '32px' }}>

          {page === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <StatCards />
              <AddButton />
              {showForm && <AddForm type={type} setType={setType} amount={amount} setAmount={setAmount} category={category} setCategory={setCategory} categories={categories} description={description} setDescription={setDescription} date={date} setDate={setDate} onSubmit={addTransaction} c={c} darkMode={darkMode} />}
              <SpendingProgress filtered={filtered} c={c} />
              <MiniTrendChart transactions={transactions} c={c} />
              <TopCategories filtered={filtered} c={c} />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Recent · {currentPeriodLabel}</p>
                  <button onClick={() => navigateTo('transactions')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#818cf8', fontWeight: 500 }}>View all →</button>
                </div>
                <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', overflow: 'hidden' }}>
                  {loading && <p style={{ textAlign: 'center', color: c.textFaint, padding: '32px' }}>Loading...</p>}
                  {!loading && filtered.length === 0 && <EmptyState />}
                  {filtered.slice(0, 5).map((t, i) => (
                    <TxRow key={t.id} t={t} last={i === Math.min(4, filtered.length - 1)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {page === 'transactions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <StatCards />
              <AddButton />
              {showForm && <AddForm type={type} setType={setType} amount={amount} setAmount={setAmount} category={category} setCategory={setCategory} categories={categories} description={description} setDescription={setDescription} date={date} setDate={setDate} onSubmit={addTransaction} c={c} darkMode={darkMode} />}
              <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.dividerStrong}` }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showFilters ? '12px' : 0 }}>
    <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>All · {currentPeriodLabel}</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <p style={{ fontSize: '11px', color: c.textFaint }}>{txFiltered.length} total</p>
      <button onClick={() => setShowFilters(!showFilters)} style={{
        padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
        background: isFiltered ? 'rgba(99,102,241,0.2)' : c.periodBg,
        color: isFiltered ? '#818cf8' : c.textMuted,
        outline: isFiltered ? '1px solid rgba(99,102,241,0.4)' : 'none'
      }}>
        {isFiltered ? '🔵 Filters on' : '⚙️ Filter'}
      </button>
      {isFiltered && (
        <button onClick={() => { setFilterType('all'); setFilterCategories([]); setFilterFrom(''); setFilterTo('') }} style={{
          padding: '5px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px',
          background: 'rgba(248,113,113,0.1)', color: '#f87171'
        }}>Clear</button>
      )}
    </div>
  </div>

  {showFilters && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {['all', 'income', 'expense'].map(t => (
          <button key={t} onClick={() => { setFilterType(t); setTxPage(1) }} style={{
            padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize',
            background: filterType === t ? 'rgba(99,102,241,0.2)' : c.periodBg,
            color: filterType === t ? '#818cf8' : c.textMuted,
            outline: filterType === t ? '1px solid rgba(99,102,241,0.4)' : 'none'
          }}>{t === 'all' ? 'All types' : t}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
  {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].filter((v, i, a) => a.indexOf(v) === i).map(cat => (
    <button key={cat} onClick={() => {
      setFilterCategories(prev =>
        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
      )
      setTxPage(1)
    }} style={{
      padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
      background: filterCategories.includes(cat) ? 'rgba(99,102,241,0.2)' : c.periodBg,
      color: filterCategories.includes(cat) ? '#818cf8' : c.textMuted,
      outline: filterCategories.includes(cat) ? '1px solid rgba(99,102,241,0.4)' : 'none'
    }}>{CATEGORY_ICONS[cat]} {cat}</button>
  ))}
</div>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input type="date" value={filterFrom} onChange={e => { setFilterFrom(e.target.value); setTxPage(1) }}
  lang="en"
  style={{ padding: '6px 10px', borderRadius: '10px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.inputText, fontSize: '12px', outline: 'none', colorScheme: darkMode ? 'dark' : 'light' }} />
        <span style={{ color: c.textFaint, alignSelf: 'center', fontSize: '12px' }}>to</span>
        <input type="date" value={filterTo} onChange={e => { setFilterTo(e.target.value); setTxPage(1) }}
  lang="en"
  style={{ padding: '6px 10px', borderRadius: '10px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.inputText, fontSize: '12px', outline: 'none', colorScheme: darkMode ? 'dark' : 'light' }} />
      </div>
    </div>
  )}
</div>
                {filtered.length === 0 && <EmptyState />}
                {paginatedTx.map((t, i) => (
                  <TxRow key={t.id} t={t} last={i === paginatedTx.length - 1} />
                ))}
                <Pagination />
              </div>
            </div>
          )}

          {page === 'charts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filtered.length === 0 ? <EmptyState /> : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                    {[{ title: 'Expenses by category', data: expenseByCategory }, { title: 'Income by category', data: incomeByCategory }].map(({ title, data }) => (
                      <div key={title} style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '20px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>{title}</p>
                        {data.length === 0 ? (
                          <p style={{ textAlign: 'center', color: c.textFaint, padding: '32px 0', fontSize: '12px' }}>No data yet.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={data} cx="50%" cy="45%" outerRadius={65} dataKey="value">
                                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `€${v.toFixed(2)}`} />
                              <Legend wrapperStyle={{ fontSize: '11px', color: c.textMuted }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '20px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Monthly overview</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={monthlyData()} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `€${v.toFixed(2)}`} />
                        <Legend wrapperStyle={{ fontSize: '11px', color: c.textMuted }} />
                        <Bar dataKey="income" fill="#34d399" radius={[6, 6, 0, 0]} name="Income" />
                        <Bar dataKey="expenses" fill="#f87171" radius={[6, 6, 0, 0]} name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          )}

          {page === 'profile' && (
            <Profile session={session} transactions={transactions} filtered={filtered} period={period} currentPeriodLabel={currentPeriodLabel} darkMode={darkMode} />
          )}

          {page === 'settings' && (
            <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Account</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                    {session.user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: c.text }}>{session.user.email}</p>
                    <p style={{ fontSize: '12px', color: c.textSubtle }}>Free plan</p>
                  </div>
                </div>
                <div style={{ background: c.miniStatBg, borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', color: c.textMuted, marginBottom: '4px' }}>Email</p>
                  <p style={{ fontSize: '14px', color: c.text }}>{session.user.email}</p>
                </div>
                <div style={{ background: c.miniStatBg, borderRadius: '12px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '12px', color: c.textMuted, marginBottom: '4px' }}>Member since</p>
                  <p style={{ fontSize: '14px', color: c.text }}>{new Date(session.user.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Appearance</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: c.text, marginBottom: '2px' }}>Theme</p>
                    <p style={{ fontSize: '12px', color: c.textSubtle }}>{darkMode ? 'Dark mode' : 'Light mode'}</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
              <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Stats</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Total transactions', value: transactions.length },
                    { label: 'This period', value: filtered.length },
                    { label: 'Total income', value: `€${transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0).toFixed(2)}` },
                    { label: 'Total expenses', value: `€${transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toFixed(2)}` },
                  ].map(s => (
                    <div key={s.label} style={{ background: c.miniStatBg, borderRadius: '12px', padding: '14px 16px' }}>
                      <p style={{ fontSize: '11px', color: c.textSubtle, marginBottom: '6px' }}>{s.label}</p>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: c.text }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => supabase.auth.signOut()} style={{
                width: '100%', padding: '14px', borderRadius: '14px', cursor: 'pointer',
                border: '1px solid rgba(248,113,113,0.3)', background: c.logoutBg,
                color: '#f87171', fontSize: '14px', fontWeight: 600, transition: 'all .15s'
              }}
                onMouseOver={e => e.currentTarget.style.background = c.logoutBgHover}
                onMouseOut={e => e.currentTarget.style.background = c.logoutBg}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {isMobile && <BottomNav />}
    </div>
  )
}