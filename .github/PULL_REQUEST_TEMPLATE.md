<!--
  Pull requests do repositório público não são mesclados direto: o
  desenvolvimento acontece no repositório interno da Unnify (ver CONTRIBUTING.md).
  Uma boa ideia aqui é levada para lá pela equipe.
-->

# O que este PR faz

<!-- 1 a 3 frases, do ponto de vista de quem USA o sistema. Se resolve issue: Closes #123 -->

## Checklist

- [ ] `pnpm cercas` zerado
- [ ] `pnpm typecheck` zerado
- [ ] `pnpm lint` zerado
- [ ] Testes relevantes existem e passam (`pnpm test:unit`)
- [ ] RLS testada, se toca tabela com `organization_id`
- [ ] Audit log emitido, se há mutação relevante
- [ ] Zod valida todo input externo novo
- [ ] Sem `console.log` esquecido
- [ ] Mudança de schema saiu como migration versionada + apêndice no `baseline.sql` + linha `-- manifest:` no cabeçalho do `.sql`
- [ ] Doc atualizada, se mudou contrato

Convenções completas em [`CLAUDE.md`](../CLAUDE.md) · fluxo em [`CONTRIBUTING.md`](../CONTRIBUTING.md).
