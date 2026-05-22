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

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold text-gray-900">Budget Planner</h1>
            <nav className="flex gap-1">
              {['dashboard', 'transactions', 'charts'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors
                    ${activeTab === tab ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">{session.user.email}</span>
            <button onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors">Log out</button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Balance</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                  €{balance.toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Income</p>
                <p className="text-2xl font-bold text-emerald-600">€{totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Expenses</p>
                <p className="text-2xl font-bold text-red-500">€{totalExpenses.toFixed(2)}</p>
              </div>
            </div>

            <button onClick={() => setShowForm(!showForm)}
              className={`w-full py-3 rounded-xl font-medium transition-colors mb-6 ${showForm ? 'bg-gray-100 text-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
              {showForm ? 'Cancel' : '+ Add Transaction'}
            </button>

            {showForm && (
              <form onSubmit={addTransaction} className="bg-white rounded-2xl p-6 border border-gray-100 mb-6 space-y-4">
                <div className="flex gap-2">
                  {['expense', 'income'].map(t => (
                    <button key={t} type="button" onClick={() => setType(t)}
                      className={`flex-1 py-2.5 rounded-xl font-medium text-sm capitalize transition-colors
                        ${type === t
                          ? t === 'expense' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                          : 'bg-gray-100 text-gray-400'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <input type="number" placeholder="Amount (€)" value={amount}
                  onChange={e => setAmount(e.target.value)} required min="0" step="0.01"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800" />
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800">
                  {categories.map(c => (
  <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
))}
                </select>
                <input type="text" placeholder="Description (optional)" value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800" />
                <button type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                  Save Transaction
                </button>
              </form>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="font-semibold text-gray-800">Recent transactions</h2>
              </div>
              {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}
              {!loading && transactions.length === 0 && (
                <p className="text-center text-gray-400 py-8">No transactions yet. Add your first one!</p>
              )}
              {transactions.slice(0, 5).map(t => (
                <div key={t.id} className="px-5 py-4 flex justify-between items-center border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{CATEGORY_ICONS[t.category] || '📌'}</span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{t.category}</p>
                      <p className="text-xs text-gray-400">{t.description || t.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}€{t.amount.toFixed(2)}
                    </p>
                    <button onClick={() => deleteTransaction(t.id)}
                      className="text-gray-200 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-800">All transactions</h2>
            </div>
            {transactions.length === 0 && (
              <p className="text-center text-gray-400 py-8">No transactions yet.</p>
            )}
            {transactions.map(t => (
              <div key={t.id} className="px-5 py-4 flex justify-between items-center border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{CATEGORY_ICONS[t.category] || '📌'}</span>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{t.category}</p>
                    <p className="text-xs text-gray-400">{t.description && `${t.description} · `}{t.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}€{t.amount.toFixed(2)}
                  </p>
                  <button onClick={() => deleteTransaction(t.id)}
                    className="text-gray-200 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CHARTS TAB */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-400 py-16">Add some transactions to see your charts.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Expenses by category</h2>
                    {expenseByCategory.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-8">No expense data yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={expenseByCategory} cx="50%" cy="45%" outerRadius={75} dataKey="value">
                            {expenseByCategory.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => `€${v.toFixed(2)}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Income by category</h2>
                    {incomeByCategory.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-8">No income data yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={incomeByCategory} cx="50%" cy="45%" outerRadius={75} dataKey="value">
                            {incomeByCategory.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => `€${v.toFixed(2)}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h2 className="font-semibold text-gray-800 mb-4">Monthly overview</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyData()} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <Tooltip formatter={(v) => `€${v.toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                      <Bar dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} name="Expenses" />
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