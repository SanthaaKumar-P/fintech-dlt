/**
 * FinShield DLT — Blockchain Engine
 * Block creation, hash chaining, Merkle root computation, chain integrity verification.
 */

import { sha256 } from './crypto';

export interface BlockData {
  block_number: number;
  timestamp: string;
  prev_hash: string;
  block_hash: string;
  merkle_root: string;
  tx_count: number;
  validator_count: number;
  consensus_status: string;
  validator_signatures: string[];
  integrity_status: string;
  tampered: boolean;
}

export interface TxRef {
  id: string;
  tx_hash: string;
}

export async function computeMerkleRoot(txs: TxRef[]): Promise<string> {
  if (txs.length === 0) return await sha256('empty');
  let hashes = await Promise.all(txs.map((tx) => sha256(tx.tx_hash)));
  while (hashes.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = i + 1 < hashes.length ? hashes[i + 1] : hashes[i];
      next.push(await sha256(left + right));
    }
    hashes = next;
  }
  return hashes[0];
}

export async function createBlockHash(
  blockNumber: number,
  timestamp: string,
  prevHash: string,
  merkleRoot: string,
): Promise<string> {
  return await sha256(`${blockNumber}|${timestamp}|${prevHash}|${merkleRoot}`);
}

export interface IntegrityResult {
  valid: boolean;
  brokenBlock: number | null;
  expectedHash: string | null;
  actualHash: string | null;
}

export async function verifyChain(blocks: BlockData[]): Promise<IntegrityResult> {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (i === 0) continue;
    const prev = blocks[i - 1];
    if (block.prev_hash !== prev.block_hash) {
      return {
        valid: false,
        brokenBlock: block.block_number,
        expectedHash: prev.block_hash,
        actualHash: block.prev_hash,
      };
    }
    const recomputed = await createBlockHash(
      block.block_number,
      block.timestamp,
      block.prev_hash,
      block.merkle_root,
    );
    if (recomputed !== block.block_hash) {
      return {
        valid: false,
        brokenBlock: block.block_number,
        expectedHash: recomputed,
        actualHash: block.block_hash,
      };
    }
  }
  return { valid: true, brokenBlock: null, expectedHash: null, actualHash: null };
}
