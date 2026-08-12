'use strict';

const fs = require('fs');
const { generateDelasoftInvoicePdf } = require('/home/alucard/delasoft_back/services/delasoftInvoice.service');
const { generateInvoicePdf } = require('/home/alucard/delasoft_back/services/invoice.service');

async function main() {
  const corporate = await generateDelasoftInvoicePdf({
    invoice: {
      invoice_number: 'INV-PRUEBA-001', plan_name: 'Profesional', billing_cycle: 'monthly',
      subtotal: 89900, discount_amount: 0, total: 89900, payment_method: 'wompi',
      payment_reference: 'DS-PRUEBA-001', status: 'paid',
      period_start: '2026-08-12', period_end: '2026-09-12',
      paid_at: '2026-08-12T12:00:00-05:00', created_at: '2026-08-12T12:00:00-05:00',
    },
    customer: {
      business_name: 'Lunasuku', name: 'Cliente de prueba', email: 'cliente@example.com',
      tax_id: '900123456-7', phone: '300 000 0000',
    },
  });
  fs.writeFileSync('factura-delasoft-prueba.pdf', corporate);

  const store = await generateInvoicePdf({
    orderCode: 'PRUEBA-000001', saleNumber: 'VEN-PRUEBA-000001',
    customer: { name: 'Cliente de prueba', email: 'cliente@example.com' },
    items: [{ name: 'Producto de prueba', sku: 'SKU-001', quantity: 1, unit_price: 45000, subtotal: 45000 }],
    subtotal: 45000, discountAmount: 0, taxAmount: 0, total: 45000,
    paymentMethod: 'transfer', paymentStatus: 'paid',
    branding: { businessName: 'Lunasuku', primaryColor: '#111111' },
  });
  fs.writeFileSync('factura-tienda-prueba.pdf', store);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
