import { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabase'
import Goals from './Goals'
import Charts from './Charts'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts'
import Profile from './Profile'
import {
  Home, LayoutDashboard, ArrowLeftRight, BarChart2, Target, Settings,
  Sun, Moon, Wallet, LogOut, Zap, SlidersHorizontal, User, Lock
} from 'lucide-react'


const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other']
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other']

const CATEGORY_ICONS = {
  Salary: '💼', Freelance: '💻', Business: '🏢', Investment: '📈', Gift: '🎁',
  Food: '🍽️', Transport: '🚗', Housing: '🏠', Entertainment: '🎬',
  Health: '❤️', Shopping: '🛍️', Education: '📚', Other: '📌'
}

const COLORS = ['#818cf8', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#f87171', '#2dd4bf']

const CATEGORY_COLORS = {
  Salary:        { bg: 'rgba(52,211,153,0.14)',  dot: '#34d399' },
  Freelance:     { bg: 'rgba(52,211,153,0.14)',  dot: '#34d399' },
  Business:      { bg: 'rgba(99,102,241,0.14)',  dot: '#818cf8' },
  Investment:    { bg: 'rgba(251,191,36,0.14)',  dot: '#fbbf24' },
  Gift:          { bg: 'rgba(244,114,182,0.14)', dot: '#f472b6' },
  Food:          { bg: 'rgba(251,146,60,0.14)',  dot: '#fb923c' },
  Transport:     { bg: 'rgba(96,165,250,0.14)',  dot: '#60a5fa' },
  Housing:       { bg: 'rgba(167,139,250,0.14)', dot: '#a78bfa' },
  Entertainment: { bg: 'rgba(244,114,182,0.14)', dot: '#f472b6' },
  Health:        { bg: 'rgba(248,113,113,0.14)', dot: '#f87171' },
  Shopping:      { bg: 'rgba(251,191,36,0.14)',  dot: '#fbbf24' },
  Education:     { bg: 'rgba(45,212,191,0.14)',  dot: '#2dd4bf' },
  Other:         { bg: 'rgba(148,163,184,0.14)', dot: '#94a3b8' },
}

const PERIODS = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_quarter', label: 'This quarter' },
  { key: 'this_year', label: 'This year' },
  { key: 'all_time', label: 'All time' },
]

const NAV = [
  { key: 'home', Icon: Home, label: 'Home' },
  { key: 'transactions', Icon: ArrowLeftRight, label: 'Transactions' },
  { key: 'charts', Icon: BarChart2, label: 'Insights' },
  { key: 'goals', Icon: Target, label: 'Goals' },
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
  cardBg: '#1a1b2e',
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
  cardShadow: 'none',
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
  cardShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
}

const relativeDate = (dateStr) => {
  const days = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return dateStr
}
const GoalsSummary = ({ c, session, navigateTo }) => {
  const [goals, setGoals] = useState([])
  useEffect(() => {
    supabase.from('goals').select('*').order('created_at').then(({ data }) => setGoals(data || []))
  }, [])
  if (goals.length === 0) return null
  return (
    <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Savings Goals</p>
        <button onClick={() => navigateTo('goals')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '12px', fontWeight: 600 }}>View all →</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {goals.slice(0, 3).map(g => {
          const pct = Math.min(100, Math.round((g.saved_amount / g.target_amount) * 100))
          const done = pct >= 100
          const daysRemaining = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null
          const tip = (() => {
            if (!g.deadline || done || daysRemaining <= 0) return null
            if (daysRemaining <= 30) return `€${Math.ceil((g.target_amount - g.saved_amount) / daysRemaining)}/day`
            const months = (new Date(g.deadline).getFullYear() - new Date().getFullYear()) * 12 + new Date(g.deadline).getMonth() - new Date().getMonth()
            if (months <= 0) return null
            return `€${Math.ceil((g.target_amount - g.saved_amount) / months)}/month`
          })()
          return (
            <div key={g.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{g.emoji || '🎯'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: c.text }}>{g.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: done ? '#34d399' : c.text }}>{done ? '🎉 Done!' : `${pct}%`}</span>
                  {tip && <p style={{ fontSize: '11px', color: '#a78bfa', margin: 0 }}>💡 Save {tip}</p>}
                </div>
              </div>
              <div style={{ height: '6px', borderRadius: '99px', background: c.periodBg, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: done ? 'linear-gradient(90deg,#34d399,#10b981)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
const TopSpending = ({ filtered, c }) => {
  const expenseTotals = {}
  filtered.filter(t => t.type === 'expense').forEach(t => {
    expenseTotals[t.category] = (expenseTotals[t.category] || 0) + t.amount
  })
  const sorted = Object.entries(expenseTotals).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const max = sorted[0]?.[1] || 1
  if (sorted.length === 0) return null
  return (
    <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '20px', flex: 1 }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Top spending</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sorted.map(([cat, amount]) => (
          <div key={cat}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '12px', color: c.text }}>{CATEGORY_ICONS[cat]} {cat}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#f87171' }}>€{amount.toFixed(2)}</span>
            </div>
            <div style={{ height: '4px', background: c.statBg, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(amount / max) * 100}%`, background: 'linear-gradient(90deg, #f87171, #f47266)', borderRadius: '3px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const TopIncome = ({ filtered, c }) => {
  const incomeTotals = {}
  filtered.filter(t => t.type === 'income').forEach(t => {
    incomeTotals[t.category] = (incomeTotals[t.category] || 0) + t.amount
  })
  const sorted = Object.entries(incomeTotals).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const max = sorted[0]?.[1] || 1
  if (sorted.length === 0) return null
  return (
    <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '20px', flex: 1 }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Top income</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sorted.map(([cat, amount]) => (
          <div key={cat}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '12px', color: c.text }}>{CATEGORY_ICONS[cat]} {cat}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#34d399' }}>€{amount.toFixed(2)}</span>
            </div>
            <div style={{ height: '4px', background: c.statBg, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(amount / max) * 100}%`, background: 'linear-gradient(90deg, #34d399, #10b981)', borderRadius: '3px' }} />
            </div>
          </div>
        ))}
      </div>
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
  const [page, setPage] = useState('home')
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
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [budgetMsg, setBudgetMsg] = useState('')
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
  const handleSaveBudget = async () => {
  await supabase.from('user_settings').upsert({ user_id: session.user.id, monthly_budget: parseFloat(monthlyBudget) })
  setBudgetMsg('✅ Budget saved!')
  setTimeout(() => setBudgetMsg(''), 2000)
}
const fetchUserSettings = async () => {
  const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', session.user.id).single()
  if (data) setMonthlyBudget(parseFloat(data.monthly_budget) || 0)
}
useEffect(() => { fetchUserSettings() }, [])
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

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const homeIncome = transactions.filter(t => t.type === 'income' && new Date(t.date) >= thisMonthStart).reduce((s, t) => s + t.amount, 0)
  const homeExpenses = transactions.filter(t => t.type === 'expense' && new Date(t.date) >= thisMonthStart).reduce((s, t) => s + t.amount, 0)
  const homeBalance = homeIncome - homeExpenses
  const spentToday = transactions.filter(t => t.type === 'expense' && new Date(t.date).toDateString() === now.toDateString()).reduce((s, t) => s + t.amount, 0)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const budgetLeftToday = parseFloat(monthlyBudget) > 0 ? Math.max(0, parseFloat(monthlyBudget) / daysInMonth - spentToday) : null
  const homeFiltered = useMemo(() => transactions.filter(t => new Date(t.date) >= thisMonthStart), [transactions])

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
    <button onClick={toggleDarkMode} title={darkMode ? 'Switch to light' : 'Switch to dark'} style={{
      background: c.toggleBg, border: `1px solid ${c.dividerStrong}`, cursor: 'pointer', flexShrink: 0,
      borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: c.toggleColor, transition: 'all 0.2s',
    }}>
      {darkMode ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
    </button>
  )

  const ToggleSwitch = ({ on }) => (
    <div style={{
      width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
      background: on ? '#6366f1' : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
      position: 'relative', transition: 'background .25s',
    }}>
      <div style={{
        position: 'absolute', top: '3px',
        left: on ? '19px' : '3px',
        width: '14px', height: '14px', borderRadius: '50%',
        background: '#fff', transition: 'left .25s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </div>
  )

  const PeriodSelector = () => (
    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
      {PERIODS.map(p => (
        <button key={p.key} onClick={() => setPeriod(p.key)} style={{
          padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', flexShrink: 0,
          fontSize: '13px', fontWeight: 600, transition: 'all .2s',
          background: period === p.key ? '#6366f1' : c.periodBg,
          color: period === p.key ? '#fff' : c.periodColor,
          boxShadow: period === p.key ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
        }}>{p.label}</button>
      ))}
    </div>
  )

  const StatCards = ({ period }) => {
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
          {period === 'this_month' && <Trend current={balance} previous={lastBalance} invert={false} />}
        </div>
        <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '16px', padding: isMobile ? '16px' : '20px' }}>
          <p style={{ fontSize: '10px', color: 'rgba(52,211,153,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Income</p>
          <p style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: '#34d399', letterSpacing: '-1px' }}>€{totalIncome.toFixed(2)}</p>
          {period === 'this_month' && <Trend current={totalIncome} previous={lastIncome} invert={false} />}
        </div>
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '16px', padding: isMobile ? '16px' : '20px' }}>
          <p style={{ fontSize: '10px', color: 'rgba(248,113,113,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Expenses</p>
          <p style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: '#f87171', letterSpacing: '-1px' }}>€{totalExpenses.toFixed(2)}</p>
          {period === 'this_month' && <Trend current={totalExpenses} previous={lastExpenses} invert={true} />}
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
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: CATEGORY_COLORS[t.category]?.bg || c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
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
        {((txPage - 1) * PAGES_PER_VIEW) + 1}–{Math.min(txPage * PAGES_PER_VIEW, txFiltered.length)} of {txFiltered.length}
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
const QuickAdd = ({ c, onSave }) => {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')

  const QUICK_EXPENSES = [
    { category: 'Food', emoji: '🍕' },
    { category: 'Transport', emoji: '🚗' },
    { category: 'Housing', emoji: '🏠' },
    { category: 'Shopping', emoji: '🛒' },
    { category: 'Entertainment', emoji: '🎬' },
    { category: 'Health', emoji: '❤️' },
    { category: 'Education', emoji: '📚' },
    { category: 'Other', emoji: '📦' },
  ]
  const QUICK_INCOME = [
    { category: 'Salary', emoji: '💼' },
    { category: 'Freelance', emoji: '💻' },
    { category: 'Investment', emoji: '📈' },
    { category: 'Gift', emoji: '🎁' },
    { category: 'Business', emoji: '🏢' },
    { category: 'Other', emoji: '📦' },
  ]

  const handleSave = async () => {
    if (!amount || !active) return
    await supabase.from('transactions').insert({
      type: active.type,
      category: active.category,
      amount: parseFloat(amount),
      description: desc,
      date: new Date().toISOString().slice(0, 10),
      user_id: (await supabase.auth.getUser()).data.user.id
    })
    setActive(null)
    setAmount('')
    setDesc('')
    setOpen(false)
    onSave()
  }

  const chipStyle = (item, type) => ({
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '7px 13px', borderRadius: '20px', fontSize: '12px',
    fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
    flexShrink: 0, transition: 'all 0.15s',
    outline: active?.category === item.category && active?.type === type ? '2px solid #6366f1' : 'none',
    outlineOffset: '1px',
    background: type === 'expense' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
    color: type === 'expense' ? '#f87171' : '#34d399',
  })

  return (
    <div>
      <button onClick={() => { setOpen(!open); setActive(null); setAmount(''); setDesc('') }} style={{
        width: '100%', padding: '9px 16px', borderRadius: '12px',
        border: `1px solid ${c.cardBorder}`, background: c.periodBg,
        color: c.textMuted, fontSize: '13px', fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '6px', transition: 'all 0.2s'
      }}>
        <Zap size={13} strokeWidth={2} /> Quick add
        <span style={{ fontSize: '11px', transition: 'transform 0.3s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>

      {open && (
        <div style={{ marginTop: '8px', background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          <div>
            <p style={{ fontSize: '11px', color: c.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>💸 Expenses</p>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {QUICK_EXPENSES.map(q => (
                <button key={q.category} onClick={() => setActive({ ...q, type: 'expense' })} style={chipStyle(q, 'expense')}>
                  {q.emoji} {q.category}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '11px', color: c.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>💰 Income</p>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {QUICK_INCOME.map(q => (
                <button key={q.category} onClick={() => setActive({ ...q, type: 'income' })} style={chipStyle(q, 'income')}>
                  {q.emoji} {q.category}
                </button>
              ))}
            </div>
          </div>

          {active && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', padding: '12px', borderRadius: '12px', background: c.periodBg, border: `1px solid ${c.cardBorder}` }}>
              <span style={{ fontSize: '20px' }}>{active.emoji}</span>
              <span style={{ fontSize: '13px', color: c.textMuted, flex: 1 }}>{active.category} · {active.type}</span>
              <input type="number" placeholder="Amount €" value={amount} onChange={e => setAmount(e.target.value)}
                autoFocus
                style={{ width: '110px', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${c.cardBorder}`, background: c.cardBg, color: c.text, fontSize: '13px' }} />
              <input placeholder="Note (optional)" value={desc} onChange={e => setDesc(e.target.value)}
                style={{ flex: 1, minWidth: '100px', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${c.cardBorder}`, background: c.cardBg, color: c.text, fontSize: '13px' }} />
              <button onClick={handleSave} style={{
                padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: active.type === 'income' ? 'linear-gradient(135deg,#34d399,#10b981)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', fontSize: '13px', fontWeight: 600
              }}>Save</button>
              <button onClick={() => setActive(null)} style={{ padding: '8px 10px', borderRadius: '10px', border: `1px solid ${c.cardBorder}`, background: 'transparent', color: c.textMuted, fontSize: '13px', cursor: 'pointer' }}>✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
  const AddButton = () => (
    <button onClick={() => setShowForm(!showForm)} style={{
      width: '100%', padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
      fontSize: '14px', fontWeight: 600, transition: 'all .2s',
      background: showForm ? c.periodBg : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: showForm ? c.textMuted : '#fff'
    }}>{showForm ? 'Cancel' : '+ Add Transaction'}</button>
  )

  const MOBILE_NAV = [
    ...NAV.filter(n => ['home', 'transactions', 'charts', 'goals'].includes(n.key)),
    { key: 'profile', Icon: User, label: 'You' }
  ]

  const BottomNav = () => (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: c.bottomNavBg, backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${c.bottomNavBorder}`,
      display: 'flex', padding: `10px 0 max(12px, env(safe-area-inset-bottom))`
    }}>
      {MOBILE_NAV.map(n => (
        <button key={n.key} onClick={() => navigateTo(n.key)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 4px',
          minHeight: '44px', justifyContent: 'center'
        }}>
          <n.Icon size={23} strokeWidth={page === n.key ? 2 : 1.6} color={page === n.key ? '#6366f1' : c.textNav} />
          <span style={{ fontSize: '10px', fontWeight: page === n.key ? 600 : 400, color: page === n.key ? '#6366f1' : c.textNav, letterSpacing: '0.1px' }}>{n.label}</span>
        </button>
      ))}
    </div>
  )

  const NAV_GROUPS = [
    { label: 'Overview', keys: ['home'] },
    { label: 'Money', keys: ['transactions', 'charts'] },
    { label: 'Planning', keys: ['goals'] },
  ]

  const SidebarContent = () => (
    <>
      {/* Logo row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '0 4px', marginBottom: '28px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wallet size={15} color="white" strokeWidth={2} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.4px', color: c.text }}>Vault</span>
      </div>

      {/* Profile card — shows name, email, live balance */}
      <button onClick={() => navigateTo('profile')} style={{
        width: '100%', display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '13px 12px',
        borderRadius: '16px', border: 'none', cursor: 'pointer', marginBottom: '28px',
        textAlign: 'left', transition: 'background .15s',
        background: page === 'profile' ? c.navActive : c.statBg,
        outline: page === 'profile' ? `1.5px solid ${c.periodActiveBorder}` : 'none'
      }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px', color: '#fff', flexShrink: 0 }}>
          {session.user.email[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: page === 'profile' ? '#6366f1' : c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {session.user.user_metadata?.name || session.user.email.split('@')[0]}
          </p>
          <p style={{ fontSize: '11px', color: c.textMuted, marginTop: '1px' }}>{now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
        </div>
        <p style={{ fontSize: '15px', fontWeight: 700, color: homeBalance >= 0 ? '#6366f1' : '#f87171', letterSpacing: '-0.5px', flexShrink: 0 }}>€{homeBalance.toFixed(0)}</p>
      </button>

      {/* Grouped navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? '16px' : 0 }}>
            <p style={{ fontSize: '10px', fontWeight: 600, color: c.textFaint, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 10px', marginBottom: '4px' }}>
              {group.label}
            </p>
            {NAV.filter(n => group.keys.includes(n.key)).map(n => (
              <button key={n.key} onClick={() => navigateTo(n.key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px',
                borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '1px',
                transition: 'all .15s', textAlign: 'left',
                background: page === n.key ? c.navActive : 'transparent',
              }}
                onMouseOver={e => { if (page !== n.key) e.currentTarget.style.background = c.periodBg }}
                onMouseOut={e => { if (page !== n.key) e.currentTarget.style.background = 'transparent' }}>
                <n.Icon size={16} strokeWidth={page === n.key ? 2.1 : 1.7} color={page === n.key ? '#6366f1' : c.textNav} />
                <span style={{ fontSize: '13px', fontWeight: page === n.key ? 600 : 500, color: page === n.key ? '#6366f1' : c.textNav }}>{n.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom — theme + logout */}
      <div style={{ borderTop: `1px solid ${c.dividerStrong}`, paddingTop: '14px', marginTop: '16px' }}>
        <button onClick={toggleDarkMode} style={{
          width: '100%', padding: '9px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          fontSize: '13px', fontWeight: 500, background: 'transparent', color: c.textNav,
          textAlign: 'left', transition: 'background .15s', display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '4px'
        }}
          onMouseOver={e => e.currentTarget.style.background = c.periodBg}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          {darkMode ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
          <span style={{ flex: 1 }}>{darkMode ? 'Light mode' : 'Dark mode'}</span>
          <ToggleSwitch on={darkMode} />
        </button>
        <button onClick={() => supabase.auth.signOut()} style={{
          width: '100%', padding: '9px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          fontSize: '13px', fontWeight: 500, background: c.logoutBg, color: '#f87171',
          textAlign: 'left', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '8px'
        }}
          onMouseOver={e => e.currentTarget.style.background = c.logoutBgHover}
          onMouseOut={e => e.currentTarget.style.background = c.logoutBg}>
          <LogOut size={14} strokeWidth={2} /> Log out
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.appBg, color: c.text, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif', transition: 'background 0.2s, color 0.2s' }}>

      {!isMobile && (
        <div style={{
          width: '248px', flexShrink: 0, background: c.sidebarBg,
          borderRight: `1px solid ${c.sidebarBorder}`, display: 'flex', flexDirection: 'column',
          padding: '24px 14px', position: 'sticky', top: 0, height: '100vh'
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
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wallet size={12} color="white" strokeWidth={2} /></div>
                <span style={{ fontWeight: 700, fontSize: '14px', color: c.text }}>Vault</span>
              </div>
            )}
           {!isMobile && (
  <h1 style={{ fontSize: '18px', fontWeight: 700, color: c.text, letterSpacing: '-0.5px' }}>
    {NAV.find(n => n.key === page)?.label || 'You'}
  </h1>
)}
            
          </div>
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ThemeToggle />
            </div>
          )}
        </div>

        <div key={page} className="page-enter" style={{ flex: 1, padding: isMobile ? '20px 16px' : '32px', overflowY: 'auto', paddingBottom: isMobile ? '100px' : '32px' }}>

          {page === 'home' && (() => {
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const userName = session.user.user_metadata?.name || session.user.email.split('@')[0]
  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const weekData = (() => {
    const dayLetters = ['S','M','T','W','T','F','S']
    return Array.from({length: 7}, (_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) + i)
      const dayStr = d.toDateString()
      const total = transactions.filter(t => t.type === 'expense' && new Date(t.date).toDateString() === dayStr).reduce((s,t) => s+t.amount, 0)
      return { letter: dayLetters[d.getDay()], total, isToday: dayStr === now.toDateString() }
    })
  })()
  const weekMax = Math.max(...weekData.map(d => d.total), 1)

  const allIncome = transactions.filter(t => t.type === 'income').reduce((s,t) => s+t.amount,0)
  const allExpense = transactions.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount,0)
  const savingsRate = allIncome > 0 ? ((allIncome - allExpense) / allIncome * 100).toFixed(0) : 0
  const badgeLabel = savingsRate > 50 ? 'Finance Pro' : savingsRate > 20 ? 'On Track' : 'Building Habits'

  const WeekChart = () => (
    <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '20px', boxShadow: c.cardShadow }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>This week</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px', borderBottom: `1px solid ${c.divider}`, marginBottom: '8px' }}>
        {weekData.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100px' }}>
            {d.total > 0 && <span style={{ fontSize: '8px', color: d.isToday ? '#f87171' : c.textMuted, marginBottom: '3px', fontWeight: 600 }}>€{Math.round(d.total)}</span>}
            <div style={{ width: '100%', background: d.isToday ? '#f87171' : (darkMode ? 'rgba(99,102,241,0.6)' : '#6366f1'), borderRadius: '5px 5px 0 0', height: `${d.total > 0 ? Math.max((d.total / weekMax) * 90, 6) : 0}px`, transition: 'height 0.4s ease' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        {weekData.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: d.isToday ? '#6366f1' : c.textMuted, fontWeight: d.isToday ? 700 : 400 }}>{d.letter}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const RecentList = () => (
    <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', overflow: 'hidden', boxShadow: c.cardShadow }}>
      <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Recent</p>
        <button onClick={() => navigateTo('transactions')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '12px', fontWeight: 600 }}>See all →</button>
      </div>
      {transactions.slice(0, 5).map((t, i) => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderTop: `1px solid ${c.divider}`, gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: CATEGORY_COLORS[t.category]?.bg || c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
              {CATEGORY_ICONS[t.category] || '📌'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.category}</p>
              <p style={{ fontSize: '11px', color: c.textMuted }}>{relativeDate(t.date)}</p>
            </div>
          </div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: t.type === 'income' ? '#34d399' : '#f87171', flexShrink: 0 }}>
            {t.type === 'income' ? '+' : '-'}€{t.amount.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  )

  if (isMobile) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: c.text, letterSpacing: '-0.3px' }}>{greeting}, {userName}</h2>
        <p style={{ fontSize: '13px', color: c.textMuted, marginTop: '2px' }}>{dateLabel}</p>
      </div>

      {/* Hero balance card */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)', borderRadius: '24px', padding: '28px 24px', color: '#fff', boxShadow: '0 8px 32px rgba(99,102,241,0.28)' }}>
        <p style={{ fontSize: '12px', fontWeight: 500, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>This month · Balance</p>
        <p style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, marginBottom: '24px' }}>€{homeBalance.toFixed(2)}</p>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.18)', paddingTop: '16px', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '11px', opacity: 0.55, marginBottom: '3px' }}>Income</p>
            <p style={{ fontSize: '18px', fontWeight: 700 }}>+€{homeIncome.toFixed(2)}</p>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.18)' }} />
          <div style={{ flex: 1, paddingLeft: '16px' }}>
            <p style={{ fontSize: '11px', opacity: 0.55, marginBottom: '3px' }}>Spent</p>
            <p style={{ fontSize: '18px', fontWeight: 700 }}>-€{homeExpenses.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Today stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '18px', boxShadow: c.cardShadow }}>
          <p style={{ fontSize: '11px', color: c.textMuted, marginBottom: '6px', letterSpacing: '0.3px' }}>Spent today</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: '#f87171', letterSpacing: '-1px' }}>€{spentToday.toFixed(2)}</p>
        </div>
        <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '18px', boxShadow: c.cardShadow }}>
          <p style={{ fontSize: '11px', color: c.textMuted, marginBottom: '6px', letterSpacing: '0.3px' }}>Budget left</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', letterSpacing: '-1px' }}>{budgetLeftToday !== null ? `€${budgetLeftToday.toFixed(2)}` : '—'}</p>
        </div>
      </div>

      <WeekChart />
      <RecentList />

      {/* Achievement + tip row */}
      <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: c.cardShadow }}>
        <span style={{ fontSize: '28px', flexShrink: 0 }}>{savingsRate > 50 ? '🚀' : '💪'}</span>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#6366f1', marginBottom: '2px' }}>{badgeLabel}</p>
          <p style={{ fontSize: '12px', color: c.textMuted }}>Savings rate {savingsRate}% · All time</p>
        </div>
      </div>

      <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '18px 20px', boxShadow: c.cardShadow }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Daily tip</p>
        <p style={{ fontSize: '13px', color: c.text, lineHeight: 1.6 }}>
          {['The 50/30/20 rule: 50% on needs, 30% on wants, save 20%.','Tracking spending is the first step to saving more.','An emergency fund of 3–6 months gives financial peace of mind.','Pay yourself first — save before you spend.','A €5 coffee every day is €1,825 a year.','Automate your savings so you never have to think about it.','Review subscriptions every 3 months — you probably pay for things you forgot.'][now.getDay()]}
        </p>
      </div>
      <SpendingProgress filtered={homeFiltered} c={c} />
      <TopSpending filtered={homeFiltered} c={c} />
      <TopIncome filtered={homeFiltered} c={c} />
      <GoalsSummary c={c} session={session} navigateTo={navigateTo} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Row 1 — Greeting */}
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: c.text, letterSpacing: '-0.5px', marginBottom: '6px' }}>
          {greeting}, {userName.split(' ')[0]} 👋
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '13px', color: c.textMuted }}>
            {now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px',
            fontSize: '12px', fontWeight: 600,
            background: savingsRate > 50 ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.1)',
            color: savingsRate > 50 ? '#f59e0b' : '#6366f1',
            border: `1px solid ${savingsRate > 50 ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.2)'}`,
          }}>
            {savingsRate > 50 ? '🚀' : '💪'} {badgeLabel} · {savingsRate}%
          </span>
        </div>
      </div>

      {/* Row 2 — 3 colour-coded stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '22px 24px', boxShadow: c.cardShadow }}>
          <p style={{ fontSize: '12px', color: c.textMuted, marginBottom: '10px', fontWeight: 500 }}>Balance</p>
          <p style={{ fontSize: '28px', fontWeight: 800, color: homeBalance >= 0 ? c.text : '#f87171', letterSpacing: '-1.5px' }}>€{homeBalance.toFixed(2)}</p>
        </div>
        <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '20px', padding: '22px 24px', boxShadow: c.cardShadow }}>
          <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.75)', marginBottom: '10px', fontWeight: 500 }}>Spent today</p>
          <p style={{ fontSize: '28px', fontWeight: 800, color: '#f87171', letterSpacing: '-1.5px' }}>€{spentToday.toFixed(2)}</p>
        </div>
        <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: '20px', padding: '22px 24px', boxShadow: c.cardShadow }}>
          <p style={{ fontSize: '12px', color: 'rgba(52,211,153,0.8)', marginBottom: '10px', fontWeight: 500 }}>Budget left</p>
          <p style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', letterSpacing: '-1.5px' }}>{budgetLeftToday !== null ? `€${budgetLeftToday.toFixed(2)}` : '—'}</p>
        </div>
      </div>

      {/* Row 3 — Spending progress */}
      <SpendingProgress filtered={homeFiltered} c={c} />

      {/* Row 4 — Week chart (left) + Recent (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', gap: '16px', alignItems: 'start' }}>
        <WeekChart />
        <RecentList />
      </div>

      {/* Row 5 — Top spending + income */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <TopSpending filtered={homeFiltered} c={c} />
        <TopIncome filtered={homeFiltered} c={c} />
      </div>

      {/* Row 6 — Goals */}
      <GoalsSummary c={c} session={session} navigateTo={navigateTo} />
    </div>
  )
})()}
          {page === 'transactions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PeriodSelector />
              <StatCards />
              <AddButton />
              <QuickAdd c={c} onSave={fetchTransactions} />
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
        <SlidersHorizontal size={12} strokeWidth={2} style={{ display: 'inline', marginRight: '4px' }} />{isFiltered ? 'Active' : 'Filter'}
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
  <Charts transactions={transactions} filtered={filtered} c={c} isMobile={isMobile} />
)}

          {page === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Profile session={session} transactions={transactions} filtered={homeFiltered} currentPeriodLabel="This month" darkMode={darkMode} isMobile={isMobile} />

              <p style={{ fontSize: '11px', fontWeight: 600, color: c.textFaint, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '8px 4px 0' }}>Settings</p>

              <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '24px', boxShadow: c.cardShadow }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Appearance</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: c.text, marginBottom: '2px' }}>Theme</p>
                    <p style={{ fontSize: '12px', color: c.textSubtle }}>{darkMode ? 'Dark mode' : 'Light mode'}</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>

              <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '24px', boxShadow: c.cardShadow }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Monthly Budget</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', color: c.text }}>€</span>
                  <input type="number" placeholder="e.g. 2000" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${c.cardBorder}`, background: c.miniStatBg, color: c.text, fontSize: '14px' }} />
                  <button onClick={handleSaveBudget} style={{ padding: '12px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '14px', fontWeight: 600 }}>Save</button>
                </div>
                {budgetMsg && <p style={{ fontSize: '13px', color: '#4ade80', marginTop: '10px' }}>{budgetMsg}</p>}
              </div>

              <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '24px', boxShadow: c.cardShadow }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Security</p>
                {!showPasswordForm ? (
                  <button onClick={() => setShowPasswordForm(true)} style={{ width: '100%', padding: '12px', borderRadius: '12px', cursor: 'pointer', border: `1px solid ${c.cardBorder}`, background: c.miniStatBg, color: c.text, fontSize: '14px', fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={14} strokeWidth={2} /> Change password
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: `1px solid ${c.cardBorder}`, background: c.miniStatBg, color: c.text, fontSize: '14px' }} />
                    <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: `1px solid ${c.cardBorder}`, background: c.miniStatBg, color: c.text, fontSize: '14px' }} />
                    <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: `1px solid ${c.cardBorder}`, background: c.miniStatBg, color: c.text, fontSize: '14px' }} />
                    {passwordMsg && <p style={{ fontSize: '13px', color: passwordMsg.includes('✅') ? '#4ade80' : '#f87171' }}>{passwordMsg}</p>}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={async () => {
                        if (!currentPassword) return setPasswordMsg('Enter your current password')
                        if (newPassword !== confirmPassword) return setPasswordMsg('Passwords do not match')
                        if (newPassword.length < 6) return setPasswordMsg('Minimum 6 characters')
                        const { error: signInError } = await supabase.auth.signInWithPassword({ email: session.user.email, password: currentPassword })
                        if (signInError) return setPasswordMsg('Current password is wrong')
                        const { error } = await supabase.auth.updateUser({ password: newPassword })
                        if (error) return setPasswordMsg(error.message)
                        setPasswordMsg('✅ Password updated!')
                        setTimeout(() => { setShowPasswordForm(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordMsg('') }, 2000)
                      }} style={{ flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '14px', fontWeight: 600 }}>Save</button>
                      <button onClick={() => { setShowPasswordForm(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordMsg('') }} style={{ flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer', border: `1px solid ${c.cardBorder}`, background: c.miniStatBg, color: c.text, fontSize: '14px', fontWeight: 600 }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => supabase.auth.signOut()} style={{ width: '100%', padding: '14px', borderRadius: '14px', cursor: 'pointer', border: '1px solid rgba(248,113,113,0.3)', background: c.logoutBg, color: '#f87171', fontSize: '14px', fontWeight: 600, transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onMouseOver={e => e.currentTarget.style.background = c.logoutBgHover}
                onMouseOut={e => e.currentTarget.style.background = c.logoutBg}>
                <LogOut size={15} strokeWidth={2} /> Log out
              </button>
            </div>
          )}
          {page === 'goals' && (
  <Goals session={session} c={c} isMobile={isMobile} />
)}
        </div>
      </div>

      {isMobile && <BottomNav />}
    </div>
  )
}