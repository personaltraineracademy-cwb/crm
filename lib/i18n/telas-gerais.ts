/**
 * Textos das telas gerais que entraram com a identidade Unnify (etapa 7):
 * a moldura das telas de acesso e os rótulos reescritos em frase normal.
 * Mesmo formato de `agenda-servicos.ts`: a chave é o português.
 */
export const TEXTOS_TELAS_GERAIS = {
  // Painel de marca das telas de acesso (`components/auth/TelaDeAcesso.tsx`).
  "Atendimento, vendas e equipe no mesmo lugar": {
    es: "Atención, ventas y equipo en un solo lugar",
  },
  "Entre para acompanhar as conversas, as oportunidades e as tarefas da sua empresa.": {
    es: "Inicia sesión para seguir las conversaciones, las oportunidades y las tareas de tu empresa.",
  },
  "Conversas em um só lugar": { es: "Conversaciones en un solo lugar" },
  "As mensagens dos canais conectados chegam na mesma caixa de entrada da equipe.": {
    es: "Los mensajes de los canales conectados llegan a la misma bandeja de entrada del equipo.",
  },
  "Funil de vendas organizado": { es: "Embudo de ventas organizado" },
  "Cada oportunidade tem etapa, responsável e próxima ação.": {
    es: "Cada oportunidad tiene etapa, responsable y próxima acción.",
  },
  "IA que trabalha com a equipe": { es: "IA que trabaja con el equipo" },
  "Agentes de IA respondem, resumem e passam a conversa para uma pessoa quando precisa.": {
    es: "Los agentes de IA responden, resumen y pasan la conversación a una persona cuando hace falta.",
  },
  "Acesso protegido por senha e, quando ativada, verificação em duas etapas.": {
    es: "Acceso protegido por contraseña y, cuando está activada, verificación en dos pasos.",
  },
  // Tarefas: nome dos dois controles segmentados (leitor de tela).
  "De quem são as tarefas": { es: "De quién son las tareas" },
  Visualização: { es: "Visualización" },
  // Desempenho: o erro da tela inteira, agora com `Alert` (o `EmptyState` de
  // antes traduzia por chave dinâmica, que a catraca não enxergava).
  "Não consegui carregar o desempenho": { es: "No pude cargar el rendimiento" },
  "Pode ser uma falha de rede, ou este painel pode não estar incluído no plano da sua empresa.": {
    es: "Puede ser una falla de red, o este panel puede no estar incluido en el plan de tu empresa.",
  },
  // Admin › Dashboard: rótulos dos KPIs em frase normal (DS §14).
  "Tenants ativos": { es: "Tenants activos" },
  "LGPD em risco": { es: "LGPD en riesgo" },
  // Propostas: o rótulo do item tirado pelo assistente, em frase normal.
  removido: { es: "eliminado" },
} satisfies Record<string, { es: string }>;
