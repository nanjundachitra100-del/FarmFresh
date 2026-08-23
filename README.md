# FarmFresh — Autonomous AI-Powered Farmer Marketplace

> An agent-ready agricultural marketplace where AI agents can discover farm products and initiate pay-per-use purchases through x402, with USDC settlement on Algorand.

## Problem & Solution

Farmers struggle to reach customers directly, while traditional marketplaces depend on manual purchasing and centralized payment systems.

**FarmFresh** connects **farmers, customers, and AI agents** in one marketplace. The AI agent can understand a user's requirements, discover suitable products, and participate in the purchase workflow.

### Core Workflow

```text
Customer
   ↓
AI Agent
   ↓
Product Discovery
   ↓
FarmFresh Marketplace
   ↓
402 Payment Required
   ↓
x402 Payment
   ↓
GoPlausible
   ↓
Algorand Testnet + USDC
   ↓
Payment Verification
   ↓
Order Confirmed
```

## Why AI Agent?

FarmFresh goes beyond a normal AI chatbot.

The AI agent can:

* Understand purchasing requirements
* Discover suitable products
* Select a product
* Initiate the purchase workflow
* Participate in the x402 payment flow
* Receive payment and order confirmation

> **Our AI agent is not just conversational—it participates in the transaction lifecycle.**

## Why x402 + Algorand?

**x402** provides the HTTP-native payment mechanism for pay-per-use transactions.

**Algorand** provides the blockchain settlement layer using **USDC**.

This enables machine-to-machine payments without relying entirely on traditional checkout or subscription systems.

## Architecture

```text
                  ┌──────────────┐
                  │   AI Agent   │
                  └──────┬───────┘
                         ↓
                  ┌──────────────┐
                  │ React + Vite │
                  │  FarmFresh   │
                  └──────┬───────┘
                         ↓
                  ┌──────────────┐
                  │ Node +       │
                  │ Express      │
                  └───┬──────┬───┘
                      │      │
                      ↓      ↓
                ┌────────┐ ┌──────┐
                │Supabase│ │ x402 │
                └────────┘ └───┬──┘
                               ↓
                         ┌───────────┐
                         │GoPlausible│
                         └─────┬─────┘
                               ↓
                         ┌───────────┐
                         │ Algorand  │
                         │ Testnet   │
                         │   USDC    │
                         └───────────┘
```

## Tech Stack

| Layer                     | Technology           |
| ------------------------- | -------------------- |
| Frontend                  | React + Vite         |
| Backend                   | Node.js + Express    |
| Database & Authentication | Supabase             |
| AI                        | AI Agent Integration |
| Payment Protocol          | x402                 |
| Facilitator               | GoPlausible          |
| Blockchain                | Algorand             |
| Currency                  | USDC                 |
| Wallet                    | Pera Wallet          |

## Run Locally

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Configure the required `.env` variables for **Supabase, Algorand, x402, and the frontend API connection** before starting the application.

## How to Test

1. Open the FarmFresh frontend.
2. Login as a customer.
3. Browse available farm products.
4. Add a product to the cart.
5. Proceed to checkout.
6. Connect Pera Wallet.
7. Initiate the x402 payment.
8. Approve the Algorand Testnet transaction.
9. Verify the payment.
10. Confirm the order.
11. Login as a farmer to view the order.
12. Use the delivery dashboard to manage delivery.

## x402 Transaction Proof

A real FarmFresh x402 payment was settled on **Algorand Testnet**.

**Transaction ID:**

```text
32VMOXZI5EFNLXHK7DEDX2ERORMT2R5YN4EC2GMHVZ43SUOCTVLA
```

**View the transaction on Algorand Testnet:**

https://lora.algokit.io/testnet/transaction/32VMOXZI5EFNLXHK7DEDX2ERORMT2R5YN4EC2GMHVZ43SUOCTVLA

This provides on-chain evidence of the working payment flow.

## USP — What Makes FarmFresh Different?

### Traditional Agricultural Marketplace

```text
Human
  ↓
Search
  ↓
Select
  ↓
Checkout
  ↓
Pay
```

### FarmFresh

```text
User
  ↓
AI Agent
  ↓
Discover
  ↓
Decide
  ↓
x402 Payment
  ↓
USDC / Algorand
  ↓
Order
```

> **FarmFresh is an agent-ready agricultural marketplace where AI agents can discover real-world farm products and participate in pay-per-use purchases using x402, with USDC settlement on Algorand.**

FarmFresh combines:

**Agriculture + AI Agents + x402 + Algorand**

## Security

* Payments are cryptographically authorized.
* The backend verifies payment before completing protected actions.
* Sensitive credentials are stored in environment variables.
* Payment settlement is recorded on-chain.

## Demo Flow

```text
Problem
   ↓
FarmFresh Marketplace
   ↓
AI Agent
   ↓
Product Discovery
   ↓
402 Payment Required
   ↓
x402 Payment
   ↓
Algorand USDC Settlement
   ↓
Order Confirmation
   ↓
Farmer
   ↓
Delivery
```

## Vision

**FarmFresh turns agricultural commerce into agentic commerce—making AI agents active participants in real-world buying and selling.**

## Project

**FarmFresh — Autonomous AI-Powered Farmer Marketplace**

Platform connecting farmers, customers, and AI agents through an agent-ready agricultural marketplace.
## Local Development

**Frontend:**  
http://localhost:5173/

**Backend:**  
http://localhost:5000/

**Backend Health Check:**  
http://localhost:5000/health

### Live Application

https://farm-fresh-13b2.vercel.app/

### Repository

https://github.com/nanjundachitra100-del/FarmFresh
