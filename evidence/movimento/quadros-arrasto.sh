#!/bin/zsh
# Captura a sequência do arrastar pelo teclado em evidence/movimento/.
P="Portal Movimento"
OUT="/Users/wesleymaciel/Library/Mobile Documents/com~apple~CloudDocs/Principal/Projetos/PTA/CRM/evidence/movimento"
mkdir -p "$OUT"
cap() { f=$(maestri portal screenshot "$P" 2>&1 | tail -1); cp "$f" "$OUT/$1.png"; echo "$OUT/$1.png"; }
maestri portal evaluate "$P" "(() => { const el=document.querySelector('[data-etapa-do-quadro] [data-rfd-draggable-id]'); el.focus(); return el.getAttribute('data-rfd-draggable-id') })()"
cap 01-repouso
maestri portal key "$P" "Space" >/dev/null; sleep 0.5
cap 02-levantado
maestri portal evaluate "$P" "(() => { const el=document.querySelector('[data-arrasto]'); if(!el) return 'sem data-arrasto'; const cs=getComputedStyle(el); const a=getComputedStyle(el,'::after'); return JSON.stringify({estado: el.dataset.arrasto, scale: cs.scale, rotate: cs.rotate, overflow: cs.overflow, sombra_opacidade: a.opacity, animacao: cs.animationName}) })()"
maestri portal key "$P" "ArrowDown" >/dev/null; sleep 0.3
maestri portal key "$P" "ArrowRight" >/dev/null; sleep 0.5
cap 03-sobre-a-coluna-de-destino
maestri portal evaluate "$P" "(() => { const c=document.querySelector('[data-recebendo]'); if(!c) return 'nenhuma coluna recebendo'; return JSON.stringify({recebendo: c.closest('[data-etapa-do-quadro]').querySelector('h2,input')?.value || c.closest('[data-etapa-do-quadro]').innerText.split('\n')[0], veu_opacidade: getComputedStyle(c,'::before').opacity}) })()"
maestri portal key "$P" "Space" >/dev/null; sleep 0.08
cap 04-assentando
sleep 0.8
cap 05-assentado
