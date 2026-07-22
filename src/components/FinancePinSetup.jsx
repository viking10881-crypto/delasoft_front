// components/FinancePinSetup.jsx
// Coloca esto en tu página de Setup o Configuración del admin
// Permite al admin crear o cambiar su PIN financiero

import { useState, useEffect } from 'react';
import api from "../services/api";

export default function FinancePinSetup() {
  const [hasPin, setHasPin]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState('');
  const [error, setError]         = useState('');

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin]         = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    api.get('/api/finance-pin/status')
      .then(({ data }) => setHasPin(data.hasPin))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError(''); setSuccess('');

    if (!/^\d{4,6}$/.test(newPin)) {
      return setError('El PIN debe tener entre 4 y 6 dígitos numéricos.');
    }
    if (newPin !== confirmPin) {
      return setError('Los PINs no coinciden.');
    }
    if (hasPin && !currentPin) {
      return setError('Debes ingresar tu PIN actual.');
    }

    setSaving(true);
    try {
      await api.post('/api/finance-pin/setup', {
        newPin,
        ...(hasPin && { currentPin }),
      });
      setSuccess(hasPin ? 'PIN actualizado correctamente.' : 'PIN configurado correctamente.');
      setHasPin(true);
      setCurrentPin(''); setNewPin(''); setConfirmPin('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el PIN.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.iconWrap}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div>
          <h3 style={s.title}>PIN Panel Financiero</h3>
          <p style={s.subtitle}>
            {hasPin
              ? 'Cambia el PIN de acceso al área de finanzas.'
              : 'Configura un PIN de seguridad para el área de finanzas.'}
          </p>
        </div>
        {hasPin && (
          <span style={s.badge}>Activo</span>
        )}
      </div>

      <div style={s.fields}>
        {hasPin && (
          <div style={s.field}>
            <label style={s.label}>PIN actual</label>
            <input
              type="password" inputMode="numeric" maxLength={6}
              value={currentPin}
              onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              style={s.input}
            />
          </div>
        )}

        <div style={s.fieldRow}>
          <div style={s.field}>
            <label style={s.label}>Nuevo PIN</label>
            <input
              type="password" inputMode="numeric" maxLength={6}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="4–6 dígitos"
              style={s.input}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Confirmar PIN</label>
            <input
              type="password" inputMode="numeric" maxLength={6}
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="4–6 dígitos"
              style={s.input}
            />
          </div>
        </div>
      </div>

      {error   && <p style={s.error}>{error}</p>}
      {success && <p style={s.successMsg}>{success}</p>}

      <button style={s.btn} onClick={handleSave} disabled={saving}>
        {saving ? 'Guardando...' : hasPin ? 'Actualizar PIN' : 'Crear PIN'}
      </button>
    </div>
  );
}

const s = {
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '480px',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px',
  },
  iconWrap: {
    width: '40px', height: '40px', borderRadius: '10px',
    background: '#eff6ff', color: '#3b82f6', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: { margin: '0 0 2px', fontSize: '15px', fontWeight: 600, color: '#1e293b' },
  subtitle: { margin: 0, fontSize: '13px', color: '#64748b' },
  badge: {
    marginLeft: 'auto', padding: '3px 10px',
    background: '#dcfce7', color: '#16a34a',
    borderRadius: '99px', fontSize: '12px', fontWeight: 600, flexShrink: 0,
  },
  fields: { display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' },
  fieldRow: { display: 'flex', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  label: { fontSize: '13px', fontWeight: 500, color: '#374151' },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '14px', outline: 'none',
    letterSpacing: '4px',
    width: '100%', boxSizing: 'border-box',
  },
  error: {
    margin: '0 0 12px', padding: '10px 14px',
    background: '#fef2f2', color: '#b91c1c',
    border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px',
  },
  successMsg: {
    margin: '0 0 12px', padding: '10px 14px',
    background: '#f0fdf4', color: '#166534',
    border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '13px',
  },
  btn: {
    padding: '11px 20px',
    background: '#3b82f6', color: '#fff',
    border: 'none', borderRadius: '10px',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  },
};