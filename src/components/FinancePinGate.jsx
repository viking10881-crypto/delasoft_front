// components/FinancePinGate.jsx
import { useState, useEffect, useRef } from 'react';
import api from "../services/api";

export default function FinancePinGate({ children }) {
  const [status,    setStatus]    = useState('loading'); // loading | setup | locked | unlocked
  const [setupStep, setSetupStep] = useState('enter');   // enter | confirm
  const [firstPin,  setFirstPin]  = useState('');
  const [pin,       setPin]       = useState(['', '', '', '', '', '']);
  const [pinLength, setPinLength] = useState(4);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [shakeKey,  setShakeKey]  = useState(0);
  const [financeUnlockedUntil, setFinanceUnlockedUntil] = useState(null);
  const inputsRef = useRef([]);

  // ── Comprobar estado al montar ──────────────────────────────
  useEffect(() => {
    api.get('/finance-pin/status')
      .then(({ data }) => {
        if (data.isUnlocked) {
          // Sesión financiera aún activa (ej: el usuario navegó fuera y volvió
          // dentro de los 15 min) → auto-unlock sin pedir PIN
          setFinanceUnlockedUntil(data.financeUnlockedUntil ?? null);
          setStatus('unlocked');
        } else {
          setStatus(data.hasPin ? 'locked' : 'setup');
        }
      })
      .catch(() => setStatus('locked'));
  }, []);

  // ── Focus automático al entrar modo PIN ─────────────────────
  useEffect(() => {
    if (status === 'locked' || status === 'setup') {
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    }
  }, [status, setupStep]);

  // ── Escuchar expiración de sesión (desde interceptor o countdown) ──
  useEffect(() => {
    const handler = () => {
      setStatus('locked');
      setFinanceUnlockedUntil(null);
      setPin(Array(6).fill(''));
      setError('Tu sesión financiera expiró. Ingresá el PIN nuevamente.');
    };
    window.addEventListener('finance:session-expired', handler);
    return () => window.removeEventListener('finance:session-expired', handler);
  }, []);

  // ── Helpers ─────────────────────────────────────────────────
  const resetPin = () => setPin(Array(6).fill(''));

  const shake = () => {
    setShakeKey(k => k + 1);
    resetPin();
    setTimeout(() => inputsRef.current[0]?.focus(), 50);
  };

  // ── Dispatcher ──────────────────────────────────────────────
  const handleComplete = (full) => {
    if (status === 'locked') return handleVerify(full);
    if (status === 'setup' && setupStep === 'enter')   return handleSetupNext(full);
    if (status === 'setup' && setupStep === 'confirm') return handleSetupConfirm(full);
  };

  const handleInput = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    setError('');
    if (value && index < pinLength - 1) inputsRef.current[index + 1]?.focus();
    if (value && index === pinLength - 1) {
      const full = next.slice(0, pinLength).join('');
      if (full.length === pinLength) handleComplete(full);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'Enter') {
      const full = pin.slice(0, pinLength).join('');
      if (full.length === pinLength) handleComplete(full);
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length < 4) return;
    e.preventDefault();
    const next = Array(6).fill('');
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setPin(next);
    setPinLength(pasted.length);
    handleComplete(pasted);
  };

  // ── Setup paso 1: guardar PIN, avanzar a confirmación ───────
  const handleSetupNext = (pinValue) => {
    setFirstPin(pinValue);
    setPinLength(pinValue.length);
    setSetupStep('confirm');
    resetPin();
    setError('');
  };

  // ── Setup paso 2: comparar + POST /setup ────────────────────
  const handleSetupConfirm = async (pinValue) => {
    if (pinValue !== firstPin) {
      setError('Los PINs no coinciden. Intentá de nuevo.');
      shake();
      return;
    }
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/finance-pin/setup', { newPin: firstPin });
      setFinanceUnlockedUntil(data.financeUnlockedUntil ?? null);
      setStatus('unlocked');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el PIN.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  // ── Verificar PIN existente ──────────────────────────────────
  const handleVerify = async (pinValue) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/finance-pin/verify', { pin: pinValue });
      if (!data.valid) {
        setError('PIN incorrecto. Intentá de nuevo.');
        shake();
        return;
      }
      setFinanceUnlockedUntil(data.financeUnlockedUntil ?? null);
      setStatus('unlocked');
    } catch (err) {
      // 429 rate limit
      if (err.response?.status === 429) {
        const mins = err.response.data?.retryAfter ?? 15;
        setError(`Demasiados intentos. Bloqueado por ${mins} minuto${mins !== 1 ? 's' : ''}.`);
      } else {
        setError(err.response?.data?.error || 'Error al verificar el PIN.');
      }
      shake();
    } finally {
      setLoading(false);
    }
  };

  // ── Bloquear sesión manualmente ──────────────────────────────
  const handleLock = async () => {
    try {
      await api.post('/finance-pin/lock');
    } catch {
      // ignorar error de red — bloqueamos localmente igual
    }
    setStatus('locked');
    setFinanceUnlockedUntil(null);
    resetPin();
    setError('');
  };

  // ── Render: desbloqueado ─────────────────────────────────────
  if (status === 'unlocked') {
    return (
      <>
        <FinanceSessionBar expiresAt={financeUnlockedUntil} onLock={handleLock} />
        {children}
      </>
    );
  }

  // ── Render: cargando ─────────────────────────────────────────
  if (status === 'loading') return (
    <div style={st.overlay}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={st.spinner} />
    </div>
  );

  // ── Etiquetas dinámicas ──────────────────────────────────────
  const isSetup   = status === 'setup';
  const isConfirm = isSetup && setupStep === 'confirm';

  const subtitle = isSetup
    ? (isConfirm
        ? 'Confirmá tu PIN para guardarlo'
        : 'Elegí un PIN de 4 a 6 dígitos para proteger esta sección')
    : 'Ingresá tu PIN para continuar';

  const btnLabel = loading
    ? (isConfirm ? 'Guardando…' : 'Verificando…')
    : (isSetup ? (isConfirm ? 'Guardar PIN' : 'Continuar') : 'Acceder');

  const currentPin  = pin.slice(0, pinLength).join('');
  const btnDisabled = loading || currentPin.length < pinLength;

  // ── Render: modal PIN ────────────────────────────────────────
  return (
    <div style={st.overlay}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px); }
          40%     { transform: translateX(8px); }
          60%     { transform: translateX(-5px); }
          80%     { transform: translateX(4px); }
        }
      `}</style>

      <div key={shakeKey} style={{ ...st.card, animation: shakeKey > 0 ? 'shake 0.5s ease' : 'none' }}>

        <div style={{ ...st.iconWrap, ...(isSetup ? st.iconWrapSetup : {}) }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h2 style={st.title}>Área Financiera</h2>
        <p style={st.subtitle}>{subtitle}</p>

        {isSetup && (
          <div style={st.steps}>
            <div style={{ ...st.dot, ...(setupStep === 'enter' ? st.dotActive : st.dotDone) }} />
            <div style={{ ...st.dot, ...(setupStep === 'confirm' ? st.dotActive : {}) }} />
          </div>
        )}

        <div style={st.pinRow} onPaste={handlePaste}>
          {Array.from({ length: pinLength }).map((_, i) => (
            <input
              key={`${setupStep}-${i}`}
              ref={el => (inputsRef.current[i] = el)}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={pin[i]}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
              autoComplete="off"
              style={{
                ...st.pinInput,
                ...(pin[i] ? st.pinFilled : {}),
                ...(error   ? st.pinError  : {}),
              }}
            />
          ))}
        </div>

        {!isConfirm && (
          <div style={st.toggle}>
            {[4, 6].map((n, idx) => (
              <button
                key={n}
                style={{
                  ...st.toggleBtn,
                  ...(pinLength === n ? st.toggleActive : {}),
                  ...(idx === 0
                    ? { borderRadius: '6px 0 0 6px' }
                    : { borderRadius: '0 6px 6px 0', borderLeft: 'none' }),
                }}
                onClick={() => { setPinLength(n); resetPin(); setError(''); }}
              >
                {n} dígitos
              </button>
            ))}
          </div>
        )}

        {error && <p style={st.errorMsg}>{error}</p>}

        <button
          style={{ ...st.btn, ...(btnDisabled ? st.btnOff : {}) }}
          onClick={() => handleComplete(currentPin)}
          disabled={btnDisabled}
        >
          {btnLabel}
        </button>

        {isConfirm && (
          <button
            style={st.backBtn}
            onClick={() => { setSetupStep('enter'); resetPin(); setError(''); }}
          >
            ← Volver a elegir PIN
          </button>
        )}
      </div>
    </div>
  );
}

// ── Barra de sesión activa (visible cuando status === 'unlocked') ────────────
function FinanceSessionBar({ expiresAt, onLock }) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    expiresAt ? Math.max(0, Math.round((expiresAt - Date.now()) / 1000)) : null
  );

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        // El interceptor ya disparará el evento si el servidor devuelve 401,
        // pero si la app estaba idle disparamos aquí también.
        window.dispatchEvent(new CustomEvent('finance:session-expired'));
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Actualizar cuando el padre pasa un nuevo expiresAt (sliding window)
  useEffect(() => {
    if (expiresAt) {
      setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    }
  }, [expiresAt]);

  const mins = secondsLeft !== null ? Math.floor(secondsLeft / 60) : null;
  const secs = secondsLeft !== null ? secondsLeft % 60 : null;

  return (
    <div style={bar.wrap}>
      <div style={bar.left}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span style={bar.text}>Finanzas desbloqueadas</span>
        {mins !== null && (
          <span style={bar.timer}>
            {mins}:{String(secs).padStart(2, '0')} restantes
          </span>
        )}
      </div>
      <button style={bar.lockBtn} onClick={onLock}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Bloquear ahora
      </button>
    </div>
  );
}

// ── Estilos modal ────────────────────────────────────────────────────────────
const st = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(8, 8, 16, 0.88)',
    backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  card: {
    background: '#0d1117',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '24px',
    padding: '44px 40px',
    width: '100%', maxWidth: '360px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
  },
  iconWrap: {
    width: '60px', height: '60px', borderRadius: '18px',
    background: 'rgba(59,130,246,0.1)',
    border: '1px solid rgba(59,130,246,0.2)',
    color: '#60a5fa',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  iconWrapSetup: {
    background: 'rgba(139,92,246,0.1)',
    border: '1px solid rgba(139,92,246,0.25)',
    color: '#a78bfa',
  },
  title: {
    margin: 0, fontSize: '20px', fontWeight: 700,
    color: '#f8fafc', letterSpacing: '-0.3px',
  },
  subtitle: {
    margin: 0, fontSize: '13px', color: '#64748b',
    textAlign: 'center', lineHeight: 1.5, maxWidth: '240px',
  },
  steps: { display: 'flex', gap: '8px', alignItems: 'center' },
  dot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)', transition: 'all 0.2s',
  },
  dotActive: { background: '#a78bfa', width: '20px', borderRadius: '4px' },
  dotDone:   { background: '#4ade80' },
  pinRow: { display: 'flex', gap: '10px', marginTop: '4px' },
  pinInput: {
    width: '52px', height: '58px',
    background: 'rgba(255,255,255,0.04)',
    border: '1.5px solid rgba(255,255,255,0.09)',
    borderRadius: '14px',
    color: '#f8fafc', fontSize: '24px', fontWeight: 700,
    textAlign: 'center', outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
    caretColor: 'transparent',
  },
  pinFilled: {
    border: '1.5px solid rgba(59,130,246,0.55)',
    background: 'rgba(59,130,246,0.09)',
  },
  pinError: {
    border: '1.5px solid rgba(239,68,68,0.55)',
    background: 'rgba(239,68,68,0.07)',
  },
  toggle: { display: 'flex' },
  toggleBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: '#64748b', fontSize: '12px', padding: '5px 14px',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  toggleActive: {
    background: 'rgba(59,130,246,0.12)',
    color: '#60a5fa',
    border: '1px solid rgba(59,130,246,0.3)',
  },
  errorMsg: {
    margin: 0, fontSize: '13px', color: '#f87171',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.15)',
    borderRadius: '10px', padding: '9px 14px',
    textAlign: 'center', width: '100%', boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '14px',
    background: '#3b82f6', color: '#fff',
    border: 'none', borderRadius: '14px',
    fontSize: '15px', fontWeight: 600, cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  btnOff: { opacity: 0.45, cursor: 'not-allowed' },
  backBtn: {
    background: 'none', border: 'none',
    color: '#475569', fontSize: '13px', cursor: 'pointer',
    padding: '4px 8px', marginTop: '-6px', transition: 'color 0.15s',
  },
  spinner: {
    width: '34px', height: '34px',
    border: '3px solid rgba(255,255,255,0.08)',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

// ── Estilos barra de sesión ──────────────────────────────────────────────────
const bar = {
  wrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 14px',
    background: 'rgba(74,222,128,0.06)',
    border: '1px solid rgba(74,222,128,0.18)',
    borderRadius: '10px',
    marginBottom: '16px',
  },
  left: {
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  text: {
    fontSize: '13px', fontWeight: 500, color: '#4ade80',
  },
  timer: {
    fontSize: '12px', color: '#86efac',
    padding: '2px 8px',
    background: 'rgba(74,222,128,0.1)',
    borderRadius: '99px',
    fontVariantNumeric: 'tabular-nums',
  },
  lockBtn: {
    display: 'flex', alignItems: 'center', gap: '5px',
    background: 'none',
    border: '1px solid #e2e8f0',
    color: '#64748b', fontSize: '12px',
    padding: '4px 10px', borderRadius: '6px',
    cursor: 'pointer', transition: 'all 0.15s',
  },
};
