-- manifest: fn_dashboard_de_leads — uma consulta só para o Dashboard (leads do período, 1ª resposta por lead, origem/UTM e leads parados ou sem dono por etapa); a tela fazia falta e o banco remoto custa caro por ida e volta.
--
-- O QUE ELA RESPONDE (tela /app/radar, "Dashboard"):
--   • totais    — leads criados na janela, ganhos, perdidos, abertos, valor ganho,
--                 quantos tiveram 1ª resposta, média e mediana dessa resposta;
--   • por_dia   — leads criados por dia, no fuso de quem olha (p_tz);
--   • origens   — de onde vieram (utm_source › ad_platform › coluna source), com
--                 utm_medium e utm_campaign;
--   • etapas    — FOTO DE AGORA do funil (não da janela): abertos, parados há mais
--                 de 24 h (a mesma régua do Radar, RISK_COLD_HOURS) e sem dono;
--   • leads     — os 200 mais novos da janela, cada um com o tempo da 1ª resposta.
--
-- A 1ª RESPOSTA POR LEAD: o relógio começa na primeira mensagem que o contato
-- mandou a partir de 1 h antes de o lead nascer; lead sem mensagem recebida
-- (formulário, cadastro manual) começa no próprio `created_at`. Para o relógio
-- vale a primeira mensagem ENVIADA depois disso — por pessoa ou pelo assistente,
-- e a resposta diz qual dos dois (`respondido_por`). Sem saída, o campo é `null`
-- ("ainda sem resposta"), NUNCA 0.
--
-- `security invoker` (o padrão): a RLS de quem chama continua valendo, e o
-- filtro de `organization_id` é explícito em toda tabela.
create or replace function public.fn_dashboard_de_leads(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_tz text default 'America/Sao_Paulo'
) returns jsonb
language sql stable
set search_path = public
as $$
  with
  leads as (
    select
      l.id, l.title, l.created_at, l.status, l.stage_id, l.pipeline_id, l.contact_id,
      l.owner_user_id, l.owner_agent_id, l.value_cents,
      coalesce(
        nullif(btrim(ct.source_metadata->>'utm_source'), ''),
        nullif(btrim(l.source_metadata->>'utm_source'), ''),
        nullif(btrim(ct.source_metadata->>'ad_platform'), ''),
        nullif(btrim(l.source), ''),
        nullif(btrim(ct.source), ''),
        'sem_origem'
      ) as origem,
      coalesce(
        nullif(btrim(ct.source_metadata->>'utm_medium'), ''),
        nullif(btrim(l.source_metadata->>'utm_medium'), '')
      ) as meio,
      coalesce(
        nullif(btrim(ct.source_metadata->>'utm_campaign'), ''),
        nullif(btrim(ct.source_metadata->>'campaign_name'), ''),
        nullif(btrim(l.source_metadata->>'utm_campaign'), '')
      ) as campanha
    from public.crm_leads l
    left join public.contacts ct
      on ct.id = l.contact_id and ct.organization_id = p_org
    where l.organization_id = p_org
      and l.created_at >= p_from and l.created_at < p_to
      -- A transferência entre funis não é lead novo nem perda (migration 0266).
      and coalesce(l.lost_reason, '') <> 'moved_to_another_pipeline'
  ),
  base as (
    select
      l.*,
      i.inicio,
      s.primeira_saida,
      s.por_pessoa,
      extract(epoch from (s.primeira_saida - i.inicio)) as resposta_s
    from leads l
    cross join lateral (
      select coalesce(min(m.sent_at), l.created_at) as inicio
      from public.conversations c
      join public.messages m on m.conversation_id = c.id
      where c.organization_id = p_org
        and c.contact_id = l.contact_id
        and c.is_group = false
        and m.direction = 'inbound'
        and m.sent_at >= l.created_at - interval '1 hour'
    ) i
    left join lateral (
      select m.sent_at as primeira_saida, (m.sent_by_user_id is not null) as por_pessoa
      from public.conversations c
      join public.messages m on m.conversation_id = c.id
      where c.organization_id = p_org
        and c.contact_id = l.contact_id
        and c.is_group = false
        and m.direction = 'outbound'
        and m.status <> 'failed'
        and m.sent_at > i.inicio
      order by m.sent_at asc
      limit 1
    ) s on true
  )
  select jsonb_build_object(
    'totais', (
      select jsonb_build_object(
        'leads', count(*),
        'ganhos', count(*) filter (where status = 'won'),
        'perdidos', count(*) filter (where status = 'lost'),
        'abertos', count(*) filter (where status = 'open'),
        'valor_ganho_cents', coalesce(sum(value_cents) filter (where status = 'won'), 0),
        'respondidos', count(*) filter (where resposta_s is not null),
        'sem_resposta', count(*) filter (where resposta_s is null),
        'media_resposta_segundos', avg(resposta_s),
        'mediana_resposta_segundos', percentile_cont(0.5) within group (order by resposta_s)
      )
      from base
    ),
    'leads_periodo_anterior', (
      select count(*)
      from public.crm_leads
      where organization_id = p_org
        and created_at >= p_from - (p_to - p_from) and created_at < p_from
        and coalesce(lost_reason, '') <> 'moved_to_another_pipeline'
    ),
    'por_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', d.dia, 'leads', d.n) order by d.dia)
      from (
        select to_char((created_at at time zone p_tz)::date, 'YYYY-MM-DD') as dia, count(*) as n
        from base
        group by 1
      ) d
    ), '[]'::jsonb),
    'origens', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'origem', o.origem, 'meio', o.meio, 'campanha', o.campanha,
          'leads', o.n, 'ganhos', o.ganhos
        ) order by o.n desc, o.origem
      )
      from (
        select origem, meio, campanha,
               count(*) as n,
               count(*) filter (where status = 'won') as ganhos
        from base
        group by origem, meio, campanha
        order by count(*) desc, origem
        limit 50
      ) o
    ), '[]'::jsonb),
    'etapas', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'stage_id', s.id,
          'stage_name', s.name,
          'position', s.position,
          'pipeline_id', p.id,
          'pipeline_name', p.name,
          'pipeline_is_default', p.is_default,
          'abertos', coalesce(a.abertos, 0),
          'parados', coalesce(a.parados, 0),
          'sem_dono', coalesce(a.sem_dono, 0),
          'valor_cents', coalesce(a.valor_cents, 0)
        ) order by p.position, p.name, s.position, s.name
      )
      from public.crm_stages s
      join public.crm_pipelines p on p.id = s.pipeline_id
      left join (
        select
          stage_id,
          count(*) as abertos,
          count(*) filter (
            where coalesce(last_activity_at, stage_changed_at, created_at) < now() - interval '24 hours'
          ) as parados,
          count(*) filter (where owner_user_id is null and owner_agent_id is null) as sem_dono,
          coalesce(sum(value_cents), 0) as valor_cents
        from public.crm_leads
        where organization_id = p_org and status = 'open'
        group by stage_id
      ) a on a.stage_id = s.id
      where s.organization_id = p_org
        and p.organization_id = p_org
        and s.is_archived = false
        and p.is_archived = false
        and s.is_won = false
        and s.is_lost = false
    ), '[]'::jsonb),
    'leads', coalesce((
      select jsonb_agg(x.linha order by x.created_at desc)
      from (
        select
          b.created_at,
          jsonb_build_object(
            'id', b.id,
            'title', b.title,
            'created_at', b.created_at,
            'status', b.status,
            'stage_name', st.name,
            'origem', b.origem,
            'campanha', b.campanha,
            'owner_user_id', b.owner_user_id,
            'tem_dono', (b.owner_user_id is not null or b.owner_agent_id is not null),
            'resposta_segundos', b.resposta_s,
            'respondido_por', case
              when b.resposta_s is null then null
              when b.por_pessoa then 'pessoa'
              else 'assistente'
            end
          ) as linha
        from base b
        left join public.crm_stages st on st.id = b.stage_id
        order by b.created_at desc
        limit 200
      ) x
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.fn_dashboard_de_leads(uuid, timestamptz, timestamptz, text) from public;
revoke execute on function public.fn_dashboard_de_leads(uuid, timestamptz, timestamptz, text) from anon;
grant execute on function public.fn_dashboard_de_leads(uuid, timestamptz, timestamptz, text)
  to authenticated, service_role;
