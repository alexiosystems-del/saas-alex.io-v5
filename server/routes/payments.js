const PLANS = require('../config/plans');
const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const cryptoService = require('../services/cryptoPaymentService');
const { supabase } = require('../services/supabaseClient');

// --- STRIPE ROUTES ---

// Crear sesión de pago Stripe
router.post('/stripe/checkout', async (req, res) => {
    try {
        const { email, plan, tenantId } = req.body; // plan: STARTER, PRO, ENTERPRISE

        const priceId = PLANS[plan]?.stripe_price_id;
        if (!priceId) return res.status(400).json({ error: 'Plan inválido' });

        const session = await paymentService.createCheckoutSession(
            email,
            priceId,
            `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            `${process.env.FRONTEND_URL}/pricing`,
            { plan, tenantId: tenantId || email }
        );

        res.json({ url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Webhook de Stripe
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = paymentService.constructWebhookEvent(req.body, sig);
        const eventId = event.id;

        // 1. Check Idempotency
        if (supabase) {
            const { data: existingEvent } = await supabase
                .from('stripe_events')
                .select('event_id')
                .eq('event_id', eventId)
                .single();

            if (existingEvent) {
                console.log(`ℹ️ [Stripe] Evento ${eventId} ya procesado. Ignorando.`);
                return res.json({ received: true, duplicate: true });
            }
        }

        console.log(`🔔 [Stripe] Procesando evento: ${event.type} (${eventId})`);

        // Manejar eventos de cumplimiento (Fulfillment)
        const fulfillmentEvents = ['checkout.session.completed', 'invoice.payment_succeeded'];
        
        if (fulfillmentEvents.includes(event.type)) {
            const dataObject = event.data.object;
            const metadata = dataObject.metadata || {};
            const plan = metadata.plan;
            const tenantId = metadata.tenantId || dataObject.customer_email || dataObject.customer;

            if (tenantId && plan && supabase) {
                const planConfig = PLANS[plan];
                const newLimit = planConfig ? planConfig.max_messages_monthly : 500;

                try {
                    // Update usage limits automatically
                    const { error: usageError } = await supabase.from('tenant_usage_metrics')
                        .upsert({ 
                            tenant_id: tenantId, 
                            plan_limit: newLimit, 
                            updated_at: new Date().toISOString() 
                        }, { onConflict: 'tenant_id' });

                    if (usageError) throw usageError;

                    // Update user profile if exists
                    await supabase.from('profiles')
                        .update({ role: plan.toLowerCase(), updated_at: new Date().toISOString() })
                        .eq('id', tenantId); // Use ID (UUID) if possible, fallback to email handled by metadata

                    console.log(`✅ [Stripe] Suscripción/Pago procesado para ${tenantId}. Plan: ${plan}, Límite: ${newLimit}`);
                } catch (dbErr) {
                    console.error(`⚠️ [Stripe DB Update Error]:`, dbErr.message);
                    // We don't return error yet, we want to log the event even if DB update fails to avoid infinite retries from Stripe
                }
            } else {
                console.log('✅ Pago recibido (sin metadata suficiente):', eventId);
            }
        } else if (event.type === 'customer.subscription.deleted') {
            console.log('❌ Suscripción cancelada:', event.data.object.id);
            // logic to downgrade tenant could go here
        }

        // 2. Mark event as processed (Idempotency storage)
        if (supabase) {
            await supabase.from('stripe_events').insert({
                event_id: eventId,
                type: event.type,
                tenant_id: event.data.object.metadata?.tenantId || null,
                payload: event
            });
        }

        res.json({ received: true });
    } catch (err) {
        console.error('❌ Webhook Error:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

// --- CRYPTO ROUTES ---

// Obtener direcciones de pago
router.get('/crypto/addresses', (req, res) => {
    res.json(cryptoService.getPaymentAddresses());
});

// Crear factura Crypto
router.post('/crypto/invoice', async (req, res) => {
    try {
        const { email, plan, currency } = req.body; // currency: BTC, USDT, ETH
        const invoice = await cryptoService.createInvoice(email, plan, currency);
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verificar estado de pago Crypto
router.get('/crypto/invoice/:id', async (req, res) => {
    try {
        const status = await cryptoService.verifyPayment(req.params.id);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
