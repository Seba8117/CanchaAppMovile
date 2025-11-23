import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import admin from 'firebase-admin';

const accessToken = process.env.MP_ACCESS_TOKEN;
if (!accessToken) {
  console.error('MP_ACCESS_TOKEN no está definido en el entorno.');
  process.exit(1);
}

const client = new MercadoPagoConfig({ accessToken });
let fdb = null;
try {
  const svcRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (svcRaw) {
    const svc = JSON.parse(svcRaw);
    admin.initializeApp({ credential: admin.credential.cert(svc) });
    fdb = admin.firestore();
  }
} catch {}
const app = express();
app.use(cors());
app.use(express.json());

app.post('/create_preference', async (req, res) => {
  try {
    const { items, external_reference, payer_email, payment_methods, expiration_date_from, expiration_date_to, binary_mode, statement_descriptor } = req.body || {};
    const backBase = process.env.MP_BACK_URL_BASE || 'http://localhost:3000/';
    const back_urls = (req.body && req.body.back_urls) ? req.body.back_urls : { success: backBase, failure: backBase, pending: backBase };
    if (!Array.isArray(items) || items.length === 0 || !external_reference) {
      return res.status(400).json({ error: 'Parametros inválidos' });
    }
    const pref = await new Preference(client).create({
      body: {
        items,
        external_reference,
        payer: payer_email ? { email: payer_email } : undefined,
        back_urls,
        notification_url: process.env.MP_WEBHOOK_URL || undefined,
        payment_methods,
        expiration_date_from,
        expiration_date_to,
        binary_mode,
        statement_descriptor,
      },
    });
    res.json(pref);
  } catch (e) {
    console.error('Error creando preferencia:', e);
    res.status(500).json({ error: 'No se pudo crear la preferencia' });
  }
});

app.get('/payment_status/:external_reference', async (req, res) => {
  try {
    const { external_reference } = req.params;
  if (!external_reference) return res.status(400).json({ error: 'external_reference requerido' });
  const result = await new Payment(client).search({ options: { external_reference } });
  const payments = result?.results || [];
  const latest = payments[0] || null;
  const status = latest?.status || 'pending';
  const id = latest?.id || null;
  try {
    if (fdb && latest) {
      await fdb.collection('payments').add({
        external_reference,
        payment_id: id,
        status,
        amount: latest?.transaction_amount || null,
        preference_id: latest?.metadata?.preference_id || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const upd = { paymentStatus: status, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
      try { await fdb.doc(`matches/${external_reference}`).update(upd); } catch {}
      try { await fdb.doc(`bookings/${external_reference}`).update({ status: status === 'approved' ? 'confirmed' : 'pending_payment', updatedAt: admin.firestore.FieldValue.serverTimestamp() }); } catch {}
    }
  } catch {}
  res.json({ status, payment_id: id, count: payments.length });
  } catch (e) {
    console.error('Error consultando estado de pago:', e);
    res.status(500).json({ error: 'No se pudo consultar el estado de pago' });
  }
});

// Webhook opcional para futuras integraciones: no interfiere con el flujo actual
app.post('/webhook', async (req, res) => {
  try {
    const topic = req.query?.topic || req.body?.type || null;
    const id = req.query?.id || req.body?.data?.id || null;
    if (!id) {
      console.warn('Webhook sin id');
      return res.status(200).json({ ok: true });
    }
    if (String(topic).includes('payment') || req.body?.type === 'payment') {
      try {
        const payment = await new Payment(client).get({ id });
        const ext = payment?.external_reference || null;
        if (fdb) {
          try { await fdb.collection('payments').add({ external_reference: ext, payment_id: payment?.id, status: payment?.status, amount: payment?.transaction_amount, preference_id: payment?.metadata?.preference_id || null, createdAt: admin.firestore.FieldValue.serverTimestamp() }); } catch {}
          const upd = { paymentStatus: payment?.status, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
          try { if (ext) await fdb.doc(`matches/${ext}`).update(upd); } catch {}
          try { if (ext) await fdb.doc(`bookings/${ext}`).update({ status: payment?.status === 'approved' ? 'confirmed' : 'pending_payment', updatedAt: admin.firestore.FieldValue.serverTimestamp() }); } catch {}
        }
      } catch (e) {
        console.warn('No se pudo obtener pago desde webhook:', e?.message || e);
      }
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error en webhook:', e);
    res.status(200).json({ ok: true });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Servidor de pagos Mercado Pago en http://localhost:${port}`);
});