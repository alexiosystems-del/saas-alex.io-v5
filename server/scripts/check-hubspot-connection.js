#!/usr/bin/env node
/**
 * HubSpot connectivity check for ALEX IO SaaS.
 *
 * Usage:
 *   HUBSPOT_PRIVATE_APP_TOKEN=xxx node scripts/check-hubspot-connection.js
 */

const axios = require('axios');

const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_ACCESS_TOKEN || '';

if (!token) {
    console.error('❌ Missing HUBSPOT_PRIVATE_APP_TOKEN (or HUBSPOT_ACCESS_TOKEN)');
    process.exit(1);
}

const client = axios.create({
    baseURL: 'https://api.hubapi.com',
    timeout: 15000,
    headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

async function run() {
    try {
        console.log('🔎 Checking HubSpot token validity...');
        const accountRes = await client.get('/account-info/v3/details');
        const account = accountRes.data || {};

        console.log(`✅ HubSpot account reachable: portalId=${account.portalId || 'unknown'} name=${account.portalName || 'unknown'}`);

        console.log('🔎 Checking CRM Contacts API access...');
        const contactsRes = await client.post('/crm/v3/objects/contacts/search', {
            filterGroups: [],
            properties: ['email', 'phone', 'firstname', 'lastname'],
            limit: 1
        });

        const total = contactsRes.data?.total ?? 0;
        console.log(`✅ CRM contacts API reachable. Sample total=${total}`);
        console.log('🎉 HubSpot integration prerequisites look good.');
    } catch (error) {
        const status = error.response?.status;
        const payload = error.response?.data;
        console.error(`❌ HubSpot check failed${status ? ` (HTTP ${status})` : ''}`);
        if (payload) {
            console.error(JSON.stringify(payload, null, 2));
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

run();
