import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Key, CreditCard, Briefcase, Bell, ChevronRight, Palette } from 'lucide-react';

const menuItems = [
  {
    name: 'Perfil del negocio',
    description: 'Nombre, logo, dirección y datos de tu empresa',
    path: '/tools/settings/business-profile',
    icon: Briefcase,
    accent: '#dbeafe',
    accentText: '#1d4ed8',
  },
  {
    name: 'Apariencia',
    description: 'Colores, navbar y tipografía de tu tienda pública',
    path: '/tools/settings/appearance',
    icon: Palette,
    accent: '#fce7f3',
    accentText: '#be185d',
  },
  {
    name: 'API Keys',
    description: 'Gestiona claves de acceso e integraciones externas',
    path: '/tools/settings/api-keys',
    icon: Key,
    accent: '#fef3c7',
    accentText: '#b45309',
  },
  {
    name: 'Pagos',
    description: 'Configura métodos de pago y pasarelas',
    path: '/tools/settings/payments',
    icon: CreditCard,
    accent: '#d1fae5',
    accentText: '#065f46',
  },
  {
    name: 'Notificaciones',
    description: 'Configura alertas de WhatsApp y canales de aviso',
    path: '/tools/settings/notifications',
    icon: Bell,
    accent: '#ede9fe',
    accentText: '#6d28d9',
  },
];

export default function Settings() {
  const location = useLocation();

  const isHome =
    location.pathname === '/tools/settings' ||
    location.pathname === '/tools/settings/';

  if (isHome) {
    return <Navigate to="/tools/settings/business-profile" replace />;
  }

  const activeItem = menuItems.find(item =>
    location.pathname.startsWith(item.path)
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f4f3ef' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');

        .cfg-root { font-family: 'DM Sans', sans-serif; color: #1c1c1c; }
        .cfg-title { font-family: 'DM Serif Display', serif; }

        /* ── pill row ── */
        .pill-row { display:flex; gap:8px; overflow-x:auto; padding-bottom:2px; margin-bottom:20px; }
        .pill-row::-webkit-scrollbar { display:none; }
        .pill-row { scrollbar-width:none; }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px 8px 10px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          text-decoration: none;
          cursor: pointer;
          border: 1.5px solid transparent;
          background: #e8e6e0;
          color: #6b6462;
          transition: background .15s, color .15s, border-color .15s, box-shadow .15s;
          flex-shrink: 0;
          letter-spacing: -0.01em;
        }
        .pill:hover:not(.pill--on) {
          background: #fff;
          color: #1c1c1c;
          border-color: #ddd9d2;
          box-shadow: 0 1px 5px rgba(0,0,0,.08);
        }
        .pill--on {
          background: #18181b;
          color: #fff;
          border-color: #18181b;
          box-shadow: 0 3px 10px rgba(0,0,0,.22);
        }
        .pill__dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background .15s;
        }
        .pill--on .pill__dot {
          background: rgba(255,255,255,.15) !important;
          color: #fff !important;
        }

        /* ── panel ── */
        .cfg-panel {
          background: #fff;
          border-radius: 20px;
          border: 1px solid rgba(0,0,0,.07);
          box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 8px 32px rgba(0,0,0,.05);
          overflow: hidden;
        }

        /* ── panel inner top bar ── */
        .panel-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px 18px;
          border-bottom: 1px solid #f0ede8;
          background: #fafaf8;
        }
        .panel-topbar__icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .panel-topbar__title {
          font-size: 15px;
          font-weight: 600;
          color: #18181b;
          letter-spacing: -.02em;
        }
        .panel-topbar__sub {
          font-size: 12px;
          color: #a1a1aa;
          margin-top: 1px;
        }

        /* ── outlet animation ── */
        .outlet-inner {
          padding: 28px;
          animation: fadeUp .18s ease both;
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── breadcrumb ── */
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .04em;
          text-transform: uppercase;
        }
      `}</style>

      <div
        className="cfg-root"
        style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '32px 24px 48px' }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#a8a29e', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
              Panel de control
            </p>
            <h1 className="cfg-title" style={{ fontSize: '2.4rem', color: '#18181b', lineHeight: 1, margin: 0 }}>
              Configuración
            </h1>
          </div>

          {activeItem && (
            <div className="breadcrumb" style={{ paddingBottom: 4 }}>
              <span style={{ color: '#c4bfb8' }}>Configuración</span>
              <ChevronRight size={11} color="#d4cec6" />
              <span style={{ color: '#78716c' }}>{activeItem.name}</span>
            </div>
          )}
        </div>

        {/* ── Pill nav ── */}
        <div className="pill-row">
          {menuItems.map(item => {
            const Icon = item.icon;
            const on = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`pill${on ? ' pill--on' : ''}`}
              >
                <span
                  className="pill__dot"
                  style={!on ? { backgroundColor: item.accent, color: item.accentText } : {}}
                >
                  <Icon size={12} strokeWidth={2} />
                </span>
                {item.name}
              </NavLink>
            );
          })}
        </div>

        {/* ── Panel ── */}
        <div className="cfg-panel">

          {/* Top bar inside panel */}
          {activeItem && (
            <div className="panel-topbar">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  className="panel-topbar__icon"
                  style={{ backgroundColor: activeItem.accent }}
                >
                  <activeItem.icon size={17} color={activeItem.accentText} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="panel-topbar__title">{activeItem.name}</p>
                  <p className="panel-topbar__sub">{activeItem.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Outlet */}
          <div className="outlet-inner" key={location.pathname}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}