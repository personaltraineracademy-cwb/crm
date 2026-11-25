(() => {
  const M = { loaf: [], ev: [], marks: [], frames: 0, t0: 0 };
  window.__M = M;
  const po1 = new PerformanceObserver((l) => { for (const e of l.getEntries()) M.loaf.push({ d: e.duration, b: e.blockingDuration || 0, s: e.startTime }); });
  try { po1.observe({ type: "long-animation-frame", buffered: false }); } catch (e) { M.noLoaf = String(e); }
  const po2 = new PerformanceObserver((l) => { for (const e of l.getEntries()) M.ev.push({ n: e.name, d: e.duration, s: e.startTime, id: e.interactionId || 0 }); });
  po2.observe({ type: "event", durationThreshold: 16, buffered: false });
  M.t0 = performance.now();
  // Quadros: conta e registra o maior intervalo entre quadros.
  let last = performance.now(); M.maxGap = 0; M.gaps50 = 0;
  const tick = (t) => { const g = t - last; last = t; M.frames++; if (g > M.maxGap) M.maxGap = g; if (g > 50) { M.gaps50++; M.gapsList && M.gapsList.push([Math.round(t - (M.solta||t)), Math.round(g)]); } if (!M.stop) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  // Assentamento: do keydown de soltar até não haver card com position:fixed
  // e o card estar na coluna de destino. Registra quadros em que ele aparece
  // na coluna de ORIGEM depois de soltar (o "pisca de volta").
  // Latência por tecla (proxy de INP no WebKit, que não tem LoAF): do keydown
  // até o PRÓXIMO quadro começar, que inclui o handler e o render síncrono.
  M.teclas = []; M.trusted = 0;
  window.addEventListener("keydown", (e) => { if (e.isTrusted) M.trusted++; const t = performance.now(); requestAnimationFrame(() => M.teclas.push({ k: e.key, d: performance.now() - t, s: t })); }, true);
  M.gapsList = [];
  // Latência por movimento do ponteiro (arrastar nó / pan): do pointermove
  // até o próximo quadro. p95 e máximo.
  M.moves = [];
  window.addEventListener("pointermove", (e) => { const t = performance.now(); requestAnimationFrame(() => M.moves.push(performance.now() - t)); }, true);
  window.addEventListener("wheel", (e) => { const t = performance.now(); requestAnimationFrame(() => M.moves.push(performance.now() - t)); }, { capture: true, passive: true });
  M.observarSoltura = (cardId, destino, origem) => {
    M.solta = performance.now(); M.voltou = 0; M.rendersAntes = window.__rendersDoCard || 0;
    const loop = () => {
      const el = document.querySelector(`[data-rfd-draggable-id="${cardId}"]`);
      const col = el && el.closest("[data-etapa-do-quadro]");
      const fixo = el && getComputedStyle(el).position === "fixed";
      if (col && col.getAttribute("data-etapa-do-quadro") === origem && !fixo) M.voltou++;
      if (el && !fixo && col && col.getAttribute("data-etapa-do-quadro") === destino) { M.assentouEm = performance.now(); M.assentou = M.assentouEm - M.solta; M.rendersAoAssentar = window.__rendersDoCard || 0; return; }
      if (performance.now() - M.solta < 5000) requestAnimationFrame(loop); else M.assentou = -1;
    };
    requestAnimationFrame(loop);
  };
  M.resumo = () => {
    M.stop = true;
    const loaf = M.loaf; const ev = M.ev;
    const inter = {}; for (const e of ev) if (e.id) inter[e.id] = Math.max(inter[e.id] || 0, e.d);
    const inp = Object.values(inter).sort((a, b) => b - a);
    return JSON.stringify({
      janela_ms: Math.round(performance.now() - M.t0),
      quadros_longos: loaf.length,
      quadros_longos_soma_ms: Math.round(loaf.reduce((a, e) => a + e.d, 0)),
      quadros_longos_max_ms: Math.round(Math.max(0, ...loaf.map((e) => e.d))),
      bloqueio_ms: Math.round(loaf.reduce((a, e) => a + e.b, 0)),
      inp_ms: Math.round(inp[0] || 0),
      interacoes: inp.length,
      intervalo_max_entre_quadros_ms: Math.round(M.maxGap),
      quadros_acima_50ms: M.gaps50,
      assentou_ms: M.assentou === undefined ? null : Math.round(M.assentou),
      quadros_na_origem_depois_de_soltar: M.voltou ?? null,
      tecla_ate_quadro_max_ms: Math.round(Math.max(0, ...M.teclas.map((e) => e.d))),
      tecla_soltar_ate_quadro_ms: Math.round((M.teclas.filter((e) => e.k === " ").pop() || {}).d || 0),
      teclas: M.teclas.map((e) => e.k.replace("Arrow", "") + ":" + Math.round(e.d)).join(" "),
      teclas_confiaveis: M.trusted,
      assentou_desde_a_tecla_ms: (() => { const t = M.teclas.filter((e) => e.k === " ").pop(); return t && M.assentouEm ? Math.round(M.assentouEm - t.s) : null; })(),
      renders_de_card_ate_assentar: M.rendersAoAssentar != null ? M.rendersAoAssentar - M.rendersAntes : null,
      renders_de_card_ate_2s_depois: (window.__rendersDoCard || 0) - (M.rendersAntes || 0),
      ponteiro_eventos: M.moves.length,
      ponteiro_ate_quadro_p95_ms: (() => { const a = [...M.moves].sort((x, y) => x - y); return Math.round(a[Math.floor(a.length * 0.95)] || 0); })(),
      ponteiro_ate_quadro_max_ms: Math.round(Math.max(0, ...M.moves)),
      quadros_lentos_relativos_a_soltura: M.gapsList,
    });
  };
  return "medidor pronto";
})();
