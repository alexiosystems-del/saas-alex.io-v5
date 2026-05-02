const { supabase } = require('./supabaseClient');

/**
 * Enterprise Memory Service (Phase 3)
 * Persists context per business and user phone.
 */
async function saveMemory(businessId, phone, data) {
  try {
    const { error } = await supabase.from('memory').upsert({
      business_id: businessId,
      user_phone: phone,
      context: data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'business_id,user_phone' });
    
    if (error) throw error;
  } catch (err) {
    console.warn('⚠️ [MemoryService] Failed to save memory:', err.message);
  }
}

async function getMemory(businessId, phone) {
  try {
    const { data, error } = await supabase
      .from('memory')
      .select('context')
      .eq('business_id', businessId)
      .eq('user_phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.context || {};
  } catch (err) {
    console.warn('⚠️ [MemoryService] Failed to get memory:', err.message);
    return {};
  }
}

module.exports = { saveMemory, getMemory };
