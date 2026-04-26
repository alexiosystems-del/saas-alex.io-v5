// WhatsApp Client Service - Restored from V2 Proven Pattern
// Polyfill for global crypto (Required for Baileys on some Node envs)
if (!global.crypto) {
    global.crypto = require('crypto');
}

const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.status = 'DISCONNECTED';
        this.qrCodeUrl = null;
        this.pairingCode = null;
        this.phoneNumber = null;
        this.io = null;
        this.logs = [];
        this.lastError = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.cachedVersion = null;
        this.sessionsDir = path.resolve('auth_info_baileys');
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type}] ${msg}`;
        console.log(logEntry);
        this.logs.unshift(logEntry);
        if (this.logs.length > 50) this.logs.pop();
    }

    setSocket(io) {
        this.io = io;
        this.initializeClient();
    }

    async initializeClient() {
        this.log("Initializing WhatsApp Client (V2 Proven Pattern)...");
        this.lastError = null;

        try {
            // 1. Ensure sessions directory exists
            if (!fs.existsSync(this.sessionsDir)) {
                fs.mkdirSync(this.sessionsDir, { recursive: true });
            }

            // 2. Clean corrupted sessions (no creds.json = broken state)
            const credsPath = path.join(this.sessionsDir, 'creds.json');
            if (!fs.existsSync(credsPath) && fs.existsSync(this.sessionsDir)) {
                const files = fs.readdirSync(this.sessionsDir);
                if (files.length > 0) {
                    this.log('⚠️ No creds.json found but session dir has files. Cleaning...');
                    fs.rmSync(this.sessionsDir, { recursive: true, force: true });
                    fs.mkdirSync(this.sessionsDir, { recursive: true });
                }
            }

            // 3. Fetch latest WA Web version (V6 Protocol Hardening from V2)
            if (!this.cachedVersion) {
                try {
                    const { version, isLatest } = await fetchLatestBaileysVersion();
                    this.cachedVersion = version;
                    this.log(`📡 WA Version: ${version.join('.')} (latest: ${isLatest})`);
                } catch (err) {
                    this.log('⚠️ Could not fetch WA version, using Baileys default', 'warn');
                    this.cachedVersion = undefined;
                }
            }

            // 4. Auth State (Local File System - proven stable)
            const { state, saveCreds } = await useMultiFileAuthState(this.sessionsDir);

            // 5. Create Socket (V2 Proven Config)
            this.sock = makeWASocket({
                auth: state,
                version: this.cachedVersion,
                printQRInTerminal: true,
                logger: pino({ level: 'silent' }),
                browser: ['Windows', 'Chrome', '20.0.04'],
                syncFullHistory: false,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 25000,
                markOnlineOnConnect: false,
            });

            this.log('📡 Socket created. Waiting for connection...');
            this.status = 'CONNECTING';
            if (this.io) this.io.emit('wa_status', { status: 'CONNECTING' });

            // 6. Connection Update Handler (V2 Pattern)
            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;
                const closeCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.statusCode || null;

                if (qr) {
                    this.log('📱 QR Code received!');
                    QRCode.toDataURL(qr).then((url) => {
                        this.qrCodeUrl = url;
                        this.status = 'QR_READY';
                        if (this.io) {
                            this.io.emit('wa_qr', { qr: qr });
                            this.io.emit('wa_status', { status: 'QR_READY' });
                        }
                    }).catch((err) => {
                        this.log(`❌ QR conversion failed: ${err.message}`, 'error');
                    });
                }

                if (connection === 'close') {
                    const isLogout = closeCode === DisconnectReason.loggedOut;
                    const isBadSession = closeCode === 405;

                    this.lastError = `Connection closed (code: ${closeCode})`;
                    this.log(`⚠️ ${this.lastError}`, 'warn');
                    this.status = 'DISCONNECTED';
                    if (this.io) this.io.emit('wa_status', { status: 'DISCONNECTED' });

                    if (isBadSession) {
                        this.log('🛑 Bad session (405). Wiping auth and stopping.', 'error');
                        try { fs.rmSync(this.sessionsDir, { recursive: true, force: true }); } catch (_) { }
                        fs.mkdirSync(this.sessionsDir, { recursive: true });
                        // Don't auto-reconnect on 405 — let user trigger via dashboard
                        return;
                    }

                    if (isLogout) {
                        this.log('🚪 Logged out by user. Clearing session.', 'warn');
                        try { fs.rmSync(this.sessionsDir, { recursive: true, force: true }); } catch (_) { }
                        fs.mkdirSync(this.sessionsDir, { recursive: true });
                        return;
                    }

                    // Auto-reconnect with backoff (V2 pattern)
                    this.reconnectAttempts++;
                    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                        const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts - 1), 60000);
                        this.log(`🔁 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                        setTimeout(() => this.initializeClient(), delay);
                    } else {
                        this.log(`❌ Max reconnect attempts reached (${this.maxReconnectAttempts}). Giving up.`, 'error');
                    }

                } else if (connection === 'open') {
                    this.reconnectAttempts = 0;
                    this.log('✅ WHATSAPP CONNECTED! 🚀');
                    this.status = 'READY';
                    this.qrCodeUrl = null;
                    this.pairingCode = null;
                    this.lastError = null;
                    if (this.io) this.io.emit('wa_status', { status: 'READY' });
                }
            });

            // 7. Save Credentials
            this.sock.ev.on('creds.update', saveCreds);

            // 8. Message Handler
            this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type !== 'notify') return;

                for (const msg of messages) {
                    if (!msg.message || msg.key.fromMe) continue;
                    if (msg.key.remoteJid === 'status@broadcast') continue;

                    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
                    if (!text) continue;

                    const from = msg.key.remoteJid;
                    this.log(`📩 Message from ${from}: ${text.substring(0, 30)}...`);

                    if (this.io) this.io.emit('wa_log', {
                        from: from.replace('@s.whatsapp.net', ''),
                        body: text,
                        timestamp: new Date()
                    });

                    if (text === '!ping') {
                        await this.sock.sendMessage(from, { text: 'pong 🏓' });
                        continue;
                    }

                    // AI Router (lazy require to avoid circular deps)
                    try {
                        const { generateResponse } = require('./aiRouter');
                        await this.sock.sendPresenceUpdate('composing', from);
                        const replyText = await generateResponse(text, 'ALEX_MIGRATION', []);
                        await this.sock.sendMessage(from, { text: replyText });
                        this.log(`📤 Replied to ${from.replace('@s.whatsapp.net', '')}`);
                    } catch (routerError) {
                        this.log(`Router Error: ${routerError.message}`, 'error');
                    }
                }
            });

        } catch (fatalErr) {
            this.lastError = fatalErr.message;
            this.log(`❌ FATAL INIT ERROR: ${fatalErr.message}`, 'error');
            console.error(fatalErr);
        }
    }

    async clearSession() {
        this.log("⚠️ WIPING SESSION DATA...");
        try {
            if (fs.existsSync(this.sessionsDir)) {
                fs.rmSync(this.sessionsDir, { recursive: true, force: true });
                this.log("✅ Local auth folder deleted.");
            }

            this.status = 'DISCONNECTED';
            this.pairingCode = null;
            this.reconnectAttempts = 0;
            this.phoneNumber = null;
            this.qrCodeUrl = null;

            if (this.sock) {
                try { this.sock.end(undefined); } catch (e) { }
                this.sock = null;
            }

            this.log("✅ SESSION CLEARED. Ready to re-pair.");
            return true;
        } catch (error) {
            this.log(`❌ Failed to wipe session: ${error.message}`, 'error');
            return false;
        }
    }

    getStatus() {
        return {
            status: this.status,
            qr: this.qrCodeUrl,
            pairingCode: this.pairingCode,
            phoneNumber: this.phoneNumber,
            last_error: this.lastError,
            logs: this.logs
        };
    }
}

module.exports = new WhatsAppService();
