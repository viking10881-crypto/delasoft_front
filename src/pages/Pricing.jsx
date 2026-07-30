// pages/Pricing.jsx  (o pages/tools/Pricing.jsx)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Toast from '../components/Toast';

const CHECK = '✓';
const CROSS = '✗';

const FEATURE_LABELS = {
  max_products:       'Productos',
  max_users:          'Clientes registrados',
  max_admins:         'Usuarios del panel',
  max_monthly_sales:  'Ventas/mes',
  max_api_keys:       'API Keys',
  max_categories:     'Categorías',
  max_banners:        'Banners',
  max_providers:      'Proveedores',
  storage_mb:         'Almacenamiento de imágenes',
  has_analytics:      'Analíticas avanzadas',
  has_ai_agent:       'Agente IA',
  has_api_access:     'Acceso API',
  has_multi_admin:    'Multi-administrador',
  has_custom_branding:'Marca personalizada',
  has_wompi_payments: 'Pagos Wompi',
  has_export:         'Exportar datos',
  has_financial_reports: 'Reportes financieros',
  has_purchase_orders:'Órdenes de compra',
  has_priority_support: 'Soporte prioritario',
  has_push_notifications: 'Notificaciones push',
  has_discount_system: 'Descuentos y promociones',
  has_inventory:      'Inventario y movimientos',
};

function formatLimit(key, val) {
  if (val === -1) return 'Ilimitado';
  if (key === 'storage_mb') return val >= 1024 ? `${val / 1024} GB` : `${val} MB`;
  if (typeof val === 'boolean') return null; // handled separately
  return val.toLocaleString('es-CO');
}

function PlanCard({ plan, isCurrentPlan, isSelected, billingCycle, onHighlight, onSelect, loading }) {
  const monthlyPrice = Number(plan.price_monthly ?? 0);
  const yearlyPrice = Number(plan.price_yearly ?? 0);
  const isPopular = plan.slug === 'standard' || ['Popular', 'Recomendado'].includes(plan.badge_label);
  const isFree = monthlyPrice === 0;
  const price = billingCycle === 'yearly' && yearlyPrice
    ? Math.round(yearlyPrice / 12)
    : monthlyPrice;

  const limitKeys = ['max_products','max_users','max_admins','max_monthly_sales',
                     'max_categories','max_providers','max_banners',
                     'max_api_keys','storage_mb'];
  const featureKeys = ['has_analytics','has_ai_agent','has_api_access',
                       'has_multi_admin','has_custom_branding','has_wompi_payments',
                       'has_export','has_financial_reports','has_purchase_orders',
                       'has_priority_support','has_push_notifications',
                       'has_discount_system','has_inventory'];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onHighlight(plan.slug)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onHighlight(plan.slug);
        }
      }}
      className={`relative flex cursor-pointer flex-col rounded-2xl border-2 transition-all duration-300 overflow-hidden outline-none
      ${isSelected
        ? 'border-blue-600 -translate-y-2 shadow-2xl shadow-blue-500/25 ring-4 ring-blue-500/10'
        : isPopular
          ? 'border-violet-400 shadow-xl shadow-violet-500/15 hover:-translate-y-1'
          : 'border-gray-200 dark:border-white/[0.08] hover:-translate-y-1 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-xl'
      }
      bg-white dark:bg-[#151A22] focus-visible:ring-4 focus-visible:ring-blue-500/20`}
    >
      {/* Badge */}
      {plan.badge_label && (
        <div
          className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full text-white"
          style={{ backgroundColor: plan.color }}
        >
          {plan.badge_label}
        </div>
      )}

      {/* Header */}
      <div className="p-8 pb-6" style={{ borderBottom: `3px solid ${plan.color}20` }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold mb-4"
          style={{ backgroundColor: plan.color }}
        >
          {plan.name[0]}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{plan.tagline}</p>
        {plan.description && (
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-3 leading-relaxed min-h-10">{plan.description}</p>
        )}

        <div className="mt-5 flex items-end gap-1">
          {isFree ? (
            <span className="text-4xl font-black text-gray-900 dark:text-white">Gratis</span>
          ) : (
            <>
              <span className="text-sm text-gray-500 dark:text-slate-500 mb-1">COP</span>
              <span className="text-4xl font-black text-gray-900 dark:text-white">
                {price.toLocaleString('es-CO')}
              </span>
              <span className="text-sm text-gray-500 dark:text-slate-500 mb-1">/mes</span>
            </>
          )}
        </div>
        {billingCycle === 'yearly' && yearlyPrice > 0 && (
          <div className="mt-2">
            <p className="text-xs text-green-600 dark:text-emerald-400 font-semibold">
              ${yearlyPrice.toLocaleString('es-CO')} COP al año
            </p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              Ahorras ${(monthlyPrice * 12 - yearlyPrice).toLocaleString('es-CO')} COP
            </p>
          </div>
        )}
        {plan.trial_days > 0 && (
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
            🎁 {plan.trial_days} días gratis incluidos
          </p>
        )}
      </div>

      {/* Limits */}
      <div className="px-8 py-5 space-y-3 flex-1">
        {limitKeys.map(key => plan[key] !== undefined && (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-slate-400">{FEATURE_LABELS[key]}</span>
            <span className={`font-semibold ${plan[key] === -1 ? 'text-green-600 dark:text-emerald-400' : 'text-gray-800 dark:text-slate-200'}`}>
              {formatLimit(key, plan[key])}
            </span>
          </div>
        ))}

        <div className="pt-3 border-t border-gray-100 dark:border-white/[0.07] space-y-2">
          {featureKeys.map(key => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <span className={`font-bold text-base ${plan[key] ? 'text-green-500' : 'text-gray-300 dark:text-slate-700'}`}>
                {plan[key] ? CHECK : CROSS}
              </span>
              <span className={plan[key] ? 'text-gray-700 dark:text-slate-300' : 'text-gray-400 dark:text-slate-600'}>
                {FEATURE_LABELS[key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-8 pt-5">
        <button
          onClick={(event) => {
            event.stopPropagation();
            onSelect(plan);
          }}
          disabled={isCurrentPlan || loading}
          className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200
            ${isCurrentPlan
              ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-slate-500 cursor-not-allowed'
              : loading
                ? 'opacity-70 cursor-wait'
                : 'text-white hover:opacity-90 hover:shadow-lg active:scale-95'
            }`}
          style={!isCurrentPlan ? { backgroundColor: plan.color } : {}}
        >
          {isCurrentPlan ? 'Plan Actual' : isFree ? 'Comenzar Gratis' : `Activar ${plan.name}`}
        </button>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [highlightedPlan, setHighlightedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
    if (user) fetchMySubscription();
  }, [user]);

  async function fetchPlans() {
    try {
      const { data } = await api.get('/subscriptions/plans');
      setPlans(data.plans);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchMySubscription() {
    try {
      const { data } = await api.get('/subscriptions/me');
      setSubscription(data.subscription);
    } catch (_) {}
  }

  async function validateCoupon() {
    if (!couponCode) return;
    try {
      const { data } = await api.post('/subscriptions/coupons/validate', {
        code: couponCode,
        plan_slug: selectedPlan?.slug,
        billing_cycle: billingCycle,
      });
      setCouponResult(data);
      setToast({ type: 'success', message: `✓ Cupón válido: ${data.coupon.description}` });
    } catch (err) {
      setCouponResult({ valid: false });
      setToast({ type: 'error', message: err.response?.data?.message || 'Cupón inválido' });
    }
  }

  async function handleSelectPlan(plan) {
    if (!user) return navigate('/login');
    setHighlightedPlan(plan.slug);
    setSelectedPlan(plan);
  }

  async function handleActivate() {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      // Aquí integrarías con Wompi si el plan es de pago
      // Por ahora: llamar a change-plan (en producción, primero generar link de pago)
      if (selectedPlan.price_monthly === 0) {
        await api.post('/subscriptions/change-plan', { plan_slug: selectedPlan.slug });
        setToast({ type: 'success', message: '¡Listo! Plan activado.' });
        fetchMySubscription();
        setSelectedPlan(null);
      } else {
        // Redirigir a flujo de pago Wompi
        setToast({ type: 'info', message: 'Redirigiendo al pago...' });
        // navigate(`/checkout?plan=${selectedPlan.slug}&cycle=${billingCycle}&coupon=${couponCode}`);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Error al activar plan' });
    } finally {
      setLoading(false);
    }
  }

  const currentPlanSlug = subscription?.plan_slug;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] py-16 px-4 transition-colors">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
          Elige el plan perfecto<br />
          <span className="text-violet-600 dark:text-blue-400">para tu negocio</span>
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
          Sin comisiones ocultas. Cancela cuando quieras.
          Todos los planes incluyen período de prueba gratuito.
        </p>

        {/* Toggle mensual / anual */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="inline-grid grid-cols-2 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.05] p-1 shadow-sm">
            {[
              { key: 'monthly', label: 'Mensual' },
              { key: 'yearly', label: 'Anual' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setBillingCycle(key)}
                aria-pressed={billingCycle === key}
                className={`min-w-[92px] rounded-xl px-4 py-2 text-sm font-bold transition-all sm:min-w-[110px] ${
                  billingCycle === key
                    ? 'bg-violet-600 dark:bg-blue-600 text-white shadow-md shadow-violet-200 dark:shadow-blue-950/50'
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
            billingCycle === 'yearly'
              ? 'bg-green-100 dark:bg-emerald-500/10 text-green-700 dark:text-emerald-400'
              : 'bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-slate-500'
          }`}>
            Anual: ahorra 2 meses
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto -mt-5 mb-12 grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          'Tienda online',
          'Clientes ilimitados',
          'Catálogo de productos',
          '14 días de prueba',
        ].map(item => (
          <div key={item} className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-100 dark:border-blue-500/15 bg-blue-50/70 dark:bg-blue-500/[0.07] px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <span className="text-emerald-500">✓</span> {item}
          </div>
        ))}
      </div>

      {/* Estado actual */}
      {subscription && (
        <div className="max-w-lg mx-auto mb-10 bg-blue-50 dark:bg-blue-500/[0.08] border border-blue-200 dark:border-blue-500/20 rounded-2xl p-5 text-center">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Tu plan actual: <strong>{subscription.plan_name}</strong> •
            Estado: <strong className="capitalize">{subscription.status}</strong>
            {subscription.trial_end && (
              <> • Trial hasta <strong>{new Date(subscription.trial_end).toLocaleDateString('es-CO')}</strong></>
            )}
            {subscription.current_period_end && !subscription.trial_end && (
              <> • Próximo cobro: <strong>{new Date(subscription.current_period_end).toLocaleDateString('es-CO')}</strong></>
            )}
          </p>
        </div>
      )}

      {/* Grid de planes */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={plan.slug === currentPlanSlug}
            isSelected={plan.slug === highlightedPlan}
            billingCycle={billingCycle}
            onHighlight={setHighlightedPlan}
            onSelect={handleSelectPlan}
            loading={loading}
          />
        ))}
      </div>

      {/* Cupón */}
      <div className="max-w-md mx-auto mt-14 text-center">
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3 font-medium">¿Tienes un código de descuento?</p>
        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
            placeholder="CÓDIGO DE CUPÓN"
            className="flex-1 min-w-0 px-4 py-2.5 border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={validateCoupon}
            className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors"
          >
            Aplicar
          </button>
        </div>
        {couponResult?.valid && (
          <p className="mt-2 text-sm text-green-600 dark:text-emerald-400 font-medium">
            ✓ {couponResult.coupon.description}
            {couponResult.coupon.coupon_type === 'free_months' && ` — ${couponResult.discount_preview} meses gratis`}
            {couponResult.coupon.coupon_type === 'percentage' && ` — ${couponResult.coupon.discount_value}% de descuento`}
          </p>
        )}
      </div>

      {/* Modal de confirmación del plan seleccionado */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#151A22] border border-transparent dark:border-white/[0.08] rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              Activar plan {selectedPlan.name}
            </h2>
            <div className="space-y-2 my-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">Plan</span>
                <span className="font-semibold dark:text-white">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">Ciclo</span>
                <span className="font-semibold capitalize dark:text-white">{billingCycle === 'monthly' ? 'Mensual' : 'Anual'}</span>
              </div>
              {selectedPlan.trial_days > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Trial gratuito</span>
                  <span className="font-semibold text-green-600 dark:text-emerald-400">{selectedPlan.trial_days} días</span>
                </div>
              )}
              {couponResult?.valid && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Descuento ({couponCode})</span>
                  <span className="font-semibold text-green-600 dark:text-emerald-400">
                    - {couponResult.coupon.coupon_type === 'percentage'
                      ? `${couponResult.coupon.discount_value}%`
                      : `COP ${couponResult.discount_preview?.toLocaleString('es-CO')}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-gray-200 dark:border-white/[0.08] pt-2 mt-2">
                <span className="font-bold text-gray-900 dark:text-white">Total</span>
                <span className="font-black text-gray-900 dark:text-white">
                  {Number(selectedPlan.price_monthly) === 0
                    ? 'Gratis'
                    : `COP ${Number(billingCycle === 'yearly' && selectedPlan.price_yearly
                        ? selectedPlan.price_yearly
                        : selectedPlan.price_monthly
                      ).toLocaleString('es-CO')}`
                  }
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex-1 py-3 border border-gray-300 dark:border-white/[0.1] rounded-xl text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.06]"
              >
                Cancelar
              </button>
              <button
                onClick={handleActivate}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
                style={{ backgroundColor: selectedPlan.color }}
              >
                {loading ? 'Procesando...' : Number(selectedPlan.price_monthly) === 0 ? 'Activar Gratis' : 'Proceder al Pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ rápido */}
      <div className="max-w-2xl mx-auto mt-20">
        <h3 className="text-2xl font-black text-center text-gray-900 dark:text-white mb-8">Preguntas frecuentes</h3>
        {[
          ['¿Puedo cancelar en cualquier momento?', 'Sí. Puedes cancelar cuando quieras sin penalizaciones. Tu plan se mantendrá activo hasta el fin del período pagado.'],
          ['¿Qué pasa cuando termina el trial?', 'Al final del período de prueba se te solicitará elegir un plan de pago. Todos tus datos se conservan.'],
          ['¿Puedo cambiar de plan después?', 'Claro. Puedes hacer upgrade o downgrade desde tu panel de suscripción en cualquier momento.'],
          ['¿Cómo funcionan los cupones?', 'Los cupones pueden dar descuentos en porcentaje, monto fijo, o meses gratuitos adicionales. Aplican al momento de activar o renovar.'],
        ].map(([q, a]) => (
          <details key={q} className="mb-4 border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] rounded-xl overflow-hidden group">
            <summary className="flex justify-between items-center p-5 cursor-pointer font-semibold text-gray-800 dark:text-slate-200 list-none hover:bg-gray-50 dark:hover:bg-white/[0.04]">
              {q}
              <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="px-5 pb-5 text-sm text-gray-600 dark:text-slate-400">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
