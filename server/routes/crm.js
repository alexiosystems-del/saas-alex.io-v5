/**
 * ═══════════════════════════════════════════════════════════════
 * 🏢 ALEX IO — CRM PRO API Routes
 * ═══════════════════════════════════════════════════════════════
 */
const express = require('express');
const router = express.Router();
const crm = require('../services/crmProService');

// GET /api/crm/leads?stage=new&search=juan&limit=50&offset=0
router.get('/leads', async (req, res) => {
  try {
    const businessId = req.tenant?.id || req.query.business_id;
    if (!businessId) return res.status(400).json({ error: 'business_id or tenant required' });

    const { stage, search, limit, offset } = req.query;
    const result = await crm.getLeads(businessId, {
      stage,
      search,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/crm/leads/:id — Full detail with notes + activity
router.get('/leads/:id', async (req, res) => {
  try {
    const detail = await crm.getLeadDetail(req.params.id);
    res.json(detail);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/crm/leads — Create or update a lead
router.post('/leads', async (req, res) => {
  try {
    const lead = await crm.upsertLeadPro({
      business_id: req.tenant?.id || req.body.business_id,
      ...req.body
    });
    res.json({ success: true, lead });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/crm/leads/:id/stage — Move lead through pipeline
router.patch('/leads/:id/stage', async (req, res) => {
  try {
    const { stage } = req.body;
    const lead = await crm.moveStage(req.params.id, stage);
    res.json({ success: true, lead });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/crm/leads/:id/notes — Add a note
router.post('/leads/:id/notes', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const note = await crm.addNote(req.params.id, req.tenant?.id || 'system', content);
    res.json({ success: true, note });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/crm/leads/:id/tag — Add a tag
router.post('/leads/:id/tag', async (req, res) => {
  try {
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ error: 'tag required' });
    await crm.addTag(req.params.id, tag);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/crm/leads/:id/assign — Assign to team member
router.post('/leads/:id/assign', async (req, res) => {
  try {
    const { user_id } = req.body;
    await crm.assignLead(req.params.id, user_id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/crm/pipeline — Pipeline summary (count per stage)
router.get('/pipeline', async (req, res) => {
  try {
    const businessId = req.tenant?.id || req.query.business_id;
    const summary = await crm.getPipelineSummary(businessId);
    res.json({ success: true, pipeline: summary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
