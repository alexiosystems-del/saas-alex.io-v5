function getWhatsAppProvider(type) {
  switch(type) {
    case "meta":
      return new MetaAPI();
    case "baileys":
      return new BaileysAPI();
    case "360dialog":
      return new DialogAPI();
  }
}

module.exports = { getWhatsAppProvider };
