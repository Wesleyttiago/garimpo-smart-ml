#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
action="${1:-help}"
if [ "$action" = help ]; then
  echo "Uso: bash manage.sh start|stop|status|test|logs"
  echo "start: iniciar com verificação, sem sobrescrever fluxos"
  echo "stop: parar, preservando a conta e os fluxos"
  echo "status: conferir os serviços"
  echo "test: verificar o n8n e produzir cinco candidatos DEMO"
  echo "logs: mostrar as últimas mensagens dos serviços"
  exit 0
fi
case "$action" in
  start) exec bash setup.sh ;;
  stop|status|test|logs) ;;
  *) echo "Comando desconhecido: $action. Use bash manage.sh help." >&2; exit 1 ;;
esac
. scripts/docker.sh
require_docker
if [ ! -f .env ]; then
  echo "Ambiente ainda não configurado. Execute bash setup.sh." >&2
  exit 1
fi
case "$action" in
  stop) compose stop ;;
  status) compose ps ;;
  logs) compose logs --tail=60 ;;
  test)
    # Usa explicitamente demo, mesmo se o usuário editou o fluxo para live.
    compose exec -T n8n node -e "fetch('http://127.0.0.1:5678/healthz').then(r=>{if(!r.ok)throw Error();console.log('n8n respondeu ao teste de saúde.');}).catch(()=>{console.error('n8n indisponível.');process.exit(1);})"
    compose exec -T worker node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
const response=await fetch('http://127.0.0.1:8080/api/run',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'demo'})
});
assert.equal(response.status,200,'Worker não respondeu ao teste.');
const result=await response.json();
assert.equal(result.mode,'demo');
assert.equal(result.count,5);
assert.equal(result.published,false);
assert.ok(result.products.every(p=>p.simulation && !p.affiliateUrl && !p.publishable));
console.log('Teste concluído: 5 candidatos DEMO, nenhum link de comissão e nenhuma publicação.');
console.log('Abra http://localhost:8078 para conferir.');
NODE
    ;;
esac
