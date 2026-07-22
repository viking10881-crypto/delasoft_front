// src/utils/creditSchedule.js

const FREQ_DAYS = { unico: null, semanal: 7, quincenal: 15, mensual: 30 };

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * buildSchedule — genera array de cuotas para el cronograma.
 *
 * @param {number} total           Monto total de la venta
 * @param {number} downPayment     Abono inicial (se descuenta de la base)
 * @param {number} numInstallments Número de cuotas
 * @param {string} frequency       'unico' | 'semanal' | 'quincenal' | 'mensual'
 * @param {string} startDate       ISO date de la PRIMERA cuota (YYYY-MM-DD)
 * @returns {{ id, date, amount }[]}
 */
export function buildSchedule({ total, downPayment = 0, numInstallments, frequency, startDate }) {
  const base     = Math.max(0, total - downPayment);
  const stepDays = FREQ_DAYS[frequency];
  const unit     = 1000; // COP — redondear a miles

  const perQuota  = numInstallments > 0
    ? Math.floor(base / numInstallments / unit) * unit
    : 0;
  const remainder = base - perQuota * numInstallments;

  return Array.from({ length: numInstallments }, (_, i) => ({
    id:     Date.now() + i,
    date:   stepDays ? addDays(startDate, stepDays * i) : startDate,
    amount: i === numInstallments - 1 ? perQuota + remainder : perQuota,
  }));
}