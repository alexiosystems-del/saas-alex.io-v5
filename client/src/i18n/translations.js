/**
 * ALEX IO — i18n Translations System
 * Idiomas: ES, EN, FR, DE, ZH
 */

export const supportedLanguages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: 'Chino' }
];

export const translations = {
  es: {
    nav: {
      dashboard: "Command Center",
      livechat: "Chat en Vivo (Gold)",
      knowledge: "Base de Conocimiento",
      crm: "CRM PRO Pipeline",
      campaigns: "Campañas de Growth",
      analytics: "Analíticas SRE",
      connectors: "Conectores",
      whatsapp: "WhatsApp QR",
      billing: "Facturación Premium",
      logout: "Cerrar Sesión",
      manage: "Gestionar"
    },
    dashboard: {
      title: "Neural Command Center",
      subtitle: "Orquestando inteligencia autónoma a escala global.",
      neuralLoad: "Carga Neural Total",
      initAgent: "Inicializar Agente",
      noBots: "No hay agentes activos.",
      precision: "Precisión AI",
      latency: "Latencia",
      leads: "Leads",
      uptime: "Uptime"
    },
    bot_config: {
      initiator: "Iniciador del Bot",
      business_type: "¿Qué vendes?",
      objective: "Objetivo Principal",
      tone: "Tono de Voz",
      save: "Guardar Estrategia",
      readiness: "Estado de Preparación"
    }
  },
  en: {
    nav: {
      dashboard: "Command Center",
      livechat: "Live Chat (Gold)",
      knowledge: "Knowledge Base",
      crm: "CRM PRO Pipeline",
      campaigns: "Growth Campaigns",
      analytics: "SRE Analytics",
      connectors: "Connectors",
      whatsapp: "WhatsApp QR",
      billing: "Premium Billing",
      logout: "Log Out",
      manage: "Manage"
    },
    dashboard: {
      title: "Neural Command Center",
      subtitle: "Orchestrating autonomous intelligence at global scale.",
      neuralLoad: "Total Neural Load",
      initAgent: "Initialize Agent",
      noBots: "No active agents.",
      precision: "AI Precision",
      latency: "Latency",
      leads: "Leads",
      uptime: "Uptime"
    },
    bot_config: {
      initiator: "Bot Initiator",
      business_type: "What do you sell?",
      objective: "Main Objective",
      tone: "Tone of Voice",
      save: "Save Strategy",
      readiness: "Readiness Status"
    }
  },
  fr: {
    nav: {
      dashboard: "Centre de Commandement",
      livechat: "Chat en Direct (Gold)",
      knowledge: "Base de Connaissances",
      crm: "Pipeline CRM PRO",
      campaigns: "Campagnes de Croissance",
      analytics: "Analyses SRE",
      connectors: "Connecteurs",
      whatsapp: "WhatsApp QR",
      billing: "Facturation Premium",
      logout: "Se Déconnecter",
      manage: "Gérer"
    },
    dashboard: {
      title: "Neural Command Center",
      subtitle: "Orchestrer l'intelligence autonome à l'échelle mondiale.",
      neuralLoad: "Charge Neurale Totale",
      initAgent: "Initialiser l'Agent",
      noBots: "Aucun agent actif.",
      precision: "Précision de l'IA",
      latency: "Latence",
      leads: "Prospects",
      uptime: "Temps de Funcionnement"
    }
  },
  de: {
    nav: {
      dashboard: "Kommandozentrale",
      livechat: "Live-Chat (Gold)",
      knowledge: "Wissensdatenbank",
      crm: "CRM PRO Pipeline",
      campaigns: "Wachstumskampagnen",
      analytics: "SRE-Analysen",
      connectors: "Anschlüsse",
      whatsapp: "WhatsApp QR",
      billing: "Premium-Abrechnung",
      logout: "Abmelden",
      manage: "Verwalten"
    },
    dashboard: {
      title: "Neural Command Center",
      subtitle: "Autonome Intelligenz auf globaler Ebene orchestrieren.",
      neuralLoad: "Gesamte neuronale Last",
      initAgent: "Agent initialisieren",
      noBots: "Keine aktiven Agenten.",
      precision: "KI-Präzision",
      latency: "Latenz",
      leads: "Kontakte",
      uptime: "Betriebszeit"
    }
  },
  zh: {
    nav: {
      dashboard: "指挥中心",
      livechat: "实时聊天 (黄金版)",
      knowledge: "知识库",
      crm: "CRM PRO 管道",
      campaigns: "增长活动",
      analytics: "SRE 分析",
      connectors: "连接器",
      whatsapp: "WhatsApp 二维码",
      billing: "高级计费",
      logout: "登出",
      manage: "管理"
    },
    dashboard: {
      title: "Neural Command Center",
      subtitle: "在全球范围内编排自主智能。",
      neuralLoad: "总神经负荷",
      initAgent: "初始化代理",
      noBots: "没有活跃的代理。",
      precision: "AI 精准度",
      latency: "延迟",
      leads: "线索",
      uptime: "运行时间"
    }
  }
};

// Current Language State
let currentLang = localStorage.getItem('alex_io_lang') || 'es';

export const getCurrentLanguage = () => currentLang;

export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('alex_io_lang', lang);
  }
};

export const t = (path) => {
  const keys = path.split('.');
  let result = translations[currentLang] || translations['es'];
  
  for (const key of keys) {
    if (result && result[key]) {
      result = result[key];
    } else {
      // Fallback to English if not found in current language
      let fallback = translations['en'];
      for (const fKey of keys) {
        if (fallback && fallback[fKey]) fallback = fallback[fKey];
        else return path;
      }
      return fallback;
    }
  }
  return result;
};
