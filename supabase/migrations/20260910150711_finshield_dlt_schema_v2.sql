/*
# FinShield DLT — Core Schema

## Purpose
Persistent storage for the FinShield DLT distributed financial settlement simulation.

## Tables
1. `nodes` — four banking validator nodes with online/malicious status, keys, stats
2. `accounts` — simulated bank accounts with balances (INR)
3. `transactions` — settlement transactions with full lifecycle state, hashes, signatures, risk
4. `blocks` — blockchain blocks with hash chain, merkle root, validator signatures
5. `validator_votes` — per-node PBFT votes for each transaction
6. `security_events` — detected threats
7. `audit_logs` — immutable audit trail

## Security
- Single-tenant simulation app (no sign-in) → RLS enabled, policies use TO anon, authenticated
*/

-- ============ NODES ============
CREATE TABLE IF NOT EXISTS nodes (
  id text PRIMARY KEY,
  name text NOT NULL,
  online boolean NOT NULL DEFAULT true,
  malicious boolean NOT NULL DEFAULT false,
  public_key text NOT NULL,
  private_key text NOT NULL,
  validations int NOT NULL DEFAULT 0,
  approvals int NOT NULL DEFAULT 0,
  rejections int NOT NULL DEFAULT 0,
  latency_ms int NOT NULL DEFAULT 20,
  last_heartbeat timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============ ACCOUNTS ============
CREATE TABLE IF NOT EXISTS accounts (
  id text PRIMARY KEY,
  bank_id text NOT NULL REFERENCES nodes(id),
  holder text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============ TRANSACTIONS ============
CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY,
  sender_bank text NOT NULL,
  receiver_bank text NOT NULL,
  sender_account text NOT NULL,
  receiver_account text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  tx_hash text NOT NULL,
  signature text NOT NULL,
  signer text NOT NULL,
  risk_score int NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'LOW',
  risk_factors jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'PROCESSING',
  block_number int,
  rejection_reason text,
  is_replay boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  committed_at timestamptz
);

-- ============ BLOCKS ============
CREATE TABLE IF NOT EXISTS blocks (
  block_number int PRIMARY KEY,
  timestamp timestamptz DEFAULT now(),
  prev_hash text NOT NULL,
  block_hash text NOT NULL,
  merkle_root text NOT NULL,
  tx_count int NOT NULL DEFAULT 0,
  validator_count int NOT NULL DEFAULT 0,
  consensus_status text NOT NULL DEFAULT 'ACHIEVED',
  validator_signatures jsonb DEFAULT '[]'::jsonb,
  integrity_status text NOT NULL DEFAULT 'VERIFIED',
  tampered boolean NOT NULL DEFAULT false
);

-- ============ VALIDATOR VOTES ============
CREATE TABLE IF NOT EXISTS validator_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text NOT NULL REFERENCES transactions(id),
  node_id text NOT NULL REFERENCES nodes(id),
  phase text NOT NULL,
  vote text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- ============ SECURITY EVENTS ============
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  transaction_id text,
  node_id text,
  severity text NOT NULL DEFAULT 'MEDIUM',
  action text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

-- ============ AUDIT LOGS ============
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  actor text NOT NULL,
  transaction_id text,
  severity text NOT NULL DEFAULT 'INFO',
  details text,
  created_at timestamptz DEFAULT now()
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_tx ON validator_votes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_blocks_number ON blocks(block_number);

-- ============ RLS ============
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE validator_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Nodes
DROP POLICY IF EXISTS "anon_select_nodes" ON nodes;
CREATE POLICY "anon_select_nodes" ON nodes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_nodes" ON nodes;
CREATE POLICY "anon_insert_nodes" ON nodes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_nodes" ON nodes;
CREATE POLICY "anon_update_nodes" ON nodes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_nodes" ON nodes;
CREATE POLICY "anon_delete_nodes" ON nodes FOR DELETE TO anon, authenticated USING (true);

-- Accounts
DROP POLICY IF EXISTS "anon_select_accounts" ON accounts;
CREATE POLICY "anon_select_accounts" ON accounts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_accounts" ON accounts;
CREATE POLICY "anon_insert_accounts" ON accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_accounts" ON accounts;
CREATE POLICY "anon_update_accounts" ON accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_accounts" ON accounts;
CREATE POLICY "anon_delete_accounts" ON accounts FOR DELETE TO anon, authenticated USING (true);

-- Transactions
DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE TO anon, authenticated USING (true);

-- Blocks
DROP POLICY IF EXISTS "anon_select_blocks" ON blocks;
CREATE POLICY "anon_select_blocks" ON blocks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_blocks" ON blocks;
CREATE POLICY "anon_insert_blocks" ON blocks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_blocks" ON blocks;
CREATE POLICY "anon_update_blocks" ON blocks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_blocks" ON blocks;
CREATE POLICY "anon_delete_blocks" ON blocks FOR DELETE TO anon, authenticated USING (true);

-- Validator votes
DROP POLICY IF EXISTS "anon_select_votes" ON validator_votes;
CREATE POLICY "anon_select_votes" ON validator_votes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_votes" ON validator_votes;
CREATE POLICY "anon_insert_votes" ON validator_votes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_votes" ON validator_votes;
CREATE POLICY "anon_delete_votes" ON validator_votes FOR DELETE TO anon, authenticated USING (true);

-- Security events
DROP POLICY IF EXISTS "anon_select_security_events" ON security_events;
CREATE POLICY "anon_select_security_events" ON security_events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_security_events" ON security_events;
CREATE POLICY "anon_insert_security_events" ON security_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_security_events" ON security_events;
CREATE POLICY "anon_delete_security_events" ON security_events FOR DELETE TO anon, authenticated USING (true);

-- Audit logs
DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
CREATE POLICY "anon_select_audit_logs" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
CREATE POLICY "anon_insert_audit_logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_audit_logs" ON audit_logs;
CREATE POLICY "anon_delete_audit_logs" ON audit_logs FOR DELETE TO anon, authenticated USING (true);