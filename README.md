#  Sherlock Holmes AI — Multi-Agent Blockchain Forensics Court

Sherlock Holmes AI is a **multi-agent on-chain investigation system** built using **ADK-TS**, enabling AI agents to analyze wallet behavior, detect suspicious patterns, debate risk, and deliver a final verdict.

Each investigation is unlocked using **x402 micropayments**, and optional **Telegram Alerts** notify users of the wallet's verdict instantly.

---

##  Problem

- Over **70%** of crypto users cannot identify scam wallets before interacting.
- Blockchain explorers show *data*, not *risk levels* or *wallet safety*.
- Tracing mixers, bridges, and multi-hop flows is too complex manually.
- No neutral system exists to **debate evidence** and issue a clear verdict.
- Users rely on social media warnings instead of **evidence-driven analysis**.

---

##  Solution (In Short)

Sherlock Holmes AI uses a **multi-agent reasoning pipeline** powered by ADK-TS:

- **Evidence Agent** → gathers on-chain data
- **Prosecutor Agent** → argues risk and suspicious patterns
- **Defender Agent** → provides alternative explanations
- **Judge Agent** → issues final risk score & verdict

Investigations are gated by **x402 micropayments**.
Users can also enable **Telegram alerts** to receive summarized verdicts.

---

##  Technology Stack

### AI & Multi-Agent System

- ADK-TS (Agent Development Kit for TypeScript)
- Multi-agent orchestration (Evidence → Prosecutor → Defender → Judge)

### Blockchain Data

- Bitquery API
- Covalent API
- Etherscan API

### Backend

- Node.js
- Express / Serverless Functions

### Frontend

- Next.js
- TailwindCSS
- D3.js / Cytoscape.js (knowledge graph rendering)

### Payments

- x402 Micropayments Protocol

### Messaging

- Telegram Bot API

---

##  How Sherlock Works

1. User enters a wallet address.
2. A small **x402 micropayment** is required to unlock the investigation.
3. After payment, ADK Coordinator launches the multi-agent pipeline.
4. **Evidence Agent** fetches on-chain activity & builds the knowledge graph.
5. **Prosecutor Agent** highlights suspicious or malicious patterns.
6. **Defender Agent** provides alternative explanations for the same data.
7. **Judge Agent** evaluates all arguments and generates:
   - Verdict (Fraud / Innocent / Inconclusive)
   - Risk Score
   - Summary of key evidence
8. (Optional) **Telegram Alert Agent** sends a notification containing:
   - Wallet
   - Verdict
   - Risk Level

---

##  Multi-Agent Architecture (Powered by ADK-TS)

### 1. Evidence Agent

- Fetches all wallet activity
- Detects mixers, large transfers, multi-hop routing
- Builds **Evidence Summary** and **Knowledge Graph JSON**

### 2. Prosecutor Agent

- Highlights:
  - High-risk patterns
  - Suspicious fund flows
  - Links to flagged wallets

### 3. Defender Agent

- Provides alternative interpretations:
  - Privacy-based mixing
  - Arbitrage or bot behavior
  - Non-malicious explanations

### 4. Judge Agent

- Compares prosecution vs defense
- Issues final verdict + risk score
- Decides case based on evidence

### 5. Telegram Agent *(Optional Add-On)*

Sends short alert:
```
Sherlock Alert
Wallet: 0xABC…
Risk Score: 82% (High)
Verdict: Likely Fraud
```

---

## 🔌 x402 Micropayment Flow
```
Frontend → x402 Payment Server → Payment Verified → 
Backend Unlocks Investigation → ADK Agents Begin
```

---

##  Project Structure
```
Sherlock/
│
├── agents/
│   ├── evidenceAgent.ts
│   ├── prosecutorAgent.ts
│   ├── defenderAgent.ts
│   ├── judgeAgent.ts
│   └── telegramAgent.ts
│
├── coordinator/
│   └── sherlockCoordinator.ts
│
├── server/
│   ├── index.ts
│   └── payment.ts
│
├── frontend/
│   ├── pages/
│   ├── components/
│   └── styles/
│
└── README.md
```

---

##  Environment Variables (`.env`)
```env
# DEBUG SETTINGS
ADK_DEBUG=false

# AI MODEL CONFIGURATION
GOOGLE_API_KEY=
LLM_MODEL=gemini-2.5-flash

# BLOCKCHAIN API CONFIGURATION
ETHERSCAN_API_KEY=
COVALENT_API_KEY=
BITQUERY_API_KEY=

# PAYMENT CONFIG (x402)
PAYMENT_PRIVATE_KEY=0x
PAYMENT_WALLET=0x

# TELEGRAM ALERT CONFIGURATION
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# NEXT.JS PUBLIC VARIABLES
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

##  Setup & Installation

### 1. Install Dependencies
```sh
npm install
```

### 2. Start Next.js Frontend
```sh
npm run dev
```

### 3. Start Backend Payment Server
```sh
npm run dev:server
```

### 4. Start ADK-TS Multi-Agent Coordinator
```sh
npm run dev:coordinator
```

---

##  Running an Investigation

1. Open the frontend (Next.js).
2. Enter wallet address.
3. Complete x402 micropayment.
4. ADK coordinator runs agents sequentially.
5. View:
   - Evidence summary
   - Prosecutor vs Defender arguments
   - Final verdict + score
6. (Optional) Receive Telegram alert.

---

##  Where ADK-TS Is Used (Important Section)

Sherlock Holmes AI deeply integrates **ADK-TS** for:

### ✔ Agent lifecycle control

- State transitions
- Tool execution
- Error handling

### ✔ Multi-agent orchestration

- Passing outputs between agents
- Coordinated reasoning
- Chained analysis

### ✔ Tooling integration

- Blockchain API tools
- Telegram tool
- Payment unlock tool

### ✔ Memory & shared context

- EvidenceSummary → Prosecutor → Defender → Judge

**Without ADK-TS, this multi-agent chain-of-thought investigation would not be possible.**

---

##  API Endpoints

### POST `/pay`

Start x402 micropayment session.

### POST `/investigate`

Begin multi-agent investigation once payment is verified.

### POST `/alert`

Trigger Telegram notification (testing).

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend |
| `npm run dev:server` | Start backend payment server |
| `npm run dev:coordinator` | Start ADK-TS multi-agent coordinator |
| `npm run build` | Build project |

---

## 📄 License

MIT License

---

##  Credits

Built by **Me**

Powered by:
- ADK-TS
- x402
- Bitquery / Covalent / Etherscan
- Gemini Flash
- Next.js

---

##  Final Note

Sherlock Holmes AI brings **courtroom-style reasoning** to blockchain safety, transforming raw on-chain data into **clear, actionable verdicts** using multi-agent intelligence.
