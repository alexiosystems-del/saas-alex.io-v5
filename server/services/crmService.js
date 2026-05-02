const { supabase } = require('./supabaseClient');

/**
 * Enterprise CRM Service (Phase 3)
 * Every conversation is a lead.
 */
async function upsertLead(businessId, phone, message) {
  try {
    const { error } = await supabase.from('leads').upsert({
      business_id: businessId,
      phone: phone,
      last_message: message,
      status: 'active',
      updated_at: new Date().toISOString()
    }, { onConflict: 'business_id,phone' });
    
    if (error) throw error;
  } catch (err) {
    console.warn('⚠️ [CRMService] Failed to upsert lead:', err.message);
  }
}

module.exports = { upsertLead };
