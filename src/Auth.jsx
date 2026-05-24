import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth({ darkMode, toggleDarkMode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [isForgot, setIsForgot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('neutral')

  const c = darkMode ? {
    bg: '#080810',
    card: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.08)',
    title: '#fff',
    subtitle: 'rgba(255,255,255,0.35)',
    inputBg: 'rgba(255,255,255,0.05)',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputText: '#fff',
    inputPlaceholder: 'rgba(255,255,255,0.2)',
    mutedText: 'rgba(255,255,255,0.3)',
    toggleBg: 'rgba(255,255,255,0.06)',
    toggleColor: 'rgba(255,255,255,0.5)',
  } : {
    bg: '#f5f5f7',
    card: '#fff',
    cardBorder: 'rgba(0,0,0,0.08)',
    title: '#111',
    subtitle: 'rgba(0,0,0,0.4)',
    inputBg: 'rgba(0,0,0,0.03)',
    inputBorder: 'rgba(0,0,0,0.1)',
    inputText: '#111',
    inputPlaceholder: 'rgba(0,0,0,0.25)',
    mutedText: 'rgba(0,0,0,0.35)',
    toggleBg: 'rgba(0,0,0,0.06)',
    toggleColor: 'rgba(0,0,0,0.5)',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isForgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      })
      if (error) { setMessage(error.message); setMessageType('error') }
      else { setMessage('Password reset email sent! Check your inbox.'); setMessageType('success') }
      setLoading(false)
      return
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMessage(error.message); setMessageType('error') }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setMessage(error.message); setMessageType('error') }
      else { setMessage('Check your email to confirm your account!'); setMessageType('success') }
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', transition: 'background 0.2s' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Logo + theme toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💰</div>
            <span style={{ fontWeight: 700, fontSize: '18px', color: c.title, letterSpacing: '-0.5px' }}>Budget</span>
          </div>
          <button onClick={toggleDarkMode} title="Toggle theme" style={{
            background: c.toggleBg, border: 'none', cursor: 'pointer',
            borderRadius: '20px', padding: '6px 12px', fontSize: '13px',
            color: c.toggleColor, transition: 'all 0.2s'
          }}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        <div style={{ background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: '24px', padding: '32px', transition: 'all 0.2s' }}>

          <h2 style={{ fontSize: '20px', fontWeight: 700, color: c.title, marginBottom: '4px', letterSpacing: '-0.5px' }}>
            {isForgot ? 'Reset password' : isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ fontSize: '13px', color: c.subtitle, marginBottom: '28px' }}>
            {isForgot ? "We'll send a reset link to your email" : isLogin ? 'Sign in to your account' : 'Start tracking your finances'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px',
                border: `1px solid ${c.inputBorder}`, background: c.inputBg,
                color: c.inputText, fontSize: '14px', outline: 'none',
                boxSizing: 'border-box', transition: 'all 0.2s',
              }}
            />
            {!isForgot && (
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px',
                  border: `1px solid ${c.inputBorder}`, background: c.inputBg,
                  color: c.inputText, fontSize: '14px', outline: 'none',
                  boxSizing: 'border-box', transition: 'all 0.2s',
                }}
              />
            )}

            {isLogin && !isForgot && (
              <button type="button" onClick={() => { setIsForgot(true); setMessage('') }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: c.mutedText, fontSize: '12px', textAlign: 'right', padding: 0
              }}>
                Forgot password?
              </button>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600, marginTop: '4px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              opacity: loading ? 0.6 : 1, transition: 'opacity .15s'
            }}>
              {loading ? 'Loading...' : isForgot ? 'Send reset link' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {message && (
            <div style={{
              marginTop: '16px', padding: '12px 14px', borderRadius: '12px',
              fontSize: '12px', textAlign: 'center',
              background: messageType === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${messageType === 'success' ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
              color: messageType === 'success' ? '#34d399' : '#f87171'
            }}>
              {message}
            </div>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            {isForgot ? (
              <button onClick={() => { setIsForgot(false); setMessage('') }} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', fontWeight: 600, fontSize: '12px'
              }}>← Back to sign in</button>
            ) : (
              <p style={{ fontSize: '12px', color: c.mutedText }}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => { setIsLogin(!isLogin); setMessage('') }} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', fontWeight: 600, fontSize: '12px'
                }}>
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}