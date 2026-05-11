/**
 * ═══════════════════════════════════════════════════════════════
 * 🏢 ALEX IO — CRM PRO Enterprise Service
 * 
 * Full-featured embedded CRM: lead lifecycle, pipeline stages,
 * tagging, notes, activity log, and deal tracking.
 * ═══════════════════════════════════════════════════════════════
 */
const { supabase, isSupabaseEnabled } = require('./supabaseClient');

const PIPELINE_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

/**
 * Upsert a lead with full metadata.
 */
async function upsertLeadPro(data) {
  if (!data.business_id || !data.phone) {
    console.error('[CRM] upsertLeadPro: missing required fields', { 
      business_id: data.business_id, phone: data.phone 
    });
    return { error: 'Missing required fields' };
  }

  const now = new Date().toISOString();

  const metadata = {
    ...(data.utm_source   && { utm_source: data.utm_source }),
    ...(data.utm_campaign && { utm_campaign: data.utm_campaign }),
    ...(data.ad_id        && { ad_id: data.ad_id }),
    ...(data.referrer     && { referrer: data.referrer }),
    last_seen: now
  };

  const payload = {
    business_id: data.business_id,
    phone: data.phone.replace(/\D/g, ''), // normalizar — solo dígitos
    name: data.name || null,
    source: data.source || 'organic',
    stage: data.stage || 'new',
    score: typeof data.score === 'number' ? data.score : 0,
    metadata,
    updated_at: now
  };

  const { data: lead, error } = await supabase
    .from('crm_leads')
    .upsert(payload, { 
      onConflict: 'business_id,phone',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error('[CRM] upsertLeadPro error:', error.message, { payload });
    return { error: error.message };
  }

  return { data: lead };
}

/**
 * Move a lead to a new pipeline stage.
 */
async function moveStage(leadId, newStage) {
  if (!PIPELINE_STAGES.includes(newStage)) {
    throw new Error(`Invalid stage: ${newStage}. Valid: ${PIPELINE_STAGES.join(', ')}`);
  }

  const { data, error } = await supabase
    .from('crm_leads')
    .update({ stage: newStage, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw error;

  // Log the activity
  await logActivity(leadId, 'stage_change', { to: newStage });
  return data;
}

/**
 * Add a note to a lead.
 */
async function addNote(leadId, authorId, content) {
  const { data, error } = await supabase
    .from('crm_notes')
    .insert({
      lead_id: leadId,
      author_id: authorId,
      content
    })
    .select()
    .single();

  if (error) throw error;
  await logActivity(leadId, 'note_added', { preview: content.slice(0, 100) });
  return data;
}

/**
 * Log an activity for audit trail.
 */
async function logActivity(leadId, activityType, details = {}) {
  try {
    await supabase.from('crm_activity_log').insert({
      lead_id: leadId,
      activity_type: activityType,
      details
    });
  } catch (e) {
    console.warn('⚠️ [CRM-PRO] logActivity failed:', e.message);
  }
}

/**
 * Get leads by business with filtering and pagination.
 */
async function getLeads(businessId, { stage, limit = 50, offset = 0, search } = {}) {
  let query = supabase
    .from('crm_leads')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (stage) query = query.eq('stage', stage);
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) throw error;
  return { leads: data || [], total: count || 0 };
}

/**
 * Get a single lead with notes and activity log.
 */
async function getLeadDetail(leadId) {
  const [leadRes, notesRes, activityRes] = await Promise.all([
    supabase.from('crm_leads').select('*').eq('id', leadId).single(),
    supabase.from('crm_notes').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(20),
    supabase.from('crm_activity_log').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(50)
  ]);

  if (leadRes.error) throw leadRes.error;

  return {
    lead: leadRes.data,
    notes: notesRes.data || [],
    activity: activityRes.data || []
  };
}

/**
 * Get pipeline summary (count per stage) for a business.
 */
async function getPipelineSummary(businessId) {
  const { data, error } = await supabase
    .from('crm_leads')
    .select('stage')
    .eq('business_id', businessId);

  if (error) throw error;

  const summary = {};
  for (const s of PIPELINE_STAGES) summary[s] = 0;
  for (const row of (data || [])) {
    if (summary[row.stage] !== undefined) summary[row.stage]++;
  }
  return summary;
}

/**
 * Tag a lead.
 */
async function addTag(leadId, tag) {
  const { data: lead } = await supabase.from('crm_leads').select('tags').eq('id', leadId).single();
  const tags = lead?.tags || [];
  if (!tags.includes(tag)) {
    tags.push(tag);
    await supabase.from('crm_leads').update({ tags }).eq('id', leadId);
    await logActivity(leadId, 'tag_added', { tag });
  }
}

/**
 * Assign a lead to a team member.
 */
async function assignLead(leadId, userId) {
  await supabase.from('crm_leads').update({ assigned_to: userId, updated_at: new Date().toISOString() }).eq('id', leadId);
  await logActivity(leadId, 'assigned', { to: userId });
}

module.exports = {
  upsertLeadPro,
  moveStage,
  addNote,
  logActivity,
  getLeads,
  getLeadDetail,
  getPipelineSummary,
  addTag,
  assignLead,
  PIPELINE_STAGES
};
