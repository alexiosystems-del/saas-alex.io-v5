// server/services/billingService.js
// Enterprise Billing Engine (Phase 4) - Stripe Integration
const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

async function createSubscription(customerId, priceId) {
    if (!stripe) throw new Error("Stripe no configurado.");
    
    console.log(`💳 [Billing] Creando suscripción para ${customerId} con precio ${priceId}`);
    return await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
    });
}

async function createCustomer(email, name, metadata = {}) {
    if (!stripe) return { id: `mock_cus_${Date.now()}` };
    return await stripe.customers.create({
        email,
        name,
        metadata
    });
}

module.exports = { createSubscription, createCustomer };
