/**
 * ALEX IO — i18n Translations System
 * Idiomas: ES, EN, FR, DE, ZH
 */

export const translations = {
  es: {
    dashboard: {
      title: "Consola Global ALEX IO",
      total_users: "Usuarios Totales",
      active_bots: "Bots Activos",
      revenue: "Ingresos (Est.)",
      messages: "Mensajes Totales",
      ai_status: "Estado de APIs de IA",
      client_list: "Lista de Clientes",
      search_placeholder: "Buscar por email...",
      last_interaction: "Última interacción",
      plan: "Plan"
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
    dashboard: {
      title: "ALEX IO Global Console",
      total_users: "Total Users",
      active_bots: "Active Bots",
      revenue: "Revenue (Est.)",
      messages: "Total Messages",
      ai_status: "AI API Status",
      client_list: "Client List",
      search_placeholder: "Search by email...",
      last_interaction: "Last interaction",
      plan: "Plan"
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
    dashboard: {
      title: "Console Mondiale ALEX IO",
      total_users: "Utilisateurs Totaux",
      active_bots: "Bots Actifs",
      revenue: "Revenus (Est.)",
      messages: "Total des Messages",
      ai_status: "État de l'API IA",
      client_list: "Liste de Clients",
      search_placeholder: "Rechercher par email...",
      last_interaction: "Dernière interaction",
      plan: "Plan"
    }
  },
  de: {
    dashboard: {
      title: "ALEX IO Globale Konsole",
      total_users: "Benutzer Gesamt",
      active_bots: "Aktive Bots",
      revenue: "Umsatz (geschätzt)",
      messages: "Nachrichten Gesamt",
      ai_status: "KI-API Status",
      client_list: "Kundenliste",
      search_placeholder: "Suche nach E-Mail...",
      last_interaction: "Letzte Interaktion",
      plan: "Tarif"
    }
  },
  zh: {
    dashboard: {
      title: "ALEX IO 全球控制台",
      total_users: "总用户数",
      active_bots: "活跃机器人",
      revenue: "预估收入",
      messages: "总消息数",
      ai_status: "人工智能 API 状态",
      client_list: "客户列表",
      search_placeholder: "通过电子邮件搜索...",
      last_interaction: "最后互动",
      plan: "方案"
    }
  }
};

export const getTranslation = (lang, path) => {
  const keys = path.split('.');
  let result = translations[lang] || translations['es'];
  for (const key of keys) {
    if (result[key]) result = result[key];
    else return path; // Devuelve el path si no encuentra la traducción
  }
  return result;
};
