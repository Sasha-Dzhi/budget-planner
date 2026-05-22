import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [isForgot, setIsForgot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('neutral')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isForgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      })
      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        setMessage('Password reset email sent! Check your inbox.')
        setMessageType('success')
      }
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

  const inputClass = "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"

  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💰</div>
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#fff', letterSpacing: '-0.5px' }}>Budget</span>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px' }}>

          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '4px', letterSpacing: '-0.5px' }}>
            {isForgot ? 'Reset password' : isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '28px' }}>
            {isForgot ? "We'll send a reset link to your email" : isLogin ? 'Sign in to your account' : 'Start tracking your finances'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
              required
            />

            {!isForgot && (
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            )}

            {isLogin && !isForgot && (
              <button
                type="button"
                onClick={() => { setIsForgot(true); setMessage('') }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', fontSize: '12px',
                  textAlign: 'right', padding: 0, transition: 'color .15s'
                }}
                onMouseOver={e => e.target.style.color = '#818cf8'}
                onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.3)'}>
                Forgot password?
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
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
              <button
                onClick={() => { setIsForgot(false); setMessage('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', fontWeight: 600, fontSize: '12px' }}>
                ← Back to sign in
              </button>
            ) : (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => { setIsLogin(!isLogin); setMessage('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', fontWeight: 600, fontSize: '12px' }}>
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