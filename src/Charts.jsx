import { useMemo, useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

const COLORS = ['#6366f1','#f87171','#fbbf24','#a78bfa','#34d399','#60a5fa','#f472b6','#2dd4bf']

const getLast6Months = (transactions) => {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('default', { month: 'short' })
    const income = transactions.filter(t => t.date.startsWith(key) && t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter(t => t.date.startsWith(key) && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const balance = income - expenses
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0
    months.push({ label, key, income, expenses, balance, savingsRate })
  }
  return months
}

const getDailySpending = (transactions, year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let i = 1; i <= daysInMonth; i++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const amount = transactions.filter(t => t.date === key && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    days.push({ day: i, amount })
  }
  return days
}

const getHeatmapColor = (amount, max) => {
  if (amount === 0) return null
  const pct = amount / max
  if (pct < 0.25) return '#c4b5fd'
  if (pct < 0.5) return '#8b5cf6'
  if (pct < 0.75) return '#6366f1'
  return '#4f46e5'
}

export default function Charts({ transactions, filtered, c, isMobile }) {
  const months = useMemo(() => getLast6Months(transactions), [transactions])
  const [heatmapDate, setHeatmapDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() })
  const dailySpending = useMemo(() => getDailySpending(transactions, heatmapDate.year, heatmapDate.month), [transactions, heatmapDate])
  const maxDaily = useMemo(() => Math.max(...dailySpending.map(d => d.amount), 1), [dailySpending])

  const heatmapMonthLabel = new Date(heatmapDate.year, heatmapDate.month).toLocaleString('default', { month: 'long', year: 'numeric' })
  const prevHeatmapMonth = () => setHeatmapDate(d => {
    const m = d.month === 0 ? 11 : d.month - 1
    const y = d.month === 0 ? d.year - 1 : d.year
    return { year: y, month: m }
  })
  const nextHeatmapMonth = () => {
    const now = new Date()
    setHeatmapDate(d => {
      if (d.year === now.getFullYear() && d.month === now.getMonth()) return d
      const m = d.month === 11 ? 0 : d.month + 1
      const y = d.month === 11 ? d.year + 1 : d.year
      return { year: y, month: m }
    })
  }

  const expenseByCategory = useMemo(() => {
    const totals = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount
    })
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [transactions])

  const totalExpenses = expenseByCategory.reduce((s, c) => s + c.value, 0)
  const [animatedData, setAnimatedData] = useState(expenseByCategory)

  useEffect(() => {
    const t1 = setTimeout(() => setAnimatedData(expenseByCategory), 50)
    return () => clearTimeout(t1)
  }, [expenseByCategory])

  const netWorth = useMemo(() => {
    let running = 0
    return months.map(m => {
      running += m.balance
      return { label: m.label, balance: Math.round(running) }
    })
  }, [months])

  const waterfall = useMemo(() => {
    const totalIncome = months.reduce((s, m) => s + m.income, 0)
    const catTotals = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount
    })
    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const bars = []
    bars.push({ name: 'Income', value: Math.round(totalIncome), display: Math.round(totalIncome), invisible: 0, color: '#34d399' })
    let running = totalIncome
    sorted.forEach(([name, val]) => {
      const roundedVal = Math.round(val)
      running -= val
      bars.push({ name, value: roundedVal, display: roundedVal, invisible: Math.round(running), color: '#f87171' })
    })
    bars.push({ name: 'Balance', value: Math.round(running), display: Math.round(running), invisible: 0, color: '#6366f1' })
    return bars
  }, [transactions, months])

  const tooltipStyle = { backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '12px', color: c.text, fontSize: '12px' }

  const SectionDivider = ({ label, tag, tagColor, tagBg }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{label}</p>
      <div style={{ flex: 1, height: '0.5px', background: c.cardBorder }} />
      <span style={{ fontSize: '10px', padding: '2px 10px', borderRadius: '20px', background: tagBg, color: tagColor, fontWeight: 600, whiteSpace: 'nowrap' }}>{tag}</span>
    </div>
  )

  const CardTitle = ({ title }) => (
    <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>{title}</p>
  )

  const Card = ({ children, half }) => (
    <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '20px', padding: '20px', flex: half ? 1 : 'unset' }}>
      {children}
    </div>
  )

  if (transactions.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: c.textMuted, flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '40px' }}>📊</p>
      <p>Add some transactions to see your charts</p>
    </div>
  )

  return (
    <div style={{ padding: isMobile ? '16px' : '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: c.text, marginBottom: '4px' }}>Charts</h1>

      {/* SECTION 1 — OVERVIEW */}
      <SectionDivider label="Overview" tag="All time" tagColor="#818cf8" tagBg="rgba(99,102,241,0.1)" />

      <div style={{ display: 'flex', gap: '16px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <Card half>
          <CardTitle title="Spending breakdown" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ width: '150px', height: '150px', flexShrink: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={animatedData.slice(0, 5)} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" isAnimationActive={true} animationBegin={0} animationDuration={1600}>
                    {animatedData.slice(0, 5).map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={v => `€${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <p style={{ fontSize: '10px', color: c.textMuted, marginBottom: '2px' }}>Total</p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: c.text }}>€{totalExpenses.toFixed(0)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {animatedData.slice(0, 5).map((cat, i) => (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ color: c.textMuted }}>{cat.name}</span>
                  <span style={{ color: c.text, fontWeight: 600, marginLeft: 'auto' }}>{Math.round(cat.value / totalExpenses * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card half>
          <CardTitle title="Savings rate" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#34d399' }}>
              {Math.round(months.reduce((s, m) => s + m.savingsRate, 0) / months.filter(m => m.income > 0).length || 0)}%
            </span>
            <span style={{ fontSize: '12px', color: c.textMuted }}>avg last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={months}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} tickFormatter={v => v + '%'} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => v + '%'} />
              <Line type="monotone" dataKey="savingsRate" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: '#34d399' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* SECTION 2 — TRENDS */}
      <SectionDivider label="Trends" tag="Last 6 months" tagColor="#34d399" tagBg="rgba(52,211,153,0.1)" />

      <Card>
        <CardTitle title="Income vs expenses" />
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: c.textMuted }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#34d399' }} />Income</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: c.textMuted }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f87171' }} />Expenses</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={months}>
            <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} tickFormatter={v => '€' + v} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => `€${v.toFixed(2)}`} />
            <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} name="Income" />
            <Bar dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <CardTitle title="Net worth over time" />
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={netWorth}>
            <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} tickFormatter={v => '€' + v} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => `€${v}`} />
            <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <CardTitle title="Category trends" />
        {['Food','Transport','Housing','Shopping','Entertainment','Health','Education'].map((cat, catIdx) => {
          const catData = months.map(m => ({
            label: m.label,
            amount: transactions.filter(t => t.date.startsWith(m.key) && t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0)
          }))
          const hasData = catData.some(d => d.amount > 0)
          if (!hasData) return null
          return (
            <div key={cat} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: COLORS[catIdx % COLORS.length], minWidth: '90px', paddingTop: '8px', textAlign: 'right' }}>{cat}</p>
                <div style={{ flex: 1 }}>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={catData}>
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} tickFormatter={v => '€' + v} width={40} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => `€${v.toFixed(2)}`} />
                      <Line type="monotone" dataKey="amount" stroke={COLORS[catIdx % COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: COLORS[catIdx % COLORS.length] }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )
        })}
      </Card>

      <Card>
        <CardTitle title="Cash flow waterfall" />
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: c.textMuted }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#34d399' }} />Income</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: c.textMuted }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f87171' }} />Expenses</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: c.textMuted }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#6366f1' }} />Balance</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={waterfall} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: c.textSubtle }} axisLine={false} tickLine={false} tickFormatter={v => '€' + v} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value, name, props) => { if (name === 'invisible') return null; return [`€${props.payload.value}`, props.payload.name] }} />
            <Bar dataKey="invisible" stackId="a" fill="transparent" />
            <Bar dataKey="display" stackId="a" radius={[4, 4, 0, 0]}>
              {waterfall.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* SECTION 3 — DAILY DETAIL */}
      <SectionDivider label="Daily detail" tag="Current month" tagColor="#fbbf24" tagBg="rgba(251,191,36,0.1)" />

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Daily spending heatmap</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={prevHeatmapMonth} style={{ background: c.periodBg, border: `1px solid ${c.cardBorder}`, borderRadius: '8px', padding: '4px 10px', color: c.textMuted, cursor: 'pointer', fontSize: '14px' }}>←</button>
            <span style={{ fontSize: '12px', fontWeight: 600, color: c.text, minWidth: '100px', textAlign: 'center' }}>{heatmapMonthLabel}</span>
            <button onClick={nextHeatmapMonth} style={{ background: c.periodBg, border: `1px solid ${c.cardBorder}`, borderRadius: '8px', padding: '4px 10px', color: c.textMuted, cursor: 'pointer', fontSize: '14px' }}>→</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
          {dailySpending.map(({ day, amount }) => (
            <div key={day} title={`Day ${day}: €${amount.toFixed(2)}`} style={{
              width: '28px', height: '28px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: amount === 0 ? c.periodBg : getHeatmapColor(amount, maxDaily),
              color: amount === 0 ? c.textFaint : '#fff', border: `1px solid ${c.cardBorder}`, cursor: 'default'
            }}>{day}</div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: c.textMuted }}>
          <span>Less</span>
          {['#c4b5fd','#8b5cf6','#6366f1','#4f46e5'].map(col => (
            <span key={col} style={{ width: '12px', height: '12px', borderRadius: '3px', background: col }} />
          ))}
          <span>More</span>
        </div>
      </Card>

    </div>
  )
}