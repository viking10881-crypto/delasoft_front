'use strict';

const fs = require('fs');
const path = require('path');

const backendRoot = '/home/alucard/delasoft_back';
require(path.join(backendRoot, 'node_modules/dotenv')).config({
  path: path.join(backendRoot, '.env'),
});

const db = require(path.join(backendRoot, 'config/db'));
const { getAdminBranding } = require(path.join(backendRoot, 'services/branding.service'));
const { generateInvoicePdf } = require(path.join(backendRoot, 'services/invoice.service'));

async function main() {
  const profileResult = await db.query(
    `SELECT ap.user_id
       FROM admin_profiles ap
       JOIN users u ON u.id = ap.user_id
      WHERE LOWER(CONCAT_WS(' ', ap.business_name, ap.tagline, u.name, u.email))
            SIMILAR TO '%(sukuluna|suculuna|lunasuku)%'
      ORDER BY ap.user_id
      LIMIT 1`
  );

  if (!profileResult.rowCount) {
    const candidates = await db.query(
      `SELECT ap.business_name, u.name
         FROM admin_profiles ap
         JOIN users u ON u.id = ap.user_id
        ORDER BY ap.user_id
        LIMIT 20`
    );
    const names = candidates.rows.map((row) => row.business_name || row.name).filter(Boolean);
    throw new Error(`No se encontró Sukuluna. Perfiles disponibles: ${names.join(', ') || 'ninguno'}`);
  }

  const ownerAdminId = profileResult.rows[0].user_id;
  const branding = await getAdminBranding(ownerAdminId);
  const saleResult = await db.query(
    `SELECT s.id, s.sale_number, s.subtotal, s.discount_amount, s.tax_amount,
            s.total, s.payment_method, s.payment_status,
            u.name AS customer_name, u.email AS customer_email,
            s.shipping_address, s.shipping_city
       FROM sales s
       LEFT JOIN users u ON u.id = s.customer_id
      WHERE s.owner_admin_id = $1
      ORDER BY s.created_at DESC
      LIMIT 1`,
    [ownerAdminId]
  );

  let invoice;
  if (saleResult.rowCount) {
    const sale = saleResult.rows[0];
    const itemResult = await db.query(
      `SELECT COALESCE(p.name, 'Producto') AS name,
              COALESCE(p.sku, '—') AS sku,
              si.quantity, si.unit_price, si.subtotal
         FROM sale_items si
         LEFT JOIN products p ON p.id = si.product_id
        WHERE si.sale_id = $1
        ORDER BY si.id`,
      [sale.id]
    );
    invoice = {
      orderCode: `PRUEBA-${sale.sale_number}`,
      saleNumber: `${sale.sale_number}-PRUEBA`,
      customer: {
        name: sale.customer_name || 'Cliente de prueba',
        email: sale.customer_email || 'cliente.prueba@example.com',
      },
      items: itemResult.rows,
      subtotal: Number(sale.subtotal),
      discountAmount: Number(sale.discount_amount),
      taxAmount: Number(sale.tax_amount),
      total: Number(sale.total),
      paymentMethod: sale.payment_method,
      paymentStatus: sale.payment_status,
      shippingAddress: sale.shipping_address,
      shippingCity: sale.shipping_city,
      branding,
    };
  } else {
    invoice = {
      orderCode: 'PRUEBA-000001',
      saleNumber: 'VEN-PRUEBA-000001',
      customer: { name: 'Cliente de prueba', email: 'cliente.prueba@example.com' },
      items: [
        { name: 'Producto Sukuluna de prueba', sku: 'SKU-PRUEBA', quantity: 2, unit_price: 45000, subtotal: 90000 },
        { name: 'Accesorio de prueba', sku: 'ACC-PRUEBA', quantity: 1, unit_price: 25000, subtotal: 25000 },
      ],
      subtotal: 115000,
      discountAmount: 5000,
      taxAmount: 0,
      total: 110000,
      paymentMethod: 'transfer',
      paymentStatus: 'paid',
      branding,
    };
  }

  const pdf = await generateInvoicePdf(invoice);
  const output = path.resolve(__dirname, '..', 'factura-prueba-sukuluna.pdf');
  fs.writeFileSync(output, pdf);
  process.stdout.write(JSON.stringify({ output, businessName: branding.businessName, usedExistingSale: saleResult.rowCount > 0 }));
}

main()
  .catch((error) => {
    process.stderr.write(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
