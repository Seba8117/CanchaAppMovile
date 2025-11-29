import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import admin from 'firebase-admin';
import { GoogleAuth } from 'google-auth-library';

const accessToken = process.env.MP_ACCESS_TOKEN;
if (!accessToken) {
  console.error('MP_ACCESS_TOKEN no está definido en el entorno.');
  process.exit(1);
}

const client = new MercadoPagoConfig({ accessToken });
let fdb = null;
let projectId = null;
let svcAuthCreds = null;
try {
  const svcRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (svcRaw) {
    const svc = JSON.parse(svcRaw);
    admin.initializeApp({ credential: admin.credential.cert(svc) });
    fdb = admin.firestore();
    projectId = svc.project_id || process.env.FIREBASE_PROJECT_ID || null;
    svcAuthCreds = svc;
  }
} catch {}
const app = express();
app.use(cors());
app.use(express.json());

app.post('/create_preference', async (req, res) => {
  try {
    const { items, external_reference, payer_email, payment_methods, expiration_date_from, expiration_date_to, binary_mode, statement_descriptor, application_fee, seller_id, seller_token } = req.body || {};
    const backBase = process.env.MP_BACK_URL_BASE || 'http://localhost:3000/';
    const baseClean = String(backBase).replace(/\/$/, '');
    const successUrl = `${baseClean}/?mp=return&status=approved&ref=${encodeURIComponent(external_reference || '')}`;
    const back_urls = { success: successUrl, failure: baseClean, pending: baseClean };
    if (!Array.isArray(items) || items.length === 0 || !external_reference) {
      return res.status(400).json({ error: 'Parametros inválidos' });
    }
    let clientToUse = client;
    try {
      let tokenCandidate = seller_token || null;
      if (!tokenCandidate && fdb && seller_id) {
        const docRef = fdb.doc(`owners/${seller_id}`);
        const snap = await docRef.get();
        const data = snap.exists ? snap.data() : null;
        tokenCandidate = data?.mp_access_token || null;
      }
      if (tokenCandidate) {
        clientToUse = new MercadoPagoConfig({ accessToken: tokenCandidate });
      }
    } catch {}
    const pref = await new Preference(clientToUse).create({
      body: {
        items,
        external_reference,
        payer: payer_email ? { email: payer_email } : undefined,
        back_urls,
        // auto_return removed to avoid strict requirement on back_urls.success during sandbox/local
        notification_url: process.env.MP_WEBHOOK_URL || undefined,
        payment_methods,
        expiration_date_from,
        expiration_date_to,
        binary_mode,
        statement_descriptor,
        metadata: { seller_id: seller_id || null },
        application_fee: (typeof application_fee === 'number' && application_fee > 0) ? application_fee : undefined,
      },
    });
    try {
      if (fdb) {
        const itemsAmount = Array.isArray(items) ? items.reduce((s, it) => s + Number(it.unit_price || 0) * Number(it.quantity || 1), 0) : 0;
        const expectedFee = 0;
        const appliedFee = (typeof application_fee === 'number' && application_fee > 0) ? application_fee : 0;
        const discrepancy = appliedFee > 0;
        if (discrepancy) {
          console.warn('Comisión aplicada cuando debería ser 0', { appliedFee, itemsAmount, external_reference });
        }
        await fdb.collection('commission_audit').add({
          preference_id: pref?.id || null,
          external_reference,
          application_fee: appliedFee,
          seller_id: seller_id || null,
          items_amount: itemsAmount,
          expected_fee: expectedFee,
          discrepancy,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch {}
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

app.get('/mp/oauth/start', async (req, res) => {
  try {
    if (String(process.env.MP_OAUTH_ENABLED) === 'false') return res.status(503).json({ error: 'oauth_disabled' });
    const sellerId = req.query?.seller_id || null;
    const clientId = process.env.MP_CLIENT_ID;
    const redirectUri = process.env.MP_OAUTH_REDIRECT || `http://localhost:${process.env.PORT || 4000}/mp/oauth/callback`;
    if (!clientId) return res.status(500).json({ error: 'MP_CLIENT_ID missing' });
    const url = `https://auth.mercadopago.com/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(sellerId || '')}`;
    res.json({ url });
  } catch (e) {
    res.status(500).json({ error: 'oauth_start_failed' });
  }
});

app.get('/mp/oauth/callback', async (req, res) => {
  try {
    const code = req.query?.code || null;
    const sellerId = req.query?.state || null;
    const clientId = process.env.MP_CLIENT_ID;
    const clientSecret = process.env.MP_CLIENT_SECRET;
    const redirectUri = process.env.MP_OAUTH_REDIRECT || `http://localhost:${process.env.PORT || 4000}/mp/oauth/callback`;
    if (!code || !clientId || !clientSecret) return res.status(400).send('Invalid');
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'authorization_code', client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri })
    });
    const data = await tokenRes.json();
    const tok = data?.access_token || null;
    if (tok && fdb && sellerId) {
      await fdb.doc(`dueno/${sellerId}`).set({ mp_access_token: tok }, { merge: true });
    }
    const backBase = process.env.MP_BACK_URL_BASE || 'http://localhost:3000/';
    res.redirect(backBase);
  } catch (e) {
    res.redirect((process.env.MP_BACK_URL_BASE || 'http://localhost:3000/') + '?oauth=error');
  }
});

// --- Firestore Admin: creación de índice compuesto para bookings ---
async function createCompositeIndex({ collectionGroup, fields }) {
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID no disponible');
  const auth = new GoogleAuth({ credentials: svcAuthCreds || undefined, scopes: ['https://www.googleapis.com/auth/datastore'] });
  const client = await auth.getClient();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/${encodeURIComponent(collectionGroup)}/indexes`;
  const body = {
    queryScope: 'COLLECTION',
    fields: fields.map((f) => ({ fieldPath: f.path, order: f.order })),
  };
  const r = await client.request({ url, method: 'POST', data: body });
  return r.data;
}

app.post('/firestore/indexes/ensure-bookings', async (req, res) => {
  try {
    const data = await createCompositeIndex({
      collectionGroup: 'bookings',
      fields: [
        { path: 'ownerId', order: 'ASCENDING' },
        { path: 'date', order: 'ASCENDING' },
      ],
    });
    res.json({ ok: true, data });
  } catch (e) {
    console.error('No se pudo crear índice bookings:', e?.message || e);
    res.status(500).json({ error: 'index_create_failed' });
  }
});

app.post('/firestore/indexes/create', async (req, res) => {
  try {
    const { collectionGroup, fields } = req.body || {};
    if (!collectionGroup || !Array.isArray(fields) || fields.length === 0) return res.status(400).json({ error: 'invalid_params' });
    const data = await createCompositeIndex({ collectionGroup, fields });
    res.json({ ok: true, data });
  } catch (e) {
    console.error('No se pudo crear índice:', e?.message || e);
    res.status(500).json({ error: 'index_create_failed' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Servidor de pagos Mercado Pago en http://localhost:${port}`);
});
