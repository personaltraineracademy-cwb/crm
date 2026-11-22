#!/bin/zsh
# Uso: medir-kanban.sh <rotulo>  — mede um arrastar pelo teclado no quadro.
P="Portal Movimento"
D="$(dirname $0)"
URL="http://localhost:3000/app/pipelines/9f554687-abb0-4192-85a5-a555d080f096"
maestri portal navigate "$P" "$URL" >/dev/null
for i in {1..20}; do sleep 5; n=$(maestri portal evaluate "$P" "document.querySelectorAll('[data-rfd-draggable-id]').length" 2>/dev/null); [[ "$n" -ge 30 ]] && break; done
echo "cards: $n"
sleep 4
maestri portal evaluate "$P" "$(cat $D/medidor.js)"
# card do topo da 1ª coluna
info=$(maestri portal evaluate "$P" "(() => { const col=document.querySelector('[data-etapa-do-quadro]'); const el=col.querySelector('[data-rfd-draggable-id]'); el.focus(); const cols=[...document.querySelectorAll('[data-etapa-do-quadro]')]; return el.getAttribute('data-rfd-draggable-id')+' '+cols[0].dataset.etapaDoQuadro+' '+cols[1].dataset.etapaDoQuadro })()")
read card origem destino <<< "$info"
maestri portal key "$P" "Space" >/dev/null; sleep 0.6
for k in ArrowDown ArrowDown ArrowDown; do maestri portal key "$P" "$k" >/dev/null; sleep 0.4; done
maestri portal key "$P" "ArrowRight" >/dev/null; sleep 0.6
maestri portal key "$P" "ArrowDown" >/dev/null; sleep 0.5
maestri portal evaluate "$P" "window.__M.observarSoltura('$card','$destino','$origem')" >/dev/null
maestri portal key "$P" "Space" >/dev/null
sleep 2.5
echo "$1: $(maestri portal evaluate "$P" "window.__M.resumo()")"
