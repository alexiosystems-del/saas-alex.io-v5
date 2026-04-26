// Script to replace broadcast endpoint in whatsappSaas.js
const fs = require('fs');
const filePath = './server/services/whatsappSaas.js';

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Lines 2192-2295 (0-indexed: 2191-2294) — the old broadcast endpoint
const before = lines.slice(0, 2191);
const after = lines.slice(2295); // line 2296+ (0-indexed 2295+)

const newBlock = `// --- BROADCAST JOBS (in-memory tracking) ---
const broadcastJobs = new Map(); // key: campaignId, value: { instanceId, tenantId, total, sent, failed, status, startedAt, finishedAt, errors[] }

// --- BROADCAST (MARKETING / CAMPAÑAS MASIVAS) ---
router.post('/broadcast', async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const tenantRole = req.tenant?.role;
        if (!tenantId) return res.status(403).json({ error: 'Autorización requerida' });

        const { instanceId, phones, message, mediaUrl, mediaType } = req.body;
        if (!instanceId || !phones || !Array.isArray(phones) || !message) {
            return res.status(400).json({ error: 'instanceId, phones (array) y message son requeridos' });
        }

        // Runtime-first config (works for active instances on Render without local config.json)
        let config = clientConfigs.get(instanceId);

        // Fallback to DB metadata for persisted sessions
        if (!config && isSupabaseEnabled) {
            try {
                const { data: session } = await supabase
                    .from(sessionsTable)
                    .select('instance_id, tenant_id, provider, company_name, meta_api_url, meta_phone_number_id, meta_access_token, dialog_api_key')
                    .eq('instance_id', instanceId)
                    .eq('tenant_id', tenantId)
                    .single();

                if (session) {
                    config = {
                        instanceId: session.instance_id,
                        provider: session.provider || 'baileys',
                        companyName: session.company_name || 'Bot',
                        tenantId: session.tenant_id,
                        metaApiUrl: session.meta_api_url,
                        metaPhoneNumberId: session.meta_phone_number_id,
                        metaAccessToken: session.meta_access_token,
                        dialogApiKey: session.dialog_api_key
                    };
                }
            } catch (_) { }
        }

        if (!config) {
            const configPath = \`\${sessionsDir}/\${instanceId}/config.json\`;
            if (fs.existsSync(configPath)) {
                config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } else {
                return res.status(404).json({ error: 'Instancia no encontrada o inactiva' });
            }
        }

        if (!config.instanceId) config.instanceId = instanceId;

        // --- Validar ownership (tenant solo puede usar sus propios bots) ---
        if (tenantRole !== 'SUPERADMIN' && config.tenantId && config.tenantId !== tenantId) {
            return res.status(403).json({ error: 'No tenés permiso para enviar desde esta instancia.' });
        }

        // --- Validar cuota de mensajes del plan ---
        if (isSupabaseEnabled) {
            try {
                const { data: usage } = await supabase
                    .from(usageTable)
                    .select('messages_sent, plan_limit')
                    .eq('tenant_id', tenantId)
                    .single();

                if (usage && usage.plan_limit > 0) {
                    const remaining = usage.plan_limit - (usage.messages_sent || 0);
                    if (phones.length > remaining) {
                        return res.status(429).json({
                            error: \`Cuota insuficiente. Disponibles: \${remaining} msgs, solicitados: \${phones.length}. Upgrade de plan requerido.\`
                        });
                    }
                }
            } catch (_) { /* Usage table may not exist yet, skip quota check */ }
        }

        // --- Create campaign job for tracking ---
        const campaignId = \`bc_\${instanceId}_\${Date.now()}\`;
        const job = {
            campaignId,
            instanceId,
            tenantId,
            total: phones.length,
            sent: 0,
            failed: 0,
            status: 'running',
            startedAt: new Date().toISOString(),
            finishedAt: null,
            errors: []
        };
        broadcastJobs.set(campaignId, job);

        // Respond immediately with campaign ID for status tracking
        res.json({
            success: true,
            message: \`Iniciando broadcast a \${phones.length} números en segundo plano.\`,
            queued: phones.length,
            campaignId
        });

        // Background Processor
        (async () => {
            console.log(\`📣 [BROADCAST] Iniciando campaña \${campaignId} para \${instanceId} a \${phones.length} destinatarios...\`);
            const { getAdapter } = require('./adapterFactory');

            for (let i = 0; i < phones.length; i++) {
                let rawPhone = String(phones[i]).replace(/\\D/g, '');
                if (!rawPhone) { job.failed++; continue; }

                // For Baileys format
                let jid = rawPhone.includes('@s.whatsapp.net') ? rawPhone : \`\${rawPhone}@s.whatsapp.net\`;

                try {
                    const adapter = getAdapter(config, activeSessions);
                    
                    if (!adapter) throw new Error(\`Proveedor \${config.provider} no soportado o no configurado.\`);

                    await adapter.sendMessage(rawPhone, message, { mediaUrl, mediaType });
                    
                    job.sent++;
                    console.log(\`✅ [BROADCAST] \${campaignId} (\${job.sent}/\${job.total}) -> \${rawPhone}\`);

                    // Log in Supabase messages for tracking (non-blocking)
                    if (isSupabaseEnabled) {
                        supabase.from('messages').insert({
                            instance_id: instanceId,
                            tenant_id: tenantId,
                            remote_jid: jid,
                            direction: 'OUTBOUND',
                            message_type: mediaUrl ? mediaType : 'text',
                            content: \`[BROADCAST] \${mediaUrl ? \`[Media: \${mediaType}] \` : ''}\${message}\`
                        }).then(() => {}).catch(() => {});
                    }
                } catch (err) {
                    job.failed++;
                    job.errors.push({ phone: rawPhone, error: err.message, at: new Date().toISOString() });
                    console.warn(\`⚠️ [BROADCAST] Error enviando a \${rawPhone}:\`, err.message);
                }

                // Anti-ban randomized delay (35s-60s)
                if (i < phones.length - 1) {
                    const delayMs = 35000 + Math.floor(Math.random() * 25000);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }

            job.status = 'finished';
            job.finishedAt = new Date().toISOString();
            console.log(\`📣 [BROADCAST FINISHED] \${campaignId}: \${job.sent} enviados, \${job.failed} fallidos.\`);

            // Auto-cleanup old jobs after 2 hours
            setTimeout(() => broadcastJobs.delete(campaignId), 2 * 60 * 60 * 1000);
        })();

    } catch (err) {
        console.error('❌ Error iniciando Broadcast:', err.message);
        if (!res.headersSent) res.status(500).json({ error: 'Error interno en broadcast' });
    }
});

// --- BROADCAST STATUS (polling de progreso) ---
router.get('/broadcast/status/:campaignId', (req, res) => {
    const tenantId = req.tenant?.id;
    if (!tenantId) return res.status(403).json({ error: 'Autorización requerida' });

    const { campaignId } = req.params;
    const job = broadcastJobs.get(campaignId);

    if (!job) return res.status(404).json({ error: 'Campaña no encontrada o expirada.' });

    // Verificar ownership (solo el tenant dueño o SUPERADMIN)
    if (req.tenant?.role !== 'SUPERADMIN' && job.tenantId !== tenantId) {
        return res.status(403).json({ error: 'Sin acceso a esta campaña.' });
    }

    const progress = job.total > 0 ? Math.round(((job.sent + job.failed) / job.total) * 100) : 0;

    res.json({
        success: true,
        campaignId: job.campaignId,
        status: job.status,
        total: job.total,
        sent: job.sent,
        failed: job.failed,
        progress,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        errors: job.errors.slice(-10) // Last 10 errors max
    });
});`;

const result = [...before, ...newBlock.split('\n'), ...after].join('\n');
fs.writeFileSync(filePath, result, 'utf8');
console.log('✅ Broadcast endpoint replaced successfully');
console.log('New total lines:', result.split('\n').length);
