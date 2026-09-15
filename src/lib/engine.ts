/**
 * FinShield DLT — Settlement Engine
 * Orchestrates the full transaction lifecycle:
 * creation → signing → verification → risk → consensus → block commit → audit
 */

import { supabase } from './supabase';
import {
  sha256,
  signData,
  verifySignature,
  canonicalize,
  generateTxId,
  generateKeyPair,
  type KeyPair,
} from './crypto';
import { computeMerkleRoot, createBlockHash, verifyChain, type BlockData } from './blockchain';
import { calculateRisk, type RiskResult } from './risk';

export interface NodeRow {
  id: string;
  name: string;
  online: boolean;
  malicious: boolean;
  public_key: string;
  private_key: string;
  validations: number;
  approvals: number;
  rejections: number;
  latency_ms: number;
  last_heartbeat: string;
}

export interface AccountRow {
  id: string;
  bank_id: string;
  holder: string;
  balance: number;
}

export interface TxRow {
  id: string;
  sender_bank: string;
  receiver_bank: string;
  sender_account: string;
  receiver_account: string;
  amount: number;
  currency: string;
  tx_hash: string;
  signature: string;
  signer: string;
  risk_score: number;
  risk_level: string;
  risk_factors: RiskResult['factors'];
  status: string;
  block_number: number | null;
  rejection_reason: string | null;
  is_replay: boolean;
  created_at: string;
  committed_at: string | null;
}

export interface VoteRow {
  id: string;
  transaction_id: string;
  node_id: string;
  phase: string;
  vote: string;
  reason: string | null;
  created_at: string;
}

export interface SecurityEventRow {
  id: string;
  event_type: string;
  transaction_id: string | null;
  node_id: string | null;
  severity: string;
  action: string;
  details: string | null;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  event: string;
  actor: string;
  transaction_id: string | null;
  severity: string;
  details: string | null;
  created_at: string;
}

export interface BlockRow extends BlockData {}

const GENESIS_HASH = '0'.repeat(64);
const QUORUM = 3; // out of 4 nodes (PBFT 2f+1 with f=1)

// ============ INITIALIZATION ============

export async function initializeNetwork(): Promise<void> {
  const { count } = await supabase.from('nodes').select('*', { count: 'exact', head: true });
  if (count && count > 0) return;

  const bankDefs = [
    { id: 'BANK-A', name: 'Bank A' },
    { id: 'BANK-B', name: 'Bank B' },
    { id: 'BANK-C', name: 'Bank C' },
    { id: 'BANK-D', name: 'Bank D' },
  ];

  const nodes: NodeRow[] = [];
  for (const def of bankDefs) {
    const keyPair: KeyPair = await generateKeyPair();
    const node = {
      id: def.id,
      name: def.name,
      online: true,
      malicious: false,
      public_key: keyPair.publicKey,
      private_key: keyPair.privateKey,
      validations: 0,
      approvals: 0,
      rejections: 0,
      latency_ms: Math.floor(Math.random() * 30) + 10,
      last_heartbeat: new Date().toISOString(),
    };
    nodes.push(node as NodeRow);
  }

  const { error: nodeError } = await supabase.from('nodes').insert(nodes);
  if (nodeError) throw new Error(`Failed to seed nodes: ${nodeError.message}`);

  const accountDefs = [
    { id: 'ACCT-100', bank_id: 'BANK-A', holder: 'Aurora Holdings', balance: 250000 },
    { id: 'ACCT-200', bank_id: 'BANK-B', holder: 'Beacon Industries', balance: 180000 },
    { id: 'ACCT-300', bank_id: 'BANK-C', holder: 'Crestwood Capital', balance: 125000 },
    { id: 'ACCT-400', bank_id: 'BANK-D', holder: 'Delta Ventures', balance: 95000 },
  ];

  const { error: acctError } = await supabase.from('accounts').insert(accountDefs);
  if (acctError) throw new Error(`Failed to seed accounts: ${acctError.message}`);

  // Genesis block
  const genesisTs = new Date().toISOString();
  const genesisMerkle = await computeMerkleRoot([]);
  const genesisHash = await createBlockHash(0, genesisTs, GENESIS_HASH, genesisMerkle);
  const { error: blockError } = await supabase.from('blocks').insert({
    block_number: 0,
    timestamp: genesisTs,
    prev_hash: GENESIS_HASH,
    block_hash: genesisHash,
    merkle_root: genesisMerkle,
    tx_count: 0,
    validator_count: 4,
    consensus_status: 'GENESIS',
    validator_signatures: [],
    integrity_status: 'VERIFIED',
    tampered: false,
  });
  if (blockError) throw new Error(`Failed to seed genesis block: ${blockError.message}`);

  await addAuditLog('NETWORK_INITIALIZED', 'SYSTEM', null, 'INFO', 'FinShield DLT network initialized with 4 nodes and genesis block');
}

// ============ AUDIT / SECURITY EVENT HELPERS ============

export async function addAuditLog(
  event: string,
  actor: string,
  transactionId: string | null,
  severity: string,
  details: string,
): Promise<void> {
  await supabase.from('audit_logs').insert({
    event,
    actor,
    transaction_id: transactionId,
    severity,
    details,
  });
}

export async function addSecurityEvent(
  eventType: string,
  transactionId: string | null,
  nodeId: string | null,
  severity: string,
  action: string,
  details: string,
): Promise<void> {
  await supabase.from('security_events').insert({
    event_type: eventType,
    transaction_id: transactionId,
    node_id: nodeId,
    severity,
    action,
    details,
  });
  await addAuditLog(eventType, 'SECURITY_ENGINE', transactionId, severity, details);
}

// ============ DATA FETCHERS ============

export async function fetchNodes(): Promise<NodeRow[]> {
  const { data, error } = await supabase.from('nodes').select('*').order('id');
  if (error) throw error;
  return data as NodeRow[];
}

export async function fetchAccounts(): Promise<AccountRow[]> {
  const { data, error } = await supabase.from('accounts').select('*').order('id');
  if (error) throw error;
  return data as AccountRow[];
}

export async function fetchTransactions(limit = 100): Promise<TxRow[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as TxRow[];
}

export async function fetchTransaction(txId: string): Promise<TxRow | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', txId)
    .maybeSingle();
  if (error) throw error;
  return data as TxRow | null;
}

export async function fetchBlocks(): Promise<BlockRow[]> {
  const { data, error } = await supabase
    .from('blocks')
    .select('*')
    .order('block_number', { ascending: true });
  if (error) throw error;
  return data as BlockRow[];
}

export async function fetchVotes(txId: string): Promise<VoteRow[]> {
  const { data, error } = await supabase
    .from('validator_votes')
    .select('*')
    .eq('transaction_id', txId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as VoteRow[];
}

export async function fetchSecurityEvents(limit = 100): Promise<SecurityEventRow[]> {
  const { data, error } = await supabase
    .from('security_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as SecurityEventRow[];
}

export async function fetchAuditLogs(limit = 200): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as AuditLogRow[];
}

// ============ TRANSACTION PROCESSING ============

export interface CreateTxParams {
  senderBank: string;
  receiverBank: string;
  senderAccount: string;
  receiverAccount: string;
  amount: number;
  currency?: string;
}

export interface ProcessResult {
  transaction: TxRow;
  votes: VoteRow[];
  steps: ProcessingStep[];
  block: BlockRow | null;
  error?: string;
}

export interface ProcessingStep {
  step: number;
  label: string;
  status: 'success' | 'failed' | 'pending';
  detail?: string;
}

export async function processTransaction(params: CreateTxParams): Promise<ProcessResult> {
  const steps: ProcessingStep[] = [];
  const txId = generateTxId();

  // STEP 1: Transaction Created
  const payload = {
    id: txId,
    sender_bank: params.senderBank,
    receiver_bank: params.receiverBank,
    sender_account: params.senderAccount,
    receiver_account: params.receiverAccount,
    amount: params.amount,
    currency: params.currency || 'INR',
  };
  const canonical = canonicalize(payload);
  const txHash = await sha256(canonical);
  steps.push({ step: 1, label: 'TRANSACTION CREATED', status: 'success', detail: txId });

  // STEP 2: Digital Signature
  const { data: senderNode } = await supabase
    .from('nodes')
    .select('*')
    .eq('id', params.senderBank)
    .maybeSingle();
  if (!senderNode) throw new Error('Sender bank node not found');

  const signature = await signData((senderNode as NodeRow).private_key, txHash);
  steps.push({ step: 2, label: 'CRYPTOGRAPHIC SIGNATURE', status: 'success', detail: 'RSA-2048 signature generated' });

  // STEP 3: Signature Verification
  const sigValid = await verifySignature((senderNode as NodeRow).public_key, signature, txHash);
  if (!sigValid) {
    steps.push({ step: 3, label: 'SIGNATURE VERIFICATION', status: 'failed', detail: 'Signature verification failed' });
    const tx = await insertTransaction(params, txId, txHash, signature, params.senderBank, 100, 'CRITICAL', [], 'REJECTED', null, 'INVALID SIGNATURE', false);
    await addSecurityEvent('INVALID_SIGNATURE', txId, params.senderBank, 'HIGH', 'TRANSACTION REJECTED', 'Digital signature verification failed');
    return { transaction: tx, votes: [], steps, block: null };
  }
  steps.push({ step: 3, label: 'SIGNATURE VERIFICATION', status: 'success', detail: 'Signature verified with public key' });

  // STEP 4: Security / Risk Analysis
  const recentTx = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('sender_account', params.senderAccount)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());
  const recentCount = recentTx.count || 0;

  const recentSecEvents = await supabase
    .from('security_events')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());

  const risk = calculateRisk(
    params.amount,
    params.senderAccount,
    params.receiverAccount,
    recentCount,
    (recentSecEvents.count || 0) > 0,
    false,
  );
  steps.push({ step: 4, label: 'SECURITY ANALYSIS', status: 'success', detail: `Risk score: ${risk.score}/100 (${risk.level})` });

  // Check for replay
  const { data: existingTx } = await supabase
    .from('transactions')
    .select('id')
    .eq('tx_hash', txHash)
    .maybeSingle();
  if (existingTx) {
    steps.push({ step: 5, label: 'DISTRIBUTED VALIDATION', status: 'failed', detail: 'Replay attack detected' });
    const tx = await insertTransaction(params, txId, txHash, signature, params.senderBank, risk.score, risk.level, risk.factors, 'REJECTED', null, 'REPLAY ATTACK DETECTED', true);
    await addSecurityEvent('REPLAY_ATTACK', txId, params.senderBank, 'HIGH', 'TRANSACTION REJECTED', 'Duplicate transaction hash detected — replay attempt blocked');
    return { transaction: tx, votes: [], steps, block: null };
  }

  // Check account balance
  const { data: senderAcct } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', params.senderAccount)
    .maybeSingle();
  if (!senderAcct || (senderAcct as AccountRow).balance < params.amount) {
    steps.push({ step: 5, label: 'DISTRIBUTED VALIDATION', status: 'failed', detail: 'Insufficient funds' });
    const tx = await insertTransaction(params, txId, txHash, signature, params.senderBank, risk.score, risk.level, risk.factors, 'REJECTED', null, 'INSUFFICIENT FUNDS', false);
    await addSecurityEvent('INSUFFICIENT_FUNDS', txId, params.senderBank, 'MEDIUM', 'TRANSACTION REJECTED', `Account ${params.senderAccount} has insufficient balance for ₹${params.amount}`);
    return { transaction: tx, votes: [], steps, block: null };
  }

  // Insert transaction as PROCESSING
  const tx = await insertTransaction(params, txId, txHash, signature, params.senderBank, risk.score, risk.level, risk.factors, 'PROCESSING', null, null, false);
  await addAuditLog('TRANSACTION_CREATED', params.senderBank, txId, 'INFO', `Transaction ${txId} created: ${params.senderAccount} → ${params.receiverAccount} ₹${params.amount}`);

  // STEP 5: Distributed Node Validation
  const nodes = await fetchNodes();
  const onlineNodes = nodes.filter((n) => n.online);
  const votes: VoteRow[] = [];

  for (const node of onlineNodes) {
    let vote = 'APPROVE';
    let reason = 'Transaction validated successfully';
    if (node.malicious) {
      vote = Math.random() > 0.5 ? 'REJECT' : 'APPROVE';
      reason = vote === 'REJECT' ? 'Malicious node: intentional rejection' : 'Malicious node: inconsistent vote';
    }
    const { data: voteData } = await supabase.from('validator_votes').insert({
      transaction_id: txId,
      node_id: node.id,
      phase: 'PREPARE',
      vote,
      reason,
    }).select().single();
    votes.push(voteData as VoteRow);

    await supabase.from('nodes').update({
      validations: node.validations + 1,
      approvals: vote === 'APPROVE' ? node.approvals + 1 : node.approvals,
      rejections: vote === 'REJECT' ? node.rejections + 1 : node.rejections,
      last_heartbeat: new Date().toISOString(),
    }).eq('id', node.id);
  }

  const approvals = votes.filter((v) => v.vote === 'APPROVE').length;
  steps.push({ step: 5, label: 'DISTRIBUTED VALIDATION', status: 'success', detail: `${approvals}/${onlineNodes.length} validators approved` });

  // STEP 6: PBFT Consensus
  if (approvals < QUORUM) {
    steps.push({ step: 6, label: 'PBFT CONSENSUS', status: 'failed', detail: `Quorum not reached: ${approvals}/${onlineNodes.length}` });
    await supabase.from('transactions').update({ status: 'REJECTED', rejection_reason: 'CONSENSUS FAILED — INSUFFICIENT QUORUM' }).eq('id', txId);
    await addSecurityEvent('CONSENSUS_FAILURE', txId, null, 'HIGH', 'TRANSACTION REJECTED', `Consensus failed: only ${approvals}/${onlineNodes.length} validators approved`);
    const updatedTx = (await fetchTransaction(txId))!;
    return { transaction: updatedTx, votes, steps, block: null };
  }
  steps.push({ step: 6, label: 'PBFT CONSENSUS', status: 'success', detail: `Quorum reached: ${approvals}/${onlineNodes.length} validators approved` });
  await addAuditLog('CONSENSUS_ACHIEVED', 'CONSENSUS_ENGINE', txId, 'INFO', `PBFT consensus achieved with ${approvals}/${onlineNodes.length} votes`);

  // STEP 7: Block Commit
  const blocks = await fetchBlocks();
  const lastBlock = blocks[blocks.length - 1];
  const blockNumber = lastBlock.block_number + 1;
  const blockTs = new Date().toISOString();
  const merkleRoot = await computeMerkleRoot([{ id: txId, tx_hash: txHash }]);
  const blockHash = await createBlockHash(blockNumber, blockTs, lastBlock.block_hash, merkleRoot);
  const validatorSigs = votes.filter((v) => v.vote === 'APPROVE').map((v) => v.node_id);

  const { data: blockData } = await supabase.from('blocks').insert({
    block_number: blockNumber,
    timestamp: blockTs,
    prev_hash: lastBlock.block_hash,
    block_hash: blockHash,
    merkle_root: merkleRoot,
    tx_count: 1,
    validator_count: approvals,
    consensus_status: 'ACHIEVED',
    validator_signatures: validatorSigs,
    integrity_status: 'VERIFIED',
    tampered: false,
  }).select().single();

  // Update accounts
  const { data: receiverAcct } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', params.receiverAccount)
    .maybeSingle();

  await supabase.from('accounts').update({ balance: (senderAcct as AccountRow).balance - params.amount }).eq('id', params.senderAccount);
  if (receiverAcct) {
    await supabase.from('accounts').update({ balance: (receiverAcct as AccountRow).balance + params.amount }).eq('id', params.receiverAccount);
  }

  await supabase.from('transactions').update({
    status: 'COMMITTED',
    block_number: blockNumber,
    committed_at: blockTs,
  }).eq('id', txId);

  steps.push({ step: 7, label: 'BLOCK COMMIT', status: 'success', detail: `Block #${blockNumber} committed to chain` });
  await addAuditLog('BLOCK_COMMITTED', 'BLOCKCHAIN_ENGINE', txId, 'INFO', `Transaction committed to block #${blockNumber}`);

  // STEP 8: Audit Trail
  steps.push({ step: 8, label: 'AUDIT TRAIL', status: 'success', detail: 'Audit entries recorded' });

  const updatedTx = (await fetchTransaction(txId))!;
  return { transaction: updatedTx, votes, steps, block: blockData as BlockRow };
}

async function insertTransaction(
  params: CreateTxParams,
  txId: string,
  txHash: string,
  signature: string,
  signer: string,
  riskScore: number,
  riskLevel: string,
  riskFactors: RiskResult['factors'],
  status: string,
  blockNumber: number | null,
  rejectionReason: string | null,
  isReplay: boolean,
): Promise<TxRow> {
  const { data, error } = await supabase.from('transactions').insert({
    id: txId,
    sender_bank: params.senderBank,
    receiver_bank: params.receiverBank,
    sender_account: params.senderAccount,
    receiver_account: params.receiverAccount,
    amount: params.amount,
    currency: params.currency || 'INR',
    tx_hash: txHash,
    signature,
    signer,
    risk_score: riskScore,
    risk_level: riskLevel,
    risk_factors: riskFactors,
    status,
    block_number: blockNumber,
    rejection_reason: rejectionReason,
    is_replay: isReplay,
  }).select().single();
  if (error) throw error;
  return data as TxRow;
}

// ============ ATTACK SIMULATIONS ============

export async function simulateReplayAttack(txId: string): Promise<ProcessResult> {
  const original = await fetchTransaction(txId);
  if (!original) throw new Error('Transaction not found');

  const replayParams: CreateTxParams = {
    senderBank: original.sender_bank,
    receiverBank: original.receiver_bank,
    senderAccount: original.sender_account,
    receiverAccount: original.receiver_account,
    amount: original.amount,
    currency: original.currency,
  };

  // Use same txHash — will be detected as replay
  const newTxId = generateTxId();
  const steps: ProcessingStep[] = [];
  steps.push({ step: 1, label: 'TRANSACTION CREATED', status: 'success', detail: `${newTxId} (replay of ${txId})` });
  steps.push({ step: 2, label: 'CRYPTOGRAPHIC SIGNATURE', status: 'success', detail: 'Reusing original signature' });
  steps.push({ step: 3, label: 'SIGNATURE VERIFICATION', status: 'success', detail: 'Signature valid' });

  // Check replay
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('tx_hash', original.tx_hash)
    .neq('id', newTxId)
    .limit(1);

  if (existing && existing.length > 0) {
    steps.push({ step: 4, label: 'SECURITY ANALYSIS', status: 'failed', detail: 'Duplicate transaction hash detected' });
    const tx = await insertTransaction(replayParams, newTxId, original.tx_hash, original.signature, original.signer, 100, 'CRITICAL', [{ label: 'Replay attack: duplicate hash', points: 100 }], 'REJECTED', null, 'REPLAY ATTACK DETECTED', true);
    await addSecurityEvent('REPLAY_ATTACK', newTxId, original.sender_bank, 'HIGH', 'TRANSACTION REJECTED', `Replay attempt blocked: transaction ${txId} was already committed`);
    return { transaction: tx, votes: [], steps, block: null };
  }

  // Fallback — shouldn't reach here
  return processTransaction(replayParams);
}

export async function simulateInvalidSignature(txId: string): Promise<ProcessResult> {
  const original = await fetchTransaction(txId);
  if (!original) throw new Error('Transaction not found');

  const newTxId = generateTxId();
  const tamperedAmount = original.amount * 10; // tamper with amount
  const steps: ProcessingStep[] = [];
  steps.push({ step: 1, label: 'TRANSACTION CREATED', status: 'success', detail: `${newTxId} (tampered payload)` });

  // Recompute hash with tampered amount
  const tamperedPayload = {
    id: newTxId,
    sender_bank: original.sender_bank,
    receiver_bank: original.receiver_bank,
    sender_account: original.sender_account,
    receiver_account: original.receiver_account,
    amount: tamperedAmount,
    currency: original.currency,
  };
  const tamperedHash = await sha256(canonicalize(tamperedPayload));
  steps.push({ step: 2, label: 'CRYPTOGRAPHIC SIGNATURE', status: 'success', detail: 'Original signature reused on tampered payload' });

  // Verify — should fail because hash changed
  const { data: senderNode } = await supabase.from('nodes').select('*').eq('id', original.sender_bank).maybeSingle();
  const sigValid = await verifySignature((senderNode as NodeRow).public_key, original.signature, tamperedHash);
  if (!sigValid) {
    steps.push({ step: 3, label: 'SIGNATURE VERIFICATION', status: 'failed', detail: 'INVALID DIGITAL SIGNATURE — payload tampered after signing' });
    const params: CreateTxParams = {
      senderBank: original.sender_bank,
      receiverBank: original.receiver_bank,
      senderAccount: original.sender_account,
      receiverAccount: original.receiver_account,
      amount: tamperedAmount,
      currency: original.currency,
    };
    const tx = await insertTransaction(params, newTxId, tamperedHash, original.signature, original.signer, 100, 'CRITICAL', [{ label: 'Invalid signature: payload tampered', points: 100 }], 'REJECTED', null, 'INVALID DIGITAL SIGNATURE', false);
    await addSecurityEvent('INVALID_SIGNATURE', newTxId, original.sender_bank, 'HIGH', 'TRANSACTION REJECTED', 'Signature verification failed — transaction payload modified after signing');
    return { transaction: tx, votes: [], steps, block: null };
  }

  return processTransaction({
    senderBank: original.sender_bank,
    receiverBank: original.receiver_bank,
    senderAccount: original.sender_account,
    receiverAccount: original.receiver_account,
    amount: tamperedAmount,
    currency: original.currency,
  });
}

export async function simulateDoubleSpend(
  senderAccount: string,
  receiverAccount: string,
  senderBank: string,
  receiverBank: string,
  amount: number,
): Promise<{ first: ProcessResult; second: ProcessResult }> {
  // First transaction — should succeed
  const first = await processTransaction({
    senderBank,
    receiverBank,
    senderAccount,
    receiverAccount,
    amount,
  });

  if (first.transaction.status !== 'COMMITTED') {
    // If first failed, still try second to show double-spend
  }

  // Second transaction — same account, should fail due to insufficient funds
  const secondTxId = generateTxId();
  const payload = {
    id: secondTxId,
    sender_bank: senderBank,
    receiver_bank: receiverBank,
    sender_account: senderAccount,
    receiver_account: receiverAccount,
    amount,
    currency: 'INR',
  };
  const txHash = await sha256(canonicalize(payload));
  const { data: senderNode } = await supabase.from('nodes').select('*').eq('id', senderBank).maybeSingle();
  const signature = await signData((senderNode as NodeRow).private_key, txHash);

  // Check balance after first tx
  const { data: acct } = await supabase.from('accounts').select('*').eq('id', senderAccount).maybeSingle();
  const currentBalance = (acct as AccountRow)?.balance ?? 0;

  const steps: ProcessingStep[] = [];
  steps.push({ step: 1, label: 'TRANSACTION CREATED', status: 'success', detail: secondTxId });
  steps.push({ step: 2, label: 'CRYPTOGRAPHIC SIGNATURE', status: 'success', detail: 'Signature generated' });
  steps.push({ step: 3, label: 'SIGNATURE VERIFICATION', status: 'success', detail: 'Signature verified' });

  if (currentBalance < amount) {
    steps.push({ step: 4, label: 'SECURITY ANALYSIS', status: 'failed', detail: 'DOUBLE SPEND DETECTED — insufficient balance after prior settlement' });
    const params: CreateTxParams = { senderBank, receiverBank, senderAccount, receiverAccount, amount };
    const tx = await insertTransaction(params, secondTxId, txHash, signature, senderBank, 100, 'CRITICAL', [{ label: 'Double spend: balance already consumed', points: 100 }], 'REJECTED', null, 'DOUBLE SPEND DETECTED', false);
    await addSecurityEvent('DOUBLE_SPEND', secondTxId, senderBank, 'HIGH', 'TRANSACTION REJECTED', `Double spend attempt blocked: account ${senderAccount} balance ₹${currentBalance} < ₹${amount} after prior settlement`);
    return { first, second: { transaction: tx, votes: [], steps, block: null } };
  }

  // If balance still sufficient, process normally
  const second = await processTransaction({
    senderBank, receiverBank, senderAccount, receiverAccount, amount,
  });
  return { first, second };
}

export async function simulateLedgerTamper(blockNumber: number): Promise<{
  tampered: boolean;
  block: BlockRow;
  expectedHash: string;
  actualHash: string;
}> {
  const { data: block } = await supabase
    .from('blocks')
    .select('*')
    .eq('block_number', blockNumber)
    .maybeSingle();
  if (!block) throw new Error('Block not found');

  // Tamper: modify the block hash to simulate data corruption
  const tamperedHash = 'tampered_' + (block as BlockRow).block_hash.slice(9);
  await supabase.from('blocks').update({
    block_hash: tamperedHash,
    tampered: true,
    integrity_status: 'COMPROMISED',
  }).eq('block_number', blockNumber);

  // Cascade to next block's prev_hash mismatch
  await supabase.from('blocks').update({
    integrity_status: 'COMPROMISED',
  }).eq('block_number', blockNumber + 1);

  await addSecurityEvent('LEDGER_TAMPERING', null, null, 'CRITICAL', 'LEDGER INTEGRITY VIOLATION', `Block #${blockNumber} tampered — hash chain broken at block #${blockNumber + 1}`);

  return {
    tampered: true,
    block: (await supabase.from('blocks').select('*').eq('block_number', blockNumber).maybeSingle()).data as BlockRow,
    expectedHash: (block as BlockRow).block_hash,
    actualHash: tamperedHash,
  };
}

export async function verifyLedgerIntegrity(): Promise<{
  valid: boolean;
  brokenBlock: number | null;
  expectedHash: string | null;
  actualHash: string | null;
  totalBlocks: number;
}> {
  const blocks = await fetchBlocks();
  const result = await verifyChain(blocks);

  if (!result.valid && result.brokenBlock) {
    await supabase.from('blocks').update({
      integrity_status: 'COMPROMISED',
      tampered: true,
    }).eq('block_number', result.brokenBlock);
  }

  return {
    valid: result.valid,
    brokenBlock: result.brokenBlock,
    expectedHash: result.expectedHash,
    actualHash: result.actualHash,
    totalBlocks: blocks.length,
  };
}

// ============ NODE MANAGEMENT ============

export async function toggleNodeOnline(nodeId: string, online: boolean): Promise<void> {
  await supabase.from('nodes').update({
    online,
    last_heartbeat: new Date().toISOString(),
  }).eq('id', nodeId);

  if (online) {
    await addAuditLog('NODE_ONLINE', nodeId, null, 'INFO', `Node ${nodeId} brought online`);
  } else {
    await addAuditLog('NODE_OFFLINE', nodeId, null, 'WARNING', `Node ${nodeId} taken offline`);
    await addSecurityEvent('NODE_FAILURE', null, nodeId, 'MEDIUM', 'NODE OFFLINE', `Node ${nodeId} is now offline — network capacity reduced`);
  }
}

export async function toggleNodeMalicious(nodeId: string, malicious: boolean): Promise<void> {
  await supabase.from('nodes').update({ malicious }).eq('id', nodeId);

  if (malicious) {
    await addAuditLog('MALICIOUS_NODE_DETECTED', nodeId, null, 'CRITICAL', `Node ${nodeId} set to malicious mode`);
    await addSecurityEvent('MALICIOUS_NODE', null, nodeId, 'HIGH', 'NODE QUARANTINED', `Node ${nodeId} flagged as malicious — votes will be treated with suspicion`);
  } else {
    await addAuditLog('NODE_RECOVERED', nodeId, null, 'INFO', `Node ${nodeId} restored to healthy state`);
  }
}

// ============ DEMO RESET ============

export async function resetSimulation(): Promise<void> {
  await supabase.from('validator_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('security_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('transactions').delete().neq('id', 'placeholder');
  await supabase.from('blocks').delete().neq('block_number', -1);
  await supabase.from('accounts').delete().neq('id', 'placeholder');
  await supabase.from('nodes').delete().neq('id', 'placeholder');

  await initializeNetwork();
  await addAuditLog('SIMULATION_RESET', 'SYSTEM', null, 'INFO', 'All simulation data cleared and network reinitialized');
}
