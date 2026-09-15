/**
 * FinShield DLT — Cryptographic Engine
 * SHA-256 hashing, RSA-style key generation, digital signatures, and verification.
 * Uses Web Crypto API for real cryptographic operations.
 */

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

export async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return bufToHex(buf);
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );

  const pubKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: bufToHex(pubKey),
    privateKey: bufToHex(privKey),
  };
}

export async function signData(privateKeyHex: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    hexToBuf(privateKeyHex),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(data),
  );
  return bufToHex(sig);
}

export async function verifySignature(
  publicKeyHex: string,
  signatureHex: string,
  data: string,
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'spki',
      hexToBuf(publicKeyHex),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['verify'],
    );
    return crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      hexToBuf(signatureHex),
      new TextEncoder().encode(data),
    );
  } catch {
    return false;
  }
}

export function canonicalize(payload: Record<string, unknown>): string {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

export function shortHash(hash: string, len = 12): string {
  return hash.slice(0, len) + '...' + hash.slice(-4);
}

export function generateTxId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return (
    'TX-' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}
