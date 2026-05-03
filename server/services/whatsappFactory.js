/**
 * WhatsApp Multi-Provider Factory
 */

class MetaAPI {
    async send(to, msg) {
        console.log(`[MetaAPI] Sending to ${to}: ${msg}`);
        return true;
    }
}

class BaileysAPI {
    async send(to, msg) {
        console.log(`[BaileysAPI] Sending to ${to}: ${msg}`);
        return true;
    }
}

class DialogAPI {
    async send(to, msg) {
        console.log(`[360Dialog] Sending to ${to}: ${msg}`);
        return true;
    }
}

class WhatsAppFactory {
    static create(type) {
        switch(type) {
            case "meta": return new MetaAPI();
            case "baileys": return new BaileysAPI();
            case "360dialog": return new DialogAPI();
            default: return new BaileysAPI();
        }
    }
}

async function sendSafe(providers, to, msg) {
    for (let p of providers) {
        try {
            return await p.send(to, msg);
        } catch {
            continue;
        }
    }
    throw new Error("ALL WA PROVIDERS DOWN");
}

module.exports = { WhatsAppFactory, sendSafe };
