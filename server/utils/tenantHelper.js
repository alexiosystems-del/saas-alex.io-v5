const { supabase, supabaseAdmin } = require('../services/supabaseClient');

/**
 * Creates a scoped database accessor for a specific tenant.
 * Enforces tenant_id on all queries.
 */
const getTenantDb = (tenantId, useAdmin = false) => {
    if (!tenantId) {
        throw new Error('Tenant ID is required for database operations.');
    }

    const client = useAdmin ? supabaseAdmin : supabase;

    return {
        from: (table) => {
            const query = client.from(table);
            
            // Override select, update, delete to always include tenant_id
            const originalSelect = query.select.bind(query);
            const originalUpdate = query.update.bind(query);
            const originalDelete = query.delete.bind(query);
            const originalInsert = query.insert.bind(query);
            const originalUpsert = query.upsert.bind(query);

            return {
                ...query,
                select: (...args) => originalSelect(...args).eq('tenant_id', tenantId),
                update: (...args) => originalUpdate(...args).eq('tenant_id', tenantId),
                delete: (...args) => originalDelete(...args).eq('tenant_id', tenantId),
                // For insert/upsert, we ensure tenant_id is in the data
                insert: (data, ...args) => {
                    const enrichedData = Array.isArray(data) 
                        ? data.map(item => ({ ...item, tenant_id: tenantId }))
                        : { ...data, tenant_id: tenantId };
                    return originalInsert(enrichedData, ...args);
                },
                upsert: (data, ...args) => {
                    const enrichedData = Array.isArray(data) 
                        ? data.map(item => ({ ...item, tenant_id: tenantId }))
                        : { ...data, tenant_id: tenantId };
                    return originalUpsert(enrichedData, ...args);
                }
            };
        },
        rpc: (fn, args) => {
            // Ensure tenant_id is passed to the RPC if the RPC expects it
            return client.rpc(fn, { ...args, p_tenant_id: tenantId });
        }
    };
};

module.exports = { getTenantDb };
