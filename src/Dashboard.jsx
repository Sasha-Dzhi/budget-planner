import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other']
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other']

const CATEGORY_ICONS = {
  Salary: '💼', Freelance: '💻', Business: '🏢', Investment: '📈', Gift: '🎁',
  Food: '🍽️', Transport: '🚗', Housing: '🏠', Entertainment: '🎬',
  Health: '❤️', Shopping: '🛍️', Education: '📚', Other: '📌'
}

const COLORS = ['#818cf8', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#f87171', '#2dd4bf']

export default function Dashboard({ session }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => { fetchTransactions() }, [])
  useEffect(() => {
    setCategory(type === 'income' ? 'Salary' : 'Food')
  }, [type])

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  const addTransaction = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('transactions').insert({
      user_id: session.user.id,
      type, amount: parseFloat(amount), category, description, date
    })
    if (!error) {
      setAmount(''); setDescription(''); setShowForm(false)
      fetchTransactions()
    }
  }

  const deleteTransaction = async (id) => {
    await supabase.from('transactions').delete().eq('id', id)
    fetchTransactions()
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpenses

  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
    name: cat,
    value: transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0)
  })).filter(d => d.value > 0)

  const incomeByCategory = INCOME_CATEGORIES.map(cat => ({
    name: cat,
    value: transactions.filter(t => t.type === 'income' && t.category === cat).reduce((s, t) => s + t.amount, 0)
  })).filter(d => d.value > 0)

  const monthlyData = () => {
    const months = {}
    transactions.forEach(t => {
      const month = t.date.slice(0, 7)
      if (!months[month]) months[month] = { month, income: 0, expenses: 0 }
      if (t.type === 'income') months[month].income += t.amount
      else months[month].expenses += t.amount
    })
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)
  }

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const inputClass = "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
  const tooltipStyle = { backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>💰</div>
              <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px' }}>Budget</span>
            </div>
            <nav style={{ display: 'flex', gap: '4px' }}>
              {['dashboard', 'transactions', 'charts'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                  background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
                  transition: 'all .15s', textTransform: 'capitalize'
                }}>{tab}</button>
              ))}
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{session.user.email}</span>
            <button onClick={() => supabase.auth.signOut()} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color .15s' }}
              onMouseOver={e => e.target.style.color = '#f87171'} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>
              Log out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Hero balance */}
            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Total Balance</p>
              <p style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: balance >= 0 ? '#fff' : '#f87171' }}>
                €{balance.toFixed(2)}
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} total
              </p>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '16px', padding: '20px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(52,211,153,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Income</p>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#34d399', letterSpacing: '-1px' }}>€{totalIncome.toFixed(2)}</p>
              </div>
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '16px', padding: '20px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Expenses</p>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#f87171', letterSpacing: '-1px' }}>€{totalExpenses.toFixed(2)}</p>
              </div>
            </div>

            {/* Add button */}
            <button onClick={() => setShowForm(!showForm)} style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              background: showForm ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: showForm ? 'rgba(255,255,255,0.5)' : '#fff', marginBottom: '20px', transition: 'all .2s',
              letterSpacing: '-0.2px'
            }}>
              {showForm ? 'Cancel' : '+ Add Transaction'}
            </button>

            {/* Form */}
            {showForm && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {['expense', 'income'].map(t => (
                    <button key={t} type="button" onClick={() => setType(t)} style={{
                      flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize', transition: 'all .15s',
                      background: type === t ? (t === 'expense' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)') : 'rgba(255,255,255,0.04)',
                      color: type === t ? (t === 'expense' ? '#f87171' : '#34d399') : 'rgba(255,255,255,0.3)',
                      border: type === t ? (t === 'expense' ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(52,211,153,0.3)') : '1px solid transparent'
                    }}>{t}</button>
                  ))}
                </div>
                <form onSubmit={addTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="number" placeholder="Amount (€)" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
                  <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass} style={{ background: '#12121e', color: '#fff' }}>
                    {categories.map(c => <option key={c} value={c} style={{ background: '#12121e' }}>{CATEGORY_ICONS[c]} {c}</option>)}
                  </select>
                  <input type="text" placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} className={inputClass} />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} style={{ colorScheme: 'dark' }} />
                  <button type="submit" style={{
                    padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff'
                  }}>Save Transaction</button>
                </form>
              </div>
            )}

            {/* Recent transactions */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Recent transactions</p>
              </div>
              {loading && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '32px' }}>Loading...</p>}
              {!loading && transactions.length === 0 && (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '48px 32px' }}>No transactions yet. Add your first one!</p>
              )}
              {transactions.slice(0, 5).map((t, i) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background .15s', cursor: 'default'
                }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                      {CATEGORY_ICONS[t.category] || '📌'}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{t.category}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{t.description || t.date}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: t.type === 'income' ? '#34d399' : '#f87171' }}>
                      {t.type === 'income' ? '+' : '-'}€{t.amount.toFixed(2)}
                    </p>
                    <button onClick={() => deleteTransaction(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.15)', fontSize: '18px', lineHeight: 1, padding: '0 4px', transition: 'color .15s' }}
                      onMouseOver={e => e.target.style.color = '#f87171'} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.15)'}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>All transactions</p>
            </div>
            {transactions.length === 0 && (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '48px' }}>No transactions yet.</p>
            )}
            {transactions.map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderBottom: i < transactions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background .15s'
              }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                    {CATEGORY_ICONS[t.category] || '📌'}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{t.category}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{t.description && `${t.description} · `}{t.date}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: t.type === 'income' ? '#34d399' : '#f87171' }}>
                    {t.type === 'income' ? '+' : '-'}€{t.amount.toFixed(2)}
                  </p>
                  <button onClick={() => deleteTransaction(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.15)', fontSize: '18px', lineHeight: 1, padding: '0 4px', transition: 'color .15s' }}
                    onMouseOver={e => e.target.style.color = '#f87171'} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.15)'}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CHARTS TAB */}
        {activeTab === 'charts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {transactions.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '64px' }}>Add some transactions to see your charts.</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[{ title: 'Expenses by category', data: expenseByCategory }, { title: 'Income by category', data: incomeByCategory }].map(({ title, data }) => (
                    <div key={title} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '20px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>{title}</p>
                      {data.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '32px 0', fontSize: '12px' }}>No data yet.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={data} cx="50%" cy="45%" outerRadius={70} dataKey="value">
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
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>Monthly overview</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthlyData()} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
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
      </div>
    </div>
  )
}