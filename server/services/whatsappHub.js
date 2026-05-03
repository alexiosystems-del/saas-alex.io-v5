class WhatsAppHub {
  constructor(providers) {
    this.providers = providers;
  }

  async send(to, msg) {
    for (let p of this.providers) {
      try {
        return await p.sendMessage(to, msg);
      } catch (e) {
        console.log("Provider failed:", p.name);
      }
    }

    throw new Error("ALL WHATSAPP PROVIDERS FAILED");
  }
}

module.exports = WhatsAppHub;
