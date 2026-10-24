# Como contribuir com o Unnify CRM

## Como este repositório funciona

O desenvolvimento do Unnify CRM acontece num repositório interno da Unnify. Cada versão pronta é
publicada aqui, em `personaltraineracademy-cwb/crm`, como um único commit com a tag `vX.Y.Z`. É
dessa tag que as instalações atualizam.

Por isso, pull requests abertos aqui não são mesclados direto. Uma ideia boa num PR é bem-vinda: a
equipe a leva para o repositório interno, e ela chega na versão seguinte.

## Relatar um bug

Abra uma [issue](https://github.com/personaltraineracademy-cwb/crm/issues/new/choose). O modelo
pede o que precisamos:

- o que aconteceu e o que você esperava;
- os passos para reproduzir;
- a versão instalada e a saída de `/api/v1/health`;
- se for instalação própria, a saída de `bash hostgator-setup-kit/healthcheck.sh`.

Tire dados pessoais de logs e prints antes de enviar.

## Sugerir uma melhoria

Abra uma issue com o modelo **Sugestão de melhoria**. Descreva a dor de quem opera o CRM, não só a
solução.

## Falha de segurança

Não abra issue pública. Siga o [`SECURITY.md`](SECURITY.md).

## Para quem desenvolve

As convenções de código estão em [`CLAUDE.md`](CLAUDE.md) (a doutrina) e
[`AGENTS.md`](AGENTS.md) (o mesmo contrato para outros assistentes de código). A visão de uma
página da arquitetura está em [`ARCHITECTURE.md`](ARCHITECTURE.md), e o passo a passo do ambiente
local em [`docs/SETUP.md`](docs/SETUP.md).

Antes de abrir PR no repositório interno:

```bash
pnpm cercas
pnpm typecheck && pnpm lint && pnpm lint:channels && pnpm test:unit && pnpm test:shell && pnpm build
pnpm test:db   # precisa de Docker
```

A sincronização com o projeto de origem é feita no repositório interno, com um guia que fica só
lá.

## Conduta

Toda participação segue o [Código de Conduta](CODE_OF_CONDUCT.md).
