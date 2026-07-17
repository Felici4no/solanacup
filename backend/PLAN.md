# Vez Backend — TxLINE World Cup + VEZ Fan Token

**Hackathon:** World Cup Hackathon (Superteam Brasil) · Track: **Consumer & Fan Experiences**
**Stack alvo:** TxODDS TxLINE (dados ao vivo da Copa, on-chain verificáveis) + Solana (devnet) + fan token **VEZ**.

## Tese

O Vez transforma partidas em memórias. Este backend liga o produto ao mundo real:

1. **Dados ao vivo da Copa** via TxLINE (free tier, `competitionId = 72`) — fixtures, placares,
   eventos (gols, cartões) e odds, tudo canonicalizado e provável on-chain.
2. **Fan token VEZ** (SPL, devnet) — o ritual "I'm Watching" vira **check-in on-chain**:
   o fã que está assistindo uma partida *realmente ao vivo* (verificado pela TxLINE)
   ganha VEZ; um gol durante o check-in paga bônus. Memórias completadas = coleção.

> A partida pertence à história (e à chain). A memória — e o token — pertencem ao fã.

## Fonte da verdade (seguida à risca)

- `docs/txline-openapi.yaml` — OpenAPI oficial (baixado de `txline.txodds.com/docs/docs.yaml`).
- `docs/reference/` — scripts oficiais do repo `txodds/tx-on-chain` (`subscription_free_tier.ts`,
  `common/users.ts`, IDL `txoracle.json`).
- Docs: `/documentation/quickstart`, `/documentation/worldcup`.

### Protocolo TxLINE (resumo operacional)

| Passo | Detalhe |
|---|---|
| Guest JWT | `POST {host}/auth/guest/start` → `{ token }` (sem body) |
| Subscribe on-chain | Anchor `txoracle.subscribe(serviceLevelId, weeks)` — weeks múltiplo de 4; PDAs `pricing_matrix` e `token_treasury_v2`; ATA do TxL em TOKEN-2022; **free tier não gasta TxL, só SOL de fee** |
| Mensagem de ativação | `` `${txSig}:${leagues.join(",")}:${jwt}` `` (bundle padrão → `txSig::jwt`), UTF-8, `nacl.sign.detached`, base64 — **mesma wallet da transação** |
| Ativação | `POST {host}/api/token/activate` body `{ txSig, walletSignature, leagues }`, header `Authorization: Bearer {jwt}` → API token longo |
| Dados | Headers `Authorization: Bearer {jwt}` **e** `X-Api-Token: {apiToken}`; em `401` renova o guest JWT no mesmo host e repete com o mesmo API token |
| Streams | SSE `GET /api/scores/stream?fixtureId=` e `/api/odds/stream`; mensagens `id: timestamp:index`, heartbeats `event: heartbeat`; retomada via `Last-Event-ID` |
| Consistência | RPC + program + mint + JWT + ativação sempre na **mesma rede** |

### Redes

| | Devnet | Mainnet |
|---|---|---|
| Host | `https://txline-dev.txodds.com` | `https://txline.txodds.com` |
| Program | `6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J` | `9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA` |
| TxL mint | `4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG` | `Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL` |
| Free tier | level 1 (`samplingIntervalSec 0`) | level 1 = Copa com 60 s de atraso · level 12 = tempo real |

Copa do Mundo: **competitionId 72**. `epochDay = floor(Date.now()/86 400 000)`.

## Arquitetura

```
backend/
  docs/                      # OpenAPI + referências oficiais (não editar)
  src/
    config.ts                # redes, URLs, IDs, env
    txline/
      types.ts               # Fixture, Scores, SoccerData, Odds (do OpenAPI)
      auth.ts                # guest JWT, renovação, mensagem+assinatura, ativação
      client.ts              # fetch autenticado c/ retry 401 (padrão do users.ts oficial)
      api.ts                 # fixturesSnapshot / scoresSnapshot / oddsSnapshot / streams SSE
    solana/
      wallet.ts              # keypair via arquivo (ANCHOR_WALLET) ou env
      subscribe.ts           # free-tier subscribe (espelho fiel do users.ts oficial)
      fantoken.ts            # mint VEZ + recompensas (devnet)
    services/
      worldcup.ts            # cache de fixtures WC, normalização Scores→eventos Vez, estado live
      rewards.ts             # check-in "I'm Watching" verificado + bônus de gol
    api/server.ts            # Express: REST + SSE re-broadcast p/ o frontend Vez
    index.ts                 # boot: auth → token (cache .txline/token.json) → server
  scripts/activate.ts        # one-shot: subscribe devnet + ativação (imprime API token)
  test/                      # vitest: mensagem de ativação, normalizador, epochDay
```

### API para o frontend Vez

| Rota | Função |
|---|---|
| `GET /health` | status + rede + token ativo |
| `GET /api/wc/fixtures` | fixtures da Copa (norm.: id, times, kickoff, status) |
| `GET /api/wc/matches/:fixtureId` | placar + eventos normalizados (gol/cartão/minuto) p/ Match Pulse |
| `GET /api/wc/stream?fixtureId=` | SSE re-broadcast do score stream TxLINE |
| `POST /api/fan/checkin` | `{ wallet, fixtureId }` → verifica live na TxLINE → transfere VEZ |
| `GET /api/fan/balance/:wallet` | saldo VEZ do fã |
| `GET /api/fan/token` | mint address + metadados do VEZ |

### Recompensas VEZ (devnet)

- Check-in em partida **ao vivo** (gameState válido no snapshot TxLINE): **10 VEZ**.
- Gol do time durante check-in ativo (score stream): **+5 VEZ** (bônus por gol).
- 1 check-in por wallet por fixture (anti-abuso simples em memória/arquivo).
- Mint criado no boot se `VEZ_MINT` ausente; autoridade = wallet do backend.

## Decisões

- **Node 20+ / TS / ESM**, Express (leve, SSE nativo via `res.write`).
- `@coral-xyz/anchor` + IDL oficial para o `subscribe` (idêntico ao exemplo oficial).
- `eventsource` (pacote oficial usado nos exemplos) para consumir SSE com headers.
- Sem banco: cache em arquivo (`.txline/token.json`, `.vez/state.json`) — hackathon.
- Devnet por padrão; mainnet é só trocar `NETWORK=mainnet` (mesma interface).
```
