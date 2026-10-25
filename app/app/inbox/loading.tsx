import { Skeleton } from "@/components/ui/skeleton";
import { EsqueletoDaLista, EsqueletoDoFio } from "@/components/inbox/estados";

// O esqueleto tem a FORMA FINAL (Unnify §10.21): a coluna da lista com as
// linhas de 56 e, a partir do `lg` (onde as duas colunas convivem), a conversa
// com cabeçalho, balões e o grupo do campo de 44. No celular cabe uma coluna: o
// esqueleto é o da lista, como a tela que vem.
export default function InboxLoading() {
  return (
    <div className="flex h-full">
      <div className="w-full shrink-0 border-r border-border lg:w-75">
        <div className="space-y-2 border-b border-border p-3">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-3/4 rounded-lg" />
        </div>
        <EsqueletoDaLista />
      </div>
      <div className="hidden min-w-0 flex-1 flex-col lg:flex">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <EsqueletoDoFio />
        </div>
        <div className="border-t border-border px-3 py-2">
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
