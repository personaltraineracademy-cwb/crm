# Política de Segurança

## Versões com suporte

Correções de segurança saem só na versão mais nova, publicada com a tag `vX.Y.Z` mais alta deste
repositório. Mantenha a instalação em dia: pela tela, em **Configurações › Atualização**, ou com
`bash hostgator-setup-kit/update.sh`.

| Versão                         | Suporte |
| ------------------------------ | ------- |
| Tag `vX.Y.Z` mais nova         | Sim     |
| Versões anteriores e snapshots | Não     |

## Como relatar uma vulnerabilidade

**Não abra issue pública.**

Use o
[relato privado de vulnerabilidades do GitHub](https://github.com/personaltraineracademy-cwb/crm/security/advisories/new).
O relato chega só aos mantenedores, e o histórico fica registrado.

O que esperar:

- **confirmação de recebimento** em até 7 dias;
- **avaliação e resposta** em até 30 dias, com plano de correção quando a falha for confirmada;
- **crédito** no aviso publicado, se você quiser.

## O que interessa

- vazamento entre organizações (contorno de RLS ou do filtro `organization_id`);
- contorno de autenticação ou de permissão (papéis `viewer`, `agent`, `manager` e `admin`, e o
  administrador da plataforma);
- exposição de dados pessoais (LGPD): contatos, conversas e mídia do WhatsApp;
- injeção por payload de webhook (WAHA, Nuvemshop) ou pela API `/api/v1`;
- vazamento de segredos: chaves de API, tokens bearer e cookies de sessão.

Cada instalação própria é responsabilidade de quem a hospeda. Problemas de configuração do
servidor (firewall, TLS da VPS etc.) ficam fora do escopo. Melhorias no kit de instalação são
bem-vindas como issue normal.
