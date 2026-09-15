/**
 * FinShield DLT — Prototype Transaction Risk Engine
 * Rule-based risk scoring (NOT a production AML model).
 */

export interface RiskFactor {
  label: string;
  points: number;
}

export interface RiskResult {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
}

export function calculateRisk(
  amount: number,
  senderAccount: string,
  receiverAccount: string,
  recentTxCount: number,
  hasRecentSecurityEvents: boolean,
  isReplay: boolean,
): RiskResult {
  const factors: RiskFactor[] = [];

  if (amount > 100000) {
    factors.push({ label: 'Unusually high amount', points: 30 });
  } else if (amount > 50000) {
    factors.push({ label: 'High amount', points: 18 });
  } else if (amount > 25000) {
    factors.push({ label: 'Elevated amount', points: 10 });
  }

  if (recentTxCount >= 5) {
    factors.push({ label: 'High transaction frequency', points: 25 });
  } else if (recentTxCount >= 3) {
    factors.push({ label: 'Repeated transfer pattern', points: 15 });
  }

  if (hasRecentSecurityEvents) {
    factors.push({ label: 'Recent security event on account', points: 22 });
  }

  if (isReplay) {
    factors.push({ label: 'Potential replay detected', points: 40 });
  }

  if (senderAccount === receiverAccount) {
    factors.push({ label: 'Sender equals receiver', points: 20 });
  }

  const score = Math.min(100, factors.reduce((sum, f) => sum + f.points, 0));

  let level: RiskResult['level'] = 'LOW';
  if (score > 80) level = 'CRITICAL';
  else if (score > 60) level = 'HIGH';
  else if (score > 30) level = 'MEDIUM';

  return { score, level, factors };
}
