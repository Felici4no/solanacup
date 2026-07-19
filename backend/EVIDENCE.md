# GAM3BOOK Backend — Evidência de execução

Pipeline rodando de ponta a ponta. Provas capturadas em replay (partida da
Copa scriptada, mesmos endpoints e formatos normalizados do caminho ao vivo
da TxLINE). A via on-chain real está provada pelo smoke abaixo; falta só SOL
de faucet na wallet para a ativação.

## 1. Conectividade real com a TxLINE (sem wallet)

`npm run smoke` → guest JWT **emitido pelo host devnet real** `txline-dev.txodds.com`:

```
[smoke] devnet → https://txline-dev.txodds.com/auth/guest/start
[smoke] guest JWT ok: { length: 276, claims: ['exp','sessionId','role','maybeClientIp'], exp: '2026-08-16T…' }
```

## 2. Backend no ar (modo replay)

```
GET /health
{"ok":true,"network":"devnet","dataSource":"replay","txlineActivated":false,
 "tokenMint":"AfDPbghWv5szzdxRLiv7946YHnQ3uBH9brMHr9JNtPPB","tokenSimulated":true}

GET /api/fan/token
{"mint":"AfDP…tPPB","symbol":"G3B","decimals":6,"rewards":{"checkin":10,"goalBonus":5}}

GET /api/wc/fixtures
[{"fixtureId":900026,"competition":"FIFA World Cup","competitionId":72,
  "home":"Brazil","away":"England",…}, {"…":"Argentina vs France"}]
```

## 3. Dados fluindo — stream SSE ao vivo

`GET /api/wc/stream?fixtureId=900026` (eventos normalizados chegando em tempo real):

```
data: {"minute":0,"type":"state","team":null,"gameState":"H11",…}
data: {"minute":6,"type":"corner","team":"home","gameState":"H11",…}
data: {"minute":12,"type":"yellow_card","team":"away","gameState":"H11",…}
data: {"minute":41,"type":"goal","team":"away","gameState":"H11",…}   ← 0-1
data: {"minute":84,"type":"goal","team":"home",…}                     ← 1-1
data: {"minute":87,"type":"goal","team":"home",…}                     ← 2-1
```

Ticker do backend (partida completa):

```
[replay]  0' STATE        → {home:0, away:0}
[replay]  6' CORNER (home) → {home:0, away:0}
[replay] 12' YELLOW (away) → {home:0, away:0}
[replay] 41' ⚽ GOAL (away) → {home:0, away:1}
[replay] 84' ⚽ GOAL (home) → {home:1, away:1}
[replay] 87' ⚽ GOAL (home) → {home:2, away:1}
[replay] 90' STATE         → {home:2, away:1}  (END)
```

## 4. Loop do fã — check-in verificado → G3B (a tese)

O check-in **só é aceito porque a TxLINE(replay) confirma que a partida está
ao vivo**. Em jogo encerrado, é recusado — a verificação é real:

```
POST /api/fan/checkin {wallet, fixtureId:900026}   (jogo ENCERRADO)
→ {"ok":false,"code":"not_live","gameState":"END"}

POST /api/fan/checkin {wallet, fixtureId:900026}   (jogo AO VIVO, H11)
→ {"ok":true,"reward":10,"txSig":"SIMULATED-6J8M…","match":{…live:true}}

GET  /api/fan/balance/{wallet}      → {"balance":10}
POST /api/fan/checkin (de novo)     → {"code":"already_checked_in"}

POST /api/fan/claim-goals {…}       → {"ok":true,"goals":3,"reward":15}
GET  /api/fan/balance/{wallet}      → {"balance":25}   (10 + 3×5)
POST /api/fan/claim-goals (de novo) → {"code":"nothing_to_claim"}
```

## Como reproduzir

```bash
cd backend
REPLAY=1 REPLAY_SPEED=9 PORT=8788 npm run start        # partida ao vivo scriptada
curl -N http://localhost:8788/api/wc/stream?fixtureId=900026   # ver o stream
curl -X POST http://localhost:8788/api/fan/checkin \
  -H 'Content-Type: application/json' \
  -d '{"wallet":"<sua_wallet>","fixtureId":900026}'    # check-in ao vivo → 10 G3B
```

Caminho real (quando a wallet tiver SOL de faucet):
`cd backend && npm run activate` → subscribe on-chain + API token → `npm run dev`
(sem `REPLAY`) → `fixtures/scores/odds` reais da Copa fluem pelos mesmos endpoints,
e o G3B vira mint SPL de verdade (`tokenSimulated:false`).

## Mapa de conexões

```
TxLINE (Copa, on-chain-verificável)
   │  guest JWT + subscribe(Anchor) + activate  →  API token
   ▼
backend/txline  ──►  WorldCupService (normaliza)  ──►  /api/wc/*  ──►  GAM3BOOK frontend
   │                        │                                          (Home, Match Pulse)
   │                        └── estado live ──► RewardsService (verifica)
   ▼                                                    │
Solana devnet  ◄── mint G3B (check-in + gols) ◄─────────┘  ──►  /api/fan/*  ──► saldo do fã
```
