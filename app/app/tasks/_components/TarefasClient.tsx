"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/auth/AuthProvider";
import { useT } from "@/hooks/i18n/useT";
import { ArrowsClockwise, CalendarBlank, ListChecks, Plus } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/tasks/useTasks";
import type { NovaTarefa, SituacaoDaTarefa, Tarefa } from "@/lib/tarefas/tipos";

import { CalendarioDeTarefas } from "./CalendarioDeTarefas";
import { FormularioDeTarefa } from "./FormularioDeTarefa";
import { ListaDeTarefas } from "./ListaDeTarefas";

/** "aberto" não é uma situação do banco: é o filtro que a tela abre por padrão. */
type FiltroDeSituacao = "aberto" | SituacaoDaTarefa;

export function TarefasClient({
  podeEditar,
  minhasDeInicio = false,
}: {
  podeEditar: boolean;
  minhasDeInicio?: boolean;
}) {
  const t = useT();
  const usuario = useUser();
  const [modo, setModo] = useState<"lista" | "calendario">("lista");
  const [situacao, setSituacao] = useState<FiltroDeSituacao>("aberto");
  const [minhas, setMinhas] = useState(minhasDeInicio);
  const [emEdicao, setEmEdicao] = useState<Tarefa | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [prazoSugerido, setPrazoSugerido] = useState<string | undefined>();
  // A CHAVE DE REMONTAGEM do formulário. Ele lê o estado inicial das props
  // (nada de `useEffect` sincronizando), então abrir duas vezes seguidas o
  // "Nova tarefa" precisa de uma chave NOVA — senão a segunda abertura traz o
  // que ficou digitado na primeira.
  const [aberturas, setAberturas] = useState(0);

  const {
    tarefas,
    carregando,
    falhou,
    recarregar,
    criarTarefa,
    editarTarefa,
    apagarTarefa,
    alternarConcluida,
  } = useTasks(
    situacao === "aberto" ? { aberto: true, minhas } : { status: situacao, minhas },
  );

  function abrirNova(dia?: string) {
    setEmEdicao(null);
    setPrazoSugerido(dia);
    setAberturas((n) => n + 1);
    setFormAberto(true);
  }

  function abrirEdicao(tarefa: Tarefa) {
    setEmEdicao(tarefa);
    setPrazoSugerido(undefined);
    setAberturas((n) => n + 1);
    setFormAberto(true);
  }

  async function salvar(entrada: NovaTarefa) {
    if (emEdicao) await editarTarefa(emEdicao.id, entrada);
    else await criarTarefa(entrada);
  }

  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title={t("Tarefas")}
        description={t(
          "O que ficou combinado, com prazo. Tarefa presa a um negócio aparece na linha do tempo dele.",
        )}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => recarregar()} disabled={carregando}>
              <ArrowsClockwise size={14} className={cn(carregando && "animate-spin")} aria-hidden />
              {t("Atualizar")}
            </Button>
            {podeEditar && (
              <Button size="sm" onClick={() => abrirNova()}>
                <Plus size={14} aria-hidden />
                {t("Nova tarefa")}
              </Button>
            )}
          </>
        }
      />

      {/* Filtros numa linha de 32, sem caixa (DS §11.2). "Minhas | Todas" e
          "Lista | Calendário" são visões, não ações: controle segmentado. */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={situacao} onValueChange={(v) => setSituacao(v as FiltroDeSituacao)}>
          <SelectTrigger className="h-8 w-[168px]" aria-label={t("Situação")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aberto">{t("Em aberto")}</SelectItem>
            <SelectItem value="pending">{t("Pendente")}</SelectItem>
            <SelectItem value="in_progress">{t("Em andamento")}</SelectItem>
            <SelectItem value="done">{t("Concluída")}</SelectItem>
            <SelectItem value="cancelled">{t("Cancelada")}</SelectItem>
          </SelectContent>
        </Select>

        <SegmentedControl
          aria-label={t("De quem são as tarefas")}
          value={minhas ? "minhas" : "todas"}
          onValueChange={(v) => setMinhas(v === "minhas")}
          options={[
            { value: "minhas", label: t("Minhas") },
            { value: "todas", label: t("Todas") },
          ]}
        />

        {/* O calendário tem 7 colunas: a 390px não cabe, e no celular fica a lista. */}
        <SegmentedControl
          className="hidden md:inline-flex"
          aria-label={t("Visualização")}
          value={modo}
          onValueChange={(v) => setModo(v)}
          options={[
            { value: "lista", label: t("Lista"), icon: <ListChecks size={14} aria-hidden /> },
            {
              value: "calendario",
              label: t("Calendário"),
              icon: <CalendarBlank size={14} aria-hidden />,
            },
          ]}
        />
      </div>

      {falhou ? (
        <Alert
          variant="destructive"
          action={
            <Button variant="outline" size="sm" onClick={() => recarregar()}>
              {t("Tentar novamente")}
            </Button>
          }
        >
          {t("Não foi possível carregar as tarefas.")}
        </Alert>
      ) : carregando ? (
        // A forma final da lista: linhas de 56 dentro do cartão.
        <div
          className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
          aria-busy
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex h-14 items-center gap-3 px-4">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="ml-auto h-4 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* A MESMA régua `md` que esconde o seletor esconde o calendário:
              escolhido no tablet deitado e girado para o celular, ele não pode
              ficar preso na tela sem o botão de voltar para a lista. */}
          {modo === "calendario" && (
            <div data-testid="tarefas-calendario" className="hidden md:block">
              <CalendarioDeTarefas
                tarefas={tarefas}
                podeEditar={podeEditar}
                aoAbrirTarefa={abrirEdicao}
                aoClicarNoDia={abrirNova}
              />
            </div>
          )}
          <div data-testid="tarefas-lista" className={cn(modo === "calendario" && "md:hidden")}>
            <ListaDeTarefas
              tarefas={tarefas}
              podeEditar={podeEditar}
              aoAlternarConcluida={alternarConcluida}
              aoEditar={abrirEdicao}
              aoApagar={(tarefa) => apagarTarefa(tarefa.id)}
            />
          </div>
        </>
      )}

      <FormularioDeTarefa
        key={aberturas}
        aberto={formAberto}
        aoMudarAbertura={setFormAberto}
        tarefa={emEdicao}
        prazoSugerido={prazoSugerido}
        // Com "Minhas" ligado, a tarefa nova nasce da pessoa: a lista que ela
        // está vendo filtra `assigned_to=me`, e uma tarefa sem responsável
        // sumiria da tela logo depois de salva.
        responsavelPadrao={minhas ? usuario.id : undefined}
        aoSalvar={salvar}
      />
    </div>
  );
}
