import { useState } from 'react'
import { supabase } from './supabase'
import { Wallet, Sun, Moon } from 'lucide-react'

export default function Auth({ darkMode, toggleDarkMode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [isForgot, setIsForgot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('neutral')
  const [rememberMe, setRememberMe] = useState(false)

  const d = darkMode
  const c = d ? {
    bg: '#06060e',
    title: '#fff',
    subtitle: 'rgba(255,255,255,0.4)',
    card: 'rgba(255,255,255,0.04)',
    cardBorder: 'rgba(255,255,255,0.09)',
    inputBg: 'rgba(255,255,255,0.06)',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputText: '#fff',
    mutedText: 'rgba(255,255,255,0.3)',
    toggleBg: 'rgba(255,255,255,0.06)',
    toggleBorder: 'rgba(255,255,255,0.1)',
    toggleColor: 'rgba(255,255,255,0.45)',
    divider: 'rgba(255,255,255,0.08)',
    socialBg: 'rgba(255,255,255,0.05)',
    socialBorder: 'rgba(255,255,255,0.1)',
    socialText: 'rgba(255,255,255,0.7)',
    linkColor: '#818cf8',
    gridLine: 'rgba(255,255,255,0.025)',
  } : {
    bg: '#fafaff',
    title: '#111',
    subtitle: 'rgba(0,0,0,0.4)',
    card: '#fff',
    cardBorder: 'rgba(99,102,241,0.12)',
    inputBg: 'rgba(0,0,0,0.03)',
    inputBorder: 'rgba(0,0,0,0.1)',
    inputText: '#111',
    mutedText: 'rgba(0,0,0,0.35)',
    toggleBg: 'rgba(99,102,241,0.07)',
    toggleBorder: 'rgba(99,102,241,0.15)',
    toggleColor: 'rgba(99,102,241,0.5)',
    divider: 'rgba(0,0,0,0.08)',
    socialBg: '#fff',
    socialBorder: 'rgba(0,0,0,0.1)',
    socialText: 'rgba(0,0,0,0.65)',
    linkColor: '#6366f1',
    gridLine: 'rgba(99,102,241,0.07)',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    if (isForgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
      if (error) { setMessage(error.message); setMessageType('error') }
      else { setMessage('Reset link sent! Check your inbox.'); setMessageType('success') }
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

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: '12px',
    border: `1px solid ${c.inputBorder}`, background: c.inputBg,
    color: c.inputText, fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: c.bg,
      backgroundImage: `radial-gradient(ellipse 900px 600px at 50% -5%, ${d ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.09)'}, transparent), linear-gradient(${c.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${c.gridLine} 1px, transparent 1px)`,
      backgroundSize: 'auto auto, 44px 44px, 44px 44px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', transition: 'background 0.2s',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* ── Branding ─────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: d ? '0 8px 40px rgba(99,102,241,0.5)' : '0 4px 20px rgba(99,102,241,0.3)',
          }}>
            <Wallet size={30} color="white" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: 800, color: c.title, letterSpacing: '-1.5px', marginBottom: '8px' }}>
            Vault
          </h1>
          <p style={{ fontSize: '15px', color: c.subtitle, letterSpacing: '-0.2px' }}>
            Track smarter. Save better.
          </p>
        </div>

        {/* ── Card ─────────────────────────────── */}
        <div style={{
          background: c.card,
          border: `1px solid ${c.cardBorder}`,
          borderRadius: '28px',
          padding: '36px',
          backdropFilter: d ? 'blur(24px)' : 'none',
          WebkitBackdropFilter: d ? 'blur(24px)' : 'none',
          boxShadow: d
            ? '0 24px 80px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset'
            : '0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: c.title, marginBottom: '4px', letterSpacing: '-0.5px' }}>
            {isForgot ? 'Reset password' : isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ fontSize: '13px', color: c.subtitle, marginBottom: '28px' }}>
            {isForgot ? "We'll send a reset link to your email" : isLogin ? 'Sign in to your Vault' : 'Start tracking your finances'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            {!isForgot && (
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            )}
            {isLogin && !isForgot && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#6366f1', cursor: 'pointer' }} />
                  <span style={{ fontSize: '12px', color: c.mutedText }}>Remember me</span>
                </label>
                <button type="button" onClick={() => { setIsForgot(true); setMessage('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.linkColor, fontSize: '12px', padding: 0, fontWeight: 500 }}>
                  Forgot password?
                </button>
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              padding: '14px', borderRadius: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '15px', fontWeight: 600, marginTop: '4px', letterSpacing: '-0.2px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              opacity: loading ? 0.65 : 1, transition: 'opacity .15s',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            }}>
              {loading ? 'Loading...' : isForgot ? 'Send reset link' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {!isForgot && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px' }}>
                <div style={{ flex: 1, height: '1px', background: c.divider }} />
                <span style={{ fontSize: '12px', color: c.mutedText }}>or</span>
                <div style={{ flex: 1, height: '1px', background: c.divider }} />
              </div>
              <button onClick={handleGoogleLogin} style={{
                width: '100%', padding: '12px', borderRadius: '14px',
                border: `1px solid ${c.socialBorder}`, background: c.socialBg,
                color: c.socialText, fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                transition: 'opacity .15s',
              }}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.58-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                Continue with Google
              </button>
            </>
          )}

          {message && (
            <div style={{
              marginTop: '16px', padding: '12px 14px', borderRadius: '12px',
              fontSize: '13px', textAlign: 'center',
              background: messageType === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${messageType === 'success' ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
              color: messageType === 'success' ? '#34d399' : '#f87171',
            }}>{message}</div>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            {isForgot ? (
              <button onClick={() => { setIsForgot(false); setMessage('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.linkColor, fontWeight: 600, fontSize: '13px' }}>
                ← Back to sign in
              </button>
            ) : (
              <p style={{ fontSize: '13px', color: c.mutedText }}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => { setIsLogin(!isLogin); setMessage('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.linkColor, fontWeight: 600, fontSize: '13px' }}>
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Theme toggle — fixed bottom-right ─── */}
      <button onClick={toggleDarkMode} title={d ? 'Switch to light' : 'Switch to dark'} style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 100,
        width: '40px', height: '40px', borderRadius: '50%',
        background: c.toggleBg, border: `1px solid ${c.toggleBorder}`,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: c.toggleColor, transition: 'all 0.2s',
        boxShadow: d ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        {d ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
      </button>
    </div>
  )
}
