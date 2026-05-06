-- ==========================================================
-- 🔐 ALEX IO — SECURITY HARDENING: RLS & DATA PRIVACY
-- ==========================================================

-- 1. Enable RLS on all tables (Public schema)
ALTER TABLE IF EXISTS bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rag_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_users ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all permissions from the 'anon' role (strict security)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- 3. Grant basic usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Create Isolation Policies (Multi-tenant)

-- BOTS: Owners can see/edit their own bots
CREATE POLICY "tenant_isolation" ON bots
    FOR ALL TO authenticated
    USING (auth.uid()::text = tenant_id)
    WITH CHECK (auth.uid()::text = tenant_id);

-- BOT_CONFIGS
CREATE POLICY "tenant_isolation" ON bot_configs
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = bot_configs.bot_id AND bots.tenant_id = auth.uid()::text));

-- LEADS
CREATE POLICY "tenant_isolation" ON leads
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = leads.bot_id AND bots.tenant_id = auth.uid()::text));

-- LEAD_TAGS
CREATE POLICY "tenant_isolation" ON lead_tags
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM leads JOIN bots ON bots.id = leads.bot_id WHERE leads.id = lead_tags.lead_id AND bots.tenant_id = auth.uid()::text));

-- CUSTOMER_MEMORIES
CREATE POLICY "tenant_isolation" ON customer_memories
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = customer_memories.bot_id AND bots.tenant_id = auth.uid()::text));

-- RAG_SOURCES
CREATE POLICY "tenant_isolation" ON rag_sources
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = rag_sources.bot_id AND bots.tenant_id = auth.uid()::text));

-- CHAT_SESSIONS
CREATE POLICY "tenant_isolation" ON chat_sessions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = chat_sessions.bot_id AND bots.tenant_id = auth.uid()::text));

-- AI_USAGE
CREATE POLICY "tenant_isolation" ON ai_usage
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = ai_usage.bot_id AND bots.tenant_id = auth.uid()::text));

-- APP_USERS (Only self-view)
CREATE POLICY "self_isolation" ON app_users
    FOR ALL TO authenticated
    USING (auth.uid() = id);

-- 5. FINAL CHECK: Block any data that doesn't have a tenant_id or ownership
CREATE POLICY "block_orphan_data" ON bots AS RESTRICTIVE FOR ALL TO public USING (tenant_id IS NOT NULL);


-- 4. Protection against Sensitive Data Exposure
-- Revoke all public access to sensitive columns (example: whatsapp_sessions)
-- Note: If you have a table with credentials, it's better to store them in Vault or use a separate schema.
-- For now, ensuring RLS is enabled on EVERYTHING is the first step.

-- 5. Special Case: Public Read-Only for specific resources (if needed)
-- Example: If a bot is "public", we could add a policy for anon users to read it.
-- But for a SaaS, we prefer strict isolation.

-- 6. Granting access to service_role (Admin bypass)
-- By default, service_role bypasses RLS. 
-- Ensure the server uses SERVICE_ROLE_KEY for administrative tasks.

-- 7. Verification
-- To verify, you can run: SELECT * FROM pg_policies;
