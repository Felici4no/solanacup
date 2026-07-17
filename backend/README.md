# Vez Backend — TxLINE World Cup + VEZ Fan Token

Backend do Vez para o **World Cup Hackathon** (Solana × TxODDS TxLINE), trilha
**Consumer & Fan Experiences**. Liga o app de memórias esportivas a dados
**reais e ao vivo da Copa** e transforma o ritual *"I'm Watching"* em
recompensas de fan token **VEZ** na Solana.

Arquitetura, protocolo e decisões: **[PLAN.md](PLAN.md)**.
Fonte da verdade: `docs/txline-openapi.yaml` + `docs/reference/` (scripts
oficiais do repo `txodds/tx-on-chain`) — o fluxo é seguido à risca.

## Rodar

```bash
cd backend
npm install
cp .env.example .env          # revise se quiser; devnet é o default

npm run smoke                 # prova conectividade: guest JWT real da TxLINE
npm run activate              # subscribe on-chain (devnet) + ativação do API token
npm run dev                   # sobe a API em http://localhost:8787
npm test                      # 11 testes (mensagem de ativação, normalização, epochDay)
```

**Primeira ativação:** o script gera a wallet em `./.keys/backend-wallet.json`
e tenta um airdrop devnet. Se o airdrop público estiver limitado, funde o
endereço impresso via faucet (<https://pinestake.com/en/faucet>) e rode
`npm run activate` de novo. O API token fica cacheado em `.txline/token.json`
— o servidor não repete a transação.

## Fluxo TxLINE (free tier da Copa)

1. `POST /auth/guest/start` → guest JWT.
2. `subscribe(serviceLevel, weeks)` no programa `txoracle` (Anchor, devnet) —
   free tier: sem TxL, só fee em SOL; weeks múltiplo de 4.
3. Assina `` `${txSig}::${jwt}` `` (ed25519 detached, base64) com a **mesma wallet**.
4. `POST /api/token/activate` → API token longo.
5. Dados com `Authorization: Bearer {jwt}` + `X-Api-Token`; em 401 renova o
   JWT e repete. Streams por SSE com retomada via `Last-Event-ID`.

## API para o frontend Vez

| Rota | Descrição |
|---|---|
| `GET /health` | rede, host TxLINE, token ativo, mint VEZ |
| `GET /api/wc/fixtures` | jogos da Copa (competitionId 72), normalizados |
| `GET /api/wc/matches/:fixtureId` | placar + eventos (gol/cartão/minuto) p/ o Match Pulse |
| `GET /api/wc/stream?fixtureId=` | SSE ao vivo re-broadcast, eventos normalizados |
| `GET /api/fan/token` | mint, decimais e tabela de recompensas do VEZ |
| `POST /api/fan/checkin` | `{wallet, fixtureId}` → verifica **ao vivo** na TxLINE → 10 VEZ |
| `POST /api/fan/claim-goals` | bônus de 5 VEZ por gol desde o check-in |
| `GET /api/fan/balance/:wallet` | saldo VEZ |

## Status

- ✅ Protocolo completo implementado a partir do OpenAPI + exemplos oficiais.
- ✅ Smoke ao vivo: guest JWT emitido pelo host devnet real.
- ✅ 11 testes unitários; type-check limpo.
- ⏳ Ativação on-chain aguarda SOL de faucet na wallet gerada (rate limit do
  airdrop público). Depois disso, `fixtures/scores/odds` reais fluem.
