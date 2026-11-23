"use client";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import {
  janelaDoPeriodo,
  type DashboardDeLeads,
  type PeriodoDoDashboard,
} from "@/lib/metrics/dashboard";

/**
 * Os números do Dashboard para o período escolhido. A janela é calculada no
 * relógio de quem olha (meia-noite local) e o fuso vai junto, para o "por dia"
 * cair no dia certo.
 */
export function useDashboard(periodo: PeriodoDoDashboard) {
  return useQuery({
    queryKey: ["metrics", "dashboard", periodo],
    queryFn: async () => {
      const { from, to } = janelaDoPeriodo(periodo);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
      const qs = new URLSearchParams({ from, to, tz }).toString();
      return apiClient.get<{ data: DashboardDeLeads }>(`/api/v1/metrics/dashboard?${qs}`);
    },
    staleTime: 30_000,
  });
}
