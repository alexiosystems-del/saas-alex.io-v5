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
  if (!isSupabaseEnabled) return null;
  try {
    const payload = {
      business_id: data.business_id,
      phone: data.phone,
      name: data.name || null,
      email: data.email || null,
      source: data.source || 'whatsapp',
      stage: data.stage || 'new',
      score: data.score || 0,
      tags: data.tags || [],
      last_message: data.last_message || null,
      metadata: data.metadata || {},
      assigned_to: data.assigned_to || null,
      updated_at: new Date().toISOString()
    };

    const { data: result, error } = await supabase
      .from('crm_leads')
      .upsert(payload, { onConflict: 'business_id,phone' })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (e) {
    console.warn('⚠️ [CRM-PRO] upsertLeadPro failed:', e.message);
    return null;
  }
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
