const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');

/**
 * GET /api/memories
 * Lista memorias del tenant actual.
 * Filtros opcionales: customer_id, category
 */
router.get('/', async (req, res) => {
    const { customer_id, category } = req.query;
    const tenantId = req.tenant.id;

    try {
        let query = supabase
            .from('customer_memories')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('importance', { ascending: false })
            .order('created_at', { ascending: false });

        if (customer_id) query = query.eq('customer_id', customer_id);
        if (category) query = query.eq('category', category);

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error fetching memories:', err.message);
        res.status(500).json({ error: 'Error al obtener memorias' });
    }
});

/**
 * GET /api/memories/summary/:customerId
 * Obtiene el resumen estadístico de un cliente
 */
router.get('/summary/:customerId', async (req, res) => {
    const { customerId } = req.params;
    const tenantId = req.tenant.id;

    try {
        const { data, error } = await supabase
            .from('customer_memory_summary')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('customer_id', customerId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || { total_memories: 0 });
    } catch (err) {
        console.error('Error fetching summary:', err.message);
        res.status(500).json({ error: 'Error al obtener resumen' });
    }
});

/**
 * POST /api/memories
 * Crea o actualiza una memoria manualmente (Source = 'manual')
 */
router.post('/', async (req, res) => {
    const { customer_id, content, category, importance, expires_at } = req.body;
    const tenantId = req.tenant.id;

    if (!customer_id || !content) {
        return res.status(400).json({ error: 'customer_id y content son requeridos' });
    }

    try {
        // Obtenemos embedding para la memoria manual (opcional, pero recomendado para búsqueda semántica)
        const { getEmbedding } = require('../services/alexBrain');
        const embedding = await getEmbedding(content);

        const { data, error } = await supabase.rpc('upsert_customer_memory', {
            p_tenant_id: tenantId,
            p_customer_id: customer_id,
            p_content: content,
            p_embedding: embedding,
            p_category: category || 'fact',
            p_importance: importance || 3,
            p_source: 'manual',
            p_expires_at: expires_at || null
        });

        if (error) throw error;
        res.json({ success: true, id: data });
    } catch (err) {
        console.error('Error saving memory:', err.message);
        res.status(500).json({ error: 'Error al guardar memoria' });
    }
});

/**
 * DELETE /api/memories/:id
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const tenantId = req.tenant.id;

    try {
        const { error } = await supabase
            .from('customer_memories')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting memory:', err.message);
        res.status(500).json({ error: 'Error al eliminar memoria' });
    }
});

module.exports = router;
