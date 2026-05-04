require('dotenv').config();
require('./utils/envValidator').validateEnv(); // FASE 0: Asegura que haya secrets
const express = require('express');
// ALEX IO HEARTBEAT - 2026-04-30 02:00
const BOOT_TIME = new Date().toISOString();
const cors = require('cors');
const pino = require('pino');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// --- CONFIGURATION ---
const app = express();
app.set('trust proxy', 1); // Trust Render's load balancer (1 hop)
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
logger.info('✅ Express trust proxy enabled');

// --- SECURITY MIDDLEWARES ---
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { authenticateTenant } = require('./middleware/auth');
const { getHealthSnapshot, getMetrics } = require('./services/observability');
const { requestLogger } = require('./middleware/requestLogger');
const botPool = require('./services/botPoolRouter');

// Redis Client (centralized service)
const { redis, isRedisEnabled } = require('./services/redisService');
let limiterStore = undefined;

if (isRedisEnabled) {
    limiterStore = new RedisStore({
        sendCommand: (...args) => redis.call(...args),
    });
}

// Rate Limiting Global (IP based)
const globalLimiter = rateLimit({
    store: limiterStore,
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 100, // Máximo 100 peticiones por ventana
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Demasiadas peticiones. Por favor, intenta más tarde.', code: 'RATE_LIMIT_EXCEEDED' }
});

// Rate Limiting para endpoints sensibles (Auth/Connect) - TIGHTENED FOR PRODUCTION
const sensitiveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    limit: process.env.NODE_ENV === 'production' ? 30 : 100, // 30/hr in prod, 100/hr in dev
    message: { error: 'Límite de intentos operativos excedido. Por favor, protege tu cuenta y espera una hora.', code: 'SENSITIVE_LIMIT_EXCEEDED' }
});

// Rate Limiting por Tenant (Solo para usuarios autenticados)
const tenantLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    limit: (req) => {
        const plan = req.tenant?.plan || 'FREE';
        if (plan === 'ENTERPRISE') return 5000;
        if (plan === 'PRO') return 1000;
        return 100; // FREE/STARTER default
    },
    keyGenerator: (req) => req.tenant?.id || req.ip,
    message: { error: 'Límite de cuota de API excedido para tu plan.', code: 'TENANT_QUOTA_EXCEEDED' }
});

// Rate Limiting para endpoints sensibles (Auth/Connect) - RELAXED FOR TESTING
app.use(globalLimiter);
app.use(requestLogger);

// --- SECURE CORS (PHASE 0) ---
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

// Auto-include common Render URLs if not explicitly set
if (allowedOrigins.length === 0) {
    allowedOrigins.push(
        'https://whatsapp-fullstack-ylsx.onrender.com',
        'https://whatsapp-fullstack-1-yjao.onrender.com',
        'http://localhost:5173',
        'http://localhost:3000'
    );
}

// --- CORS CONFIGURATION (PERMISSIVE UNTIL STRICT LIST VALIDATED) ---
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// --- SECURITY HEADERS ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https://*.supabase.co", "https://*.onrender.com", "https://*.google.com"],
            "connect-src": ["'self'", "https://*.supabase.co", "https://*.onrender.com", "https://*.google.com", "https://*.openai.com"]
        }
    }
}));

// Middleware
const jsonParser = express.json();

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Stripe y TikTok requieren body crudo para validar firma de webhook (HMAC).
app.use((req, res, next) => {
    if (req.path === '/api/payments/stripe/webhook') return next();
    if (req.path === '/api/webhooks/tiktok' || req.path === '/api/webhooks/discord') {
        // TikTok/Discord Ed25519 necesitan raw body — parseamos manualmente después
        return express.raw({ type: '*/*' })(req, res, next);
    }
    return jsonParser(req, res, next);
});

// In-Memory Cache Fallback
const NodeCache = require('node-cache');
global.responseCache = global.responseCache || new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1 hour TTL

// --- AUTH ROUTES (Public) ---
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getJwtSecret } = require('./middleware/auth');
const { supabase, isSupabaseEnabled } = require('./services/supabaseClient');

const ADMIN_EMAILS = ['visasytrabajos@gmail.com', 'admin@demo.com', 'admin@alex.io'];
const TENANT_ID = '11111111-1111-1111-1111-111111111111';

function generatePrompt(data) {
  return `
Eres un asistente experto en ${data.industry}.

OBJETIVO: ${data.objective}
TONO: ${data.tone}

REGLAS:
- Responde claro y corto
- Cierra ventas
- Usa lenguaje natural
- Si no sabes algo, deriva a humano

CONTEXTO:
${data.extra || ''}
`;
}

const buildToken = (user) => {
    const email = user.email;
    const userRole = user.user_metadata?.role || 'OWNER';
    const isAdmin = ADMIN_EMAILS.includes(email?.toLowerCase().trim()) || userRole === 'SUPERADMIN';
    const tenantId = isAdmin
        ? 'tenant_superadmin'
        : user.id; // Use Supabase UUID as immutable tenantId

    return {
        token: jwt.sign({
            tenantId,
            email,
            plan: user.user_metadata?.plan || (isAdmin ? 'ENTERPRISE' : 'PRO'),
            role: isAdmin ? 'SUPERADMIN' : userRole
        }, getJwtSecret(), { expiresIn: '7d' }),
        tenantId,
        role: isAdmin ? 'SUPERADMIN' : userRole
    };
};

const sessionExchangeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === 'production' ? 120 : 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: 'Demasiados intentos de validación de sesión. Intenta nuevamente en unos minutos.', code: 'SESSION_EXCHANGE_LIMIT_EXCEEDED' }
});

// POST /api/auth/session-exchange
// Exchange a Supabase access_token for a backend JWT
app.post('/api/auth/session-exchange', sessionExchangeLimiter, jsonParser, async (req, res) => {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'Supabase access_token is required' });

    if (!isSupabaseEnabled) {
        return res.status(503).json({ error: 'Supabase connection is not available' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(access_token);

        if (error || !user) {
            return res.status(401).json({ error: 'Sesión de Supabase inválida o expirada' });
        }

        const { token, tenantId, role } = buildToken(user);
        res.json({ token, tenantId, role });
    } catch (err) {
        console.error('Session exchange error:', err.message);
        res.status(500).json({ error: 'Error al verificar sesión' });
    }
});

// POST /api/auth/register
// Backend registration with auto-confirm to bypass Supabase email limits
app.post('/api/auth/register', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const { supabaseAdmin } = require('./services/supabaseClient');
    if (!supabaseAdmin) {
        return res.status(501).json({ error: 'El registro automático requiere SUPABASE_SERVICE_ROLE_KEY en el servidor. Usa registro normal.' });
    }

    try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: role || 'OWNER', plan: 'PRO' }
        });

        if (error) {
            if (error.message.includes('already been registered')) {
                return res.status(409).json({ error: 'El usuario ya existe. Usa Iniciar Sesión.' });
            }
            throw error;
        }
        res.json({ success: true, message: 'Usuario creado y confirmado automáticamente.', user: data.user });
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).json({ error: 'Error al registrar usuario: ' + err.message });
    }
});

// Legacy login removed to enforce Supabase Auth.
app.post('/api/auth/login', (req, res) => {
    res.status(410).json({
        error: 'Este endpoint está obsoletos (AUTH_DEPRECATED). Use Supabase Auth + /api/auth/session-exchange.',
        code: 'AUTH_DEPRECATED'
    });
});

// --- FRONTEND CONFIGURATION (Vite dist support) ---
const clientPath = fs.existsSync(path.resolve(__dirname, '../client/dist')) 
    ? path.resolve(__dirname, '../client/dist')
    : path.resolve(__dirname, '../client/build');
logger.info(`🔍 Serving frontend from: ${clientPath}`);

if (fs.existsSync(path.join(clientPath, 'index.html'))) {
    logger.info(`✅ Frontend build found at ${clientPath}`);
    // Static assets first (JS, CSS, Images)
    app.use(express.static(clientPath, {
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.html')) {
                res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            }
        }
    }));
} else {
    logger.warn(`⚠️ Frontend build NOT found at ${clientPath}. Check Render build command.`);
}

// --- API ROUTES ---
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        version: 'v2.1.0',
        platform: 'ALEX IO SAAS',
        features: ['V6 Protocol Hardening', 'V8 Multi-Tenancy', 'TTS Voice', 'Sales Engine V5'],
        users: 'Optimized for scale'
    });
});

// AI Diagnostics Endpoint (shows which keys are configured/dead)
app.get('/api/diagnostics/ai', (req, res) => {
    const { getAiDiagnostics } = require('./services/alexBrain');
    res.json(getAiDiagnostics());
});



// WIZARD + CREACIÓN DE BOT (LEGACY/FALLBACK)
app.post("/save-bot", async (req, res) => {
  const { config, prompt } = req.body;
  const { data, error } = await supabase
    .from("bots")
    .insert({ name: config.botName || 'Nuevo Bot', prompt })
    .select();

  if (error) return res.status(500).json(error);
  res.json(data);
});

// GLOBAL CONTROL SYSTEM
app.get("/system-status", async (req, res) => {
  const bots = await supabase.from("bots").select("*");
  res.json({
    ai: "ok",
    db: "ok",
    bots: bots.data ? bots.data.length : 0,
    whatsapp: "ready"
  });
});

app.get('/api/sre/health', authenticateTenant, (req, res) => {
    if (req.tenant?.role !== 'SUPERADMIN') {
        return res.status(403).json({ error: 'Acceso denegado: solo SuperAdmin' });
    }
    return res.json({ success: true, health: getHealthSnapshot() });
});

app.get('/api/sre/logs', authenticateTenant, async (req, res) => {
    if (req.tenant?.role !== 'SUPERADMIN') {
        return res.status(403).json({ error: 'Acceso denegado: solo SuperAdmin' });
    }
    
    try {
        const { data, error } = await supabase
            .from('system_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return res.json({ success: true, logs: data || [] });
    } catch (error) {
        console.error('Error fetching logs:', error.message);
        return res.status(500).json({ error: 'Error fetching logs' });
    }
});

// Multi-Platform Webhooks (Public endpoints for providers)
const webhooksMulti = require('./routes/webhooks-multi');
app.use('/api/webhooks', webhooksMulti);

// ============================================
// ENTERPRISE SAAS API - CONSOLIDATED (V5)
// ============================================
const enterpriseRouter = require('./routes/leadsAndBroadcast');
app.use('/api/saas', authenticateTenant, tenantLimiter, enterpriseRouter);

// GET MESSAGES (For Compliance/Audit)
app.get('/api/saas/messages', async (req, res) => {
  try {
    const { instance_id, limit = 50 } = req.query;
    
    let query = supabase
      .from('messages')
      .select(`
        id,
        remote_jid,
        direction,
        content,
        message_hash,
        previous_hash,
        audit_flag,
        audit_reason,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (instance_id) query = query.eq('instance_id', instance_id);
    if (req.query.remote_jid) query = query.eq('remote_jid', req.query.remote_jid);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, messages: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST FEEDBACK
app.get('/api/saas/feedback', async (req, res) => {
    // Only superadmin or internal audit should see this
    res.status(403).json({ error: 'Unauthorized' });
});

app.post('/api/saas/feedback', async (req, res) => {
  try {
    const { message, category } = req.body;
    const { data, error } = await supabase
      .from('feedback')
      .insert([{ user_id: req.user?.id, message, category }]);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST PROFILE
app.post('/api/saas/profile', async (req, res) => {
  try {
    const profile = req.body;
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: req.user?.id,
        ...profile,
        updated_at: new Date()
      });
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET SUBSCRIPTION USAGE
app.get('/api/saas/subscription/usage', async (req, res) => {
  try {
    // In a real multi-tenant app, we'd get user_id from JWT
    // For now, we'll fetch global or first user for demo
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, plans(*)')
      .limit(1)
      .single();

    const { count: botCount } = await supabase
      .from('bots')
      .select('*', { count: 'exact', head: true });

    res.json({
      plan: profile?.plans || { name: 'Free', max_bots: 3, max_messages_monthly: 1000 },
      usage: {
        messages_sent: 0, // Need to implement message logging
        bot_count: botCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE BOT
app.put('/api/saas/bots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, prompt, voice_enabled, industry, objective } = req.body;

    const { data: bot, error } = await supabase
      .from('bots')
      .update({
        name,
        prompt,
        voice_enabled: voice_enabled === true || voice_enabled === 'true',
        industry,
        objective
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE BOT
app.delete('/api/saas/bots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete config first (cascade should handle it, but let's be explicit if needed)
    await supabase.from('bot_configs').delete().eq('bot_id', id);
    
    const { error } = await supabase
      .from('bots')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET LEADS
app.get('/api/saas/leads', async (req, res) => {
  try {
    const { temp, status, instance_id } = req.query;
    let query = supabase.from('leads').select('*, lead_tags(tag)');
    if (temp && temp !== 'all') query = query.eq('temperature', temp.toUpperCase());
    if (status && status !== 'all') query = query.eq('status', status.toUpperCase());
    if (instance_id) query = query.eq('instance_id', instance_id);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ leads: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET TAGS
app.get('/api/saas/leads/tags', async (req, res) => {
  try {
    const { data, error } = await supabase.from('lead_tags').select('tag');
    if (error) throw error;
    const unique = [...new Set(data.map(t => t.tag))];
    res.json({ tags: unique });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MEMORIES
app.get('/api/memories', async (req, res) => {
  try {
    const { customer_id } = req.query;
    const { data, error } = await supabase
      .from('customer_memories')
      .select('*')
      .eq('customer_id', customer_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/memories', async (req, res) => {
  try {
    const { customer_id, memory, bot_id } = req.body;
    const { data, error } = await supabase
      .from('customer_memories')
      .insert([{ customer_id, memory, bot_id }])
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DEBUG
app.get('/api/debug/system', async (req, res) => {
  try {
    const { data: bots } = await supabase.from('bots').select('*');
    const { data: configs } = await supabase.from('bot_configs').select('*');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      v: 'V5-INLINE',
      bots: bots?.length || 0,
      configs: configs?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

console.log('✅ SAAS API Routes registered inline (V5)');

// WhatsApp Routes (Protected & Rate Limited by Tenant)
// WhatsApp Core Logic
const { router: whatsappRouter, restoreSessions } = require('./services/whatsappSaas');
app.post('/api/saas/connect', authenticateTenant, sensitiveLimiter); 
app.use('/api/saas', authenticateTenant, tenantLimiter, whatsappRouter);

// Payment Routes (Protected & Rate Limited by Tenant)
const paymentsRouter = require('./routes/payments');
app.use('/api/payments', authenticateTenant, tenantLimiter, paymentsRouter);

// Live Chat Routes
const livechatRouter = require('./routes/livechat');
app.use('/api/livechat', authenticateTenant, tenantLimiter, livechatRouter);

// CHAT INTELIGENTE (FIX CORE)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, bot_id } = req.body;
    const { data: bot } = await supabase
      .from('bots')
      .select('*')
      .eq('id', bot_id)
      .single();

    if (!bot) return res.json({ reply: "Bot no encontrado" });

    const finalPrompt = `${bot.prompt}\n\nUSER: ${message}\nAI:`;

    const { OpenAI } = require('openai');
    const openai = new OpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: finalPrompt }]
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RAG (FUNCIONAL REAL)
app.post('/api/rag/upload', async (req, res) => {
  const { name, content } = req.body;
  const { data, error } = await supabase
    .from('rag_sources')
    .insert([{ name, content, type: 'text' }]);

  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

// CRM PRO Enterprise Routes
const crmRouter = require('./routes/crm');
app.use('/api/crm', authenticateTenant, tenantLimiter, crmRouter);

// Health Check (Public or Internal)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        redis: redis ? 'connected' : 'disabled',
        cache: global.responseCache.getStats(),
        botPool: { size: botPool.getPoolStatus().length }
    });
});

// Enterprise Bot Pool Status API
app.get('/api/pool/status', authenticateTenant, (req, res) => {
    res.json({ success: true, bots: botPool.getPoolStatus() });
});

// Observability Metrics Endpoint (Phase 5)
app.get('/api/metrics/:instance_id/:channel', authenticateTenant, (req, res) => {
    const { instance_id, channel } = req.params;
    const data = getMetrics(instance_id, channel);
    if (!data) return res.status(404).json({ error: "No metrics" });
    res.json(data);
});

// --- SPA CATCH-ALL (must be AFTER all API routes) ---
app.get('*', (req, res, next) => {
    // Si la ruta empieza por /api/, no es para el frontend
    if (req.path.startsWith('/api/')) {
        return next();
    }
    
    // Si es un asset que no se encontró en express.static
    if (req.path.startsWith('/assets/')) {
        console.warn(`⚠️ Asset 404: ${req.path}`);
        return res.status(404).type('text/plain').send('Asset not found');
    }

    // Para todo lo demás, servir index.html (SPA routing)
    if (fs.existsSync(path.join(clientPath, 'index.html'))) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.sendFile(path.join(clientPath, 'index.html'));
    } else {
        return res.status(404).send('Frontend not built');
    }
});


app.use((err, req, res, next) => {
    console.error('❌ Express unhandled error:', err.message, 'path:', req.path);
    if (req.path.startsWith('/assets/')) {
        return res.status(404).type('text/plain').send('Asset not found');
    }
    return res.status(500).json({ 
        error: err.message || 'Internal server error' 
    });
});

// --- START SERVER ---
app.listen(PORT, async () => {
    logger.info(`🚀 ALEX IO SERVER V2 CORRIENDO EN ${HOST}:${PORT}`);
    logger.info(`📡 WhatsApp Handler Listo...`);
    logger.info(`🧠 AI Brain Listo... backend está esperando, 50 sin drama`);

    // Auto-restore previous sessions
    restoreSessions().catch(e => logger.error(`❌ Session restoration failed: ${e.message}`));

    // Phase 4: Hydrate Bot Pool from DB and start health monitor
    await botPool.hydratePool().catch(e => logger.error(`❌ Bot Pool hydration failed: ${e.message}`));
    botPool.startHealthMonitor(60000);
    logger.info(`🏊 Bot Pool Router Activo.`);
});
