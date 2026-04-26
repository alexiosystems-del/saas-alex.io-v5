/**
 * ALEX IO SaaS - Plan Definitions & Quotas
 * Source of truth for Stripe mapping and runtime limit enforcement.
 */
const PLANS = {
    STARTER: {
        id: 'STARTER',
        name: 'Starter / Piloto',
        price_monthly: 49,
        max_bots: 1,
        max_messages_monthly: 1000,
        features: ['basic_ai', 'whatsapp_broadcast'],
        stripe_price_id: process.env.STRIPE_PRICE_STARTER || 'price_starter_default'
    },
    PRO: {
        id: 'PRO',
        name: 'Professional / Growth',
        price_monthly: 149,
        max_bots: 5,
        max_messages_monthly: 10000,
        features: ['rag_knowledge', 'whatsapp_broadcast', 'crm_sync', 'voice_ai'],
        stripe_price_id: process.env.STRIPE_PRICE_PRO || 'price_pro_default'
    },
    ENTERPRISE: {
        id: 'ENTERPRISE',
        name: 'Enterprise / Scale',
        price_monthly: 499,
        max_bots: 20,
        max_messages_monthly: 50000,
        features: ['rag_knowledge', 'whatsapp_broadcast', 'crm_sync', 'voice_ai', 'audit_logs', 'dedicated_redis', 'priority_support'],
        stripe_price_id: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_default'
    }
};

module.exports = PLANS;
