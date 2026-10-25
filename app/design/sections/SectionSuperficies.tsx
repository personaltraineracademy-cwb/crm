"use client";

/**
 * Vitrine das superfícies do Unnify (etapa 3B): os componentes REAIS de
 * `components/ui/`, com os tokens do app (e não as variáveis `--ds-*` do
 * showcase antigo). Cada bloco mostra o componente e os estados que o DS pede:
 * vazio, carregando, erro, selecionado, rolagem.
 *
 * Fica fora do `.ds-section` de propósito: aquela classe redesenha `h2`/`h3`
 * e mentiria sobre o título do `PageHeader`.
 */
import { useState } from "react";
import {
  ChartColumn,
  ChartPie,
  Download,
  Inbox,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Bloco({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div>
        <p className="text-lg leading-7 font-semibold text-foreground">{titulo}</p>
        <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">{nota}</p>
      </div>
      {children}
    </section>
  );
}

const NEGOCIOS = [
  {
    id: "1",
    nome: "Clínica Bem Viver",
    etapa: "Proposta",
    dono: "AS",
    valor: "R$ 12.400,00",
    dias: 4,
  },
  {
    id: "2",
    nome: "Imobiliária Horizonte",
    etapa: "Qualificação",
    dono: "BR",
    valor: "R$ 8.900,00",
    dias: 11,
  },
  { id: "3", nome: "Studio Pilates Leve", etapa: "Negociação", dono: "CD", valor: null, dias: 2 },
  {
    id: "4",
    nome: "Escritório Martins & Lopes Advogados Associados",
    etapa: "Proposta",
    dono: "AS",
    valor: "R$ 31.000,00",
    dias: 19,
  },
];

export function SectionSuperficies() {
  const [abaPagina, setAbaPagina] = useState("geral");
  const [visao, setVisao] = useState<"rosca" | "mensal" | "barras">("mensal");
  const [lista, setLista] = useState<"grade" | "lista">("grade");
  const [selecionada, setSelecionada] = useState<string | null>("2");

  return (
    <div className="flex min-w-0 flex-col gap-12 rounded-xl bg-background p-4 text-sm text-foreground sm:p-8">
      <Bloco
        titulo="Cabeçalho de página"
        nota="Título 24/600, descrição 14 muted, ações à direita e as abas da página (line) abaixo. Na variante card, as visões seguintes viram controle segmentado."
      >
        <PageHeader
          title="Negócios"
          description="Acompanhe os negócios abertos e mova cada um para a próxima etapa."
          meta={
            <>
              <span>142 abertos</span>
              <span>Atualizado há 3 min</span>
            </>
          }
          badge={<Badge variant="info">Beta</Badge>}
          back={{ href: "/design", label: "Painel" }}
          actions={
            <>
              <Button variant="outline" size="sm">
                <Download className="size-4" aria-hidden="true" />
                Exportar
              </Button>
              <Button size="sm">Criar negócio</Button>
            </>
          }
        >
          <Tabs value={abaPagina} onValueChange={setAbaPagina}>
            <TabsList variant="line" aria-label="Seções de negócios">
              <TabsTrigger value="geral">Visão geral</TabsTrigger>
              <TabsTrigger value="funil">Funil</TabsTrigger>
              <TabsTrigger value="atividades">Atividades</TabsTrigger>
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            </TabsList>
            <TabsContent value="geral" className="text-muted-foreground">
              Conteúdo da aba Visão geral.
            </TabsContent>
            <TabsContent value="funil" className="text-muted-foreground">
              Conteúdo da aba Funil.
            </TabsContent>
            <TabsContent value="atividades" className="text-muted-foreground">
              Conteúdo da aba Atividades.
            </TabsContent>
            <TabsContent value="relatorios" className="text-muted-foreground">
              Conteúdo da aba Relatórios.
            </TabsContent>
          </Tabs>
        </PageHeader>

        <PageHeader
          variant="card"
          title="Campanha de outubro"
          badge={<Badge variant="success">Ativa</Badge>}
          meta={
            <>
              <span>1 a 31 de outubro</span>
              <span>Meta Ads</span>
            </>
          }
          actions={
            <Button variant="outline" size="sm">
              <RefreshCw className="size-4" aria-hidden="true" />
              Atualizar dados
            </Button>
          }
        >
          <div className="py-3">
            <SegmentedControl
              aria-label="Visões da campanha"
              size="md"
              value={visao}
              onValueChange={setVisao}
              options={[
                { value: "rosca", label: "Visão geral" },
                { value: "mensal", label: "Campanhas" },
                { value: "barras", label: "Funil" },
              ]}
            />
          </div>
        </PageHeader>
      </Bloco>

      <Bloco
        titulo="Abas"
        nota="Só duas formas: line para a navegação da página e segmented para alternar visão dentro de um cartão. A fila rola sem barra e esmaece o lado que tem aba escondida."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="max-w-xs min-w-0">
            <Tabs defaultValue="a">
              <TabsList variant="line" aria-label="Exemplo com rolagem">
                {["Visão geral", "Conversas", "Negócios", "Tarefas", "Arquivos", "Histórico"].map(
                  (n, i) => (
                    <TabsTrigger key={n} value={String.fromCharCode(97 + i)}>
                      {n}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
            </Tabs>
          </div>
          <div className="min-w-0">
            <Tabs defaultValue="dia">
              <TabsList aria-label="Período">
                <TabsTrigger value="dia">Dia</TabsTrigger>
                <TabsTrigger value="semana">Semana</TabsTrigger>
                <TabsTrigger value="mes">Mês</TabsTrigger>
                <TabsTrigger value="ano" disabled>
                  Ano
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Bloco>

      <Bloco
        titulo="Controle segmentado"
        nota="2 a 5 opções para trocar a visão dentro de um cartão. Peça de 28 (sm) ou 32 (md). Com iconOnlyOnMobile o rótulo some abaixo de 640px."
      >
        <div className="flex flex-wrap items-center gap-4">
          <SegmentedControl
            aria-label="Tipo de gráfico"
            value={visao}
            onValueChange={setVisao}
            options={[
              { value: "rosca", label: "Rosca", icon: <ChartPie /> },
              { value: "mensal", label: "Mensal", icon: <TrendingUp /> },
              { value: "barras", label: "Barras", icon: <ChartColumn /> },
            ]}
          />
          <SegmentedControl
            aria-label="Disposição"
            value={lista}
            onValueChange={setLista}
            iconOnlyOnMobile
            options={[
              { value: "grade", label: "Grade", icon: <LayoutGrid /> },
              { value: "lista", label: "Lista", icon: <List /> },
            ]}
          />
        </div>
      </Bloco>

      <Bloco
        titulo="Cartão"
        nota="Raio 12, borda de 1px, sem sombra. A ação do cabeçalho ganha coluna própria a partir de 420px do cabeçalho. Rodapé muted/30. Nunca um cartão dentro de outro: agrupe com muted/40 e raio 8."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,21rem),1fr))] gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Receita por canal</CardTitle>
              <CardDescription>Últimos 30 dias, por origem do negócio.</CardDescription>
              <CardAction>
                <Button variant="ghost" size="icon" aria-label="Mais opções">
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <span className="font-medium tabular-nums">R$ 31.200,00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formulário</span>
                  <span className="font-medium tabular-nums">R$ 12.800,00</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-muted-foreground">Atualizado às 14:20</span>
              <Button variant="outline" size="sm" className="ml-auto">
                Ver relatório
              </Button>
            </CardFooter>
          </Card>

          <Card className="space-y-2 p-4">
            <p className="font-medium">Caixa simples</p>
            <p className="text-muted-foreground">
              Cartão usado como caixa, com o padding de quem chama (é o uso mais comum no CRM).
            </p>
          </Card>
        </div>
      </Bloco>

      <Bloco
        titulo="Cartões de métrica"
        nota="Altura mínima 148, rótulo com 2 linhas reservadas, valor clamp(26–32)/600 tabular, chip de variação, meta com barra de 8px e sparkline de 28px."
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-4">
          <StatCard
            label="Receita do mês"
            value="R$ 48.200"
            delta={{ value: "+12%", trend: "up" }}
            context={
              <>
                vs. <strong>R$ 43.000</strong> no mês anterior
              </>
            }
            sparkline={[12, 14, 13, 17, 16, 19, 22, 21, 24]}
          />
          <StatCard
            label="Custo por negócio ganho, considerando todos os canais pagos"
            value="R$ 31,40"
            delta={{ value: "+8%", trend: "up", tone: "negative" }}
            context="Subir é ruim aqui"
          />
          <StatCard
            label="Negócios ganhos"
            value="132"
            delta={{ value: "0%", trend: "neutral" }}
            goal={{ progress: 112, status: "ok", label: "Meta batida" }}
            action={
              <Button variant="ghost" size="icon" aria-label="Editar meta de Negócios ganhos">
                <Pencil className="size-3.5" aria-hidden="true" />
              </Button>
            }
          />
          <StatCard
            label="Tempo de primeira resposta"
            value="7 min"
            delta={{ value: "−2 min", trend: "down", tone: "positive" }}
            goal={{ progress: 86, status: "warning", label: "Perto do limite de 8 min" }}
          />
          <StatCard
            label="Conversas sem resposta"
            value="23"
            goal={{ progress: 100, status: "danger", label: "Acima do limite de 15" }}
          />
          <StatCard label="Leads novos" value="—" loading />
        </div>
      </Bloco>

      <Bloco
        titulo="Tabela"
        nota="Cabeçalho muted/40 em xs/500, linhas de 48, células 16 × 12, hover muted/40 e selecionada no azul suave. Números à direita e tabulares; vazio é —. A tabela larga rola dentro do contêiner, nunca a página."
      >
        <Card className="overflow-hidden">
          <Table className="min-w-[44rem]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-56">Negócio</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Dono</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Dias na etapa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {NEGOCIOS.map((n) => (
                <TableRow
                  key={n.id}
                  data-state={selecionada === n.id ? "selected" : undefined}
                  aria-selected={selecionada === n.id}
                  onClick={() => setSelecionada(n.id)}
                  className="cursor-pointer"
                >
                  <TableCell className="max-w-72 truncate font-medium" title={n.nome}>
                    {n.nome}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{n.etapa}</Badge>
                  </TableCell>
                  <TableCell>
                    <Avatar size="sm">
                      <AvatarFallback>{n.dono}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="text-right">{n.valor ?? "—"}</TableCell>
                  <TableCell className="text-right">{n.dias}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">R$ 52.300,00</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
            <TableCaption className="mb-4">Clique numa linha para selecioná-la.</TableCaption>
          </Table>
        </Card>
      </Bloco>

      <Bloco
        titulo="Avisos"
        nota="Grade com ícone, raio 8, borda, uma ação no máximo. Um aviso por conceito. destructive e warning anunciam na hora; os demais são status."
      >
        <div className="grid gap-3">
          <Alert title="Novo relatório de funil">
            Agora dá para comparar dois períodos lado a lado.
          </Alert>
          <Alert variant="info" title="Dados parciais">
            Os números de hoje ainda estão chegando e podem mudar até o fim do dia.
          </Alert>
          <Alert variant="success" title="Canal conectado">
            O WhatsApp da recepção já está recebendo mensagens.
          </Alert>
          <Alert
            variant="warning"
            title="Limite de envio perto do fim"
            action={
              <Button variant="outline" size="sm">
                Ver limite
              </Button>
            }
          >
            Faltam 40 mensagens de campanha para o limite diário deste canal.
          </Alert>
          <Alert
            variant="destructive"
            title="Não deu para carregar os negócios"
            action={
              <Button variant="outline" size="sm">
                <RefreshCw className="size-4" aria-hidden="true" />
                Tentar de novo
              </Button>
            }
          >
            A conexão caiu no meio da busca. Seus dados estão salvos.
          </Alert>
        </div>
      </Bloco>

      <Bloco
        titulo="Estados vazio, carregando e erro"
        nota="Vazio: ícone de 32, frase curta e no máximo 1 ação. Carregando: esqueleto com a forma final, nunca spinner solto. Erro: a causa em linguagem simples e 1 ação."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,21rem),1fr))] gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Vazio</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Inbox}
                title="Nenhuma conversa ainda"
                description="Conecte um canal para começar a receber mensagens."
                action={<Button size="sm">Conectar canal</Button>}
              />
            </CardContent>
          </Card>
          <Card aria-busy="true">
            <CardHeader>
              <CardTitle>Carregando</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert
                variant="destructive"
                title="Não deu para carregar as conversas"
                action={
                  <Button variant="outline" size="sm">
                    Tentar de novo
                  </Button>
                }
              >
                O servidor demorou para responder.
              </Alert>
            </CardContent>
          </Card>
        </div>
      </Bloco>

      <Bloco
        titulo="Avatar, separador e área rolável"
        nota="Avatar de 24, 32 e 40 com iniciais sobre muted e anel de 1px; selo de status de 10px. Separador de 1px. Área rolável com barra fina."
      >
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback>AS</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>BR</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback>CD</AvatarFallback>
              <AvatarBadge />
            </Avatar>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <ScrollArea className="h-32 w-64 rounded-lg border border-border">
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 12 }, (_, i) => (
                <p key={i} className="text-muted-foreground">
                  Item de lista {i + 1}
                </p>
              ))}
            </div>
          </ScrollArea>
        </div>
        <Separator />
      </Bloco>
    </div>
  );
}
