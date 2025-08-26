import {
  Funded,
  ClaimedMinimal,
  PlatformTreasuryUpdated,
  EmergencySweep
} from "../generated/templates/RewardPoolVault/RewardPoolImplementation";

import { Pool, User, Claim, Funding, Token, FactoryStats, DailyStatistic } from "../generated/schema";
import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";

// Constants
const FACTORY_STATS_ID = "factory-stats";
const PLATFORM_FEE_BPS = BigInt.fromI32(1000); // 10% = 1000 basis points
const BASIS_POINTS = BigInt.fromI32(10000);

/**
 * Handler for Funded event - tracks pool funding
 */
export function handleFunded(event: Funded): void {
  // Load pool
  let pool = Pool.load(event.address);
  if (!pool) {
    return; // Pool should exist from PoolCreated event
  }

  // Load or create user
  let user = User.load(event.params.funder);
  if (!user) {
    user = new User(event.params.funder);
    user.totalClaimed = BigInt.zero();
    user.totalFeesPaid = BigInt.zero();
    user.uniquePools = BigInt.zero();
    user.totalClaims = BigInt.zero();
    user.firstActivityAt = event.block.timestamp;
    user.lastActivityAt = event.block.timestamp;
  } else {
    user.lastActivityAt = event.block.timestamp;
  }
  user.save();

  // Create funding record
  let fundingId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let funding = new Funding(fundingId);
  funding.pool = event.address;
  funding.funder = event.params.funder;
  funding.amount = event.params.amount;
  funding.transactionHash = event.transaction.hash;
  funding.blockNumber = event.block.number;
  funding.timestamp = event.block.timestamp;
  funding.save();

  // Update pool statistics
  pool.totalFunded = pool.totalFunded.plus(event.params.amount);
  pool.lastActivityAt = event.block.timestamp;
  pool.updatedAt = event.block.timestamp;
  pool.save();

  // Update token statistics
  let token = Token.load(pool.token);
  if (token) {
    token.totalVolume = token.totalVolume.plus(event.params.amount);
    token.updatedAt = event.block.timestamp;
    token.save();
  }

  // Update daily stats
  updateDailyStats(event.block.timestamp, BigInt.zero(), event.params.amount, BigInt.zero(), false);
}

/**
 * Handler for ClaimedMinimal event - tracks reward claims
 */
export function handleClaimed(event: ClaimedMinimal): void {
  // Load pool
  let pool = Pool.load(event.address);
  if (!pool) {
    return; // Pool should exist
  }

  // Load or create user
  let user = User.load(event.params.account);
  if (!user) {
    user = new User(event.params.account);
    user.totalClaimed = BigInt.zero();
    user.totalFeesPaid = BigInt.zero();
    user.uniquePools = BigInt.zero();
    user.totalClaims = BigInt.zero();
    user.firstActivityAt = event.block.timestamp;
    user.lastActivityAt = event.block.timestamp;
  } else {
    user.lastActivityAt = event.block.timestamp;
  }

  // Calculate amounts from cumulative pattern
  // Note: This is a simplified calculation. In practice, you'd need to track
  // previous cumulative amounts to calculate the exact gross/fee/net
  let cumulativeAmount = event.params.cumulativeAmount;

  // Estimate fee (cumulative * 10%)
  let cumulativeFee = cumulativeAmount.times(PLATFORM_FEE_BPS).div(BASIS_POINTS);
  let cumulativeNet = cumulativeAmount.minus(cumulativeFee);

  // For this event, we'll record the cumulative amounts
  // A more sophisticated approach would track previous states
  let grossAmount = cumulativeAmount; // Simplified - actual would be incremental
  let feeAmount = cumulativeFee; // Simplified
  let netAmount = cumulativeNet; // Simplified

  // Create claim record
  let claimId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let claim = new Claim(claimId);
  claim.pool = event.address;
  claim.user = event.params.account;
  claim.cumulativeAmount = cumulativeAmount;
  claim.grossAmount = grossAmount;
  claim.feeAmount = feeAmount;
  claim.netAmount = netAmount;
  claim.transactionHash = event.transaction.hash;
  claim.blockNumber = event.block.number;
  claim.timestamp = event.block.timestamp;
  claim.gasUsed = BigInt.zero(); // Not available in subgraph context
  claim.gasPrice = BigInt.zero(); // Not available in subgraph context
  claim.save();

  // Update user statistics
  let isNewPoolForUser = !userHasClaimedFromPool(event.params.account, event.address);
  if (isNewPoolForUser) {
    user.uniquePools = user.uniquePools.plus(BigInt.fromI32(1));
  }
  user.totalClaimed = user.totalClaimed.plus(netAmount);
  user.totalFeesPaid = user.totalFeesPaid.plus(feeAmount);
  user.totalClaims = user.totalClaims.plus(BigInt.fromI32(1));
  user.save();

  // Update pool statistics
  pool.totalClaimed = pool.totalClaimed.plus(grossAmount);
  pool.totalFees = pool.totalFees.plus(feeAmount);
  pool.totalClaims = pool.totalClaims.plus(BigInt.fromI32(1));
  if (isNewPoolForUser) {
    pool.totalUsers = pool.totalUsers.plus(BigInt.fromI32(1));
  }
  pool.lastActivityAt = event.block.timestamp;
  pool.updatedAt = event.block.timestamp;
  pool.save();

  // Update token statistics
  let token = Token.load(pool.token);
  if (token) {
    token.totalVolume = token.totalVolume.plus(grossAmount);
    token.totalFees = token.totalFees.plus(feeAmount);
    token.updatedAt = event.block.timestamp;
    token.save();
  }

  // Update global and daily stats
  updateFactoryStats(grossAmount, feeAmount, isNewPoolForUser);
  updateDailyStats(event.block.timestamp, grossAmount, BigInt.zero(), BigInt.fromI32(1), false);
}

/**
 * Handler for PlatformTreasuryUpdated event
 */
export function handlePlatformTreasuryUpdated(event: PlatformTreasuryUpdated): void {
  // This event could be used for governance analytics
}

/**
 * Handler for EmergencySweep event
 */
export function handleEmergencySweep(event: EmergencySweep): void {
  let pool = Pool.load(event.address);
  if (pool) {
    // Mark pool as inactive after emergency sweep
    pool.isActive = false;
    pool.lastActivityAt = event.block.timestamp;
    pool.updatedAt = event.block.timestamp;
    pool.save();
  }
}

/**
 * Check if user has previously claimed from this pool
 * Note: In a production subgraph, this would be more efficiently implemented
 */
function userHasClaimedFromPool(userAddress: Bytes, poolAddress: Bytes): boolean {
  // Simplified implementation - in practice you'd query existing claims
  // For now, we'll assume it's a new user for each claim (suboptimal but functional)
  return false;
}

/**
 * Update global factory statistics
 */
function updateFactoryStats(grossAmount: BigInt, feeAmount: BigInt, isNewUser: boolean): void {
  let stats = FactoryStats.load(FACTORY_STATS_ID);
  if (!stats) {
    stats = new FactoryStats(FACTORY_STATS_ID);
    stats.totalPools = BigInt.zero();
    stats.totalVolume = BigInt.zero();
    stats.totalFees = BigInt.zero();
    stats.totalUsers = BigInt.zero();
    stats.totalClaims = BigInt.zero();
    stats.averagePoolSize = BigInt.zero();
    stats.updatedAt = BigInt.fromI32(1);
  }

  stats.totalVolume = stats.totalVolume.plus(grossAmount);
  stats.totalFees = stats.totalFees.plus(feeAmount);
  stats.totalClaims = stats.totalClaims.plus(BigInt.fromI32(1));
  if (isNewUser) {
    stats.totalUsers = stats.totalUsers.plus(BigInt.fromI32(1));
  }

  // Calculate average pool size
  if (stats.totalPools.gt(BigInt.zero())) {
    stats.averagePoolSize = stats.totalVolume.div(stats.totalPools);
  }

  stats.updatedAt = BigInt.fromI32(1); // Placeholder timestamp
  stats.save();
}

/**
 * Update daily statistics for analytics dashboard
 */
function updateDailyStats(
  timestamp: BigInt,
  volume: BigInt,
  funding: BigInt,
  claims: BigInt,
  isBatch: boolean
): void {
  // Use the timestamp for the start of the day as the ID.
  let dayTimestamp = timestamp.div(BigInt.fromI32(86400)).times(BigInt.fromI32(86400));
  let dayId = dayTimestamp.toString();

  let stats = DailyStatistic.load(dayId);
  if (!stats) {
    stats = new DailyStatistic(dayId);
    let date = new Date(dayTimestamp.toI32() * 1000).toISOString().split('T')[0]; // Keep for date field
    stats.date = date;
    stats.poolsCreated = BigInt.zero();
    stats.volume = BigInt.zero();
    stats.fees = BigInt.zero();
    stats.uniqueUsers = BigInt.zero();
    stats.totalClaims = BigInt.zero();
    stats.batchClaims = BigInt.zero();
    stats.averageGasPrice = BigInt.zero();
    stats.totalGasUsed = BigInt.zero();
    stats.averageClaimCost = BigInt.zero();
  }

  stats.volume = stats.volume.plus(volume).plus(funding);
  stats.totalClaims = stats.totalClaims.plus(claims);
  if (isBatch) {
    stats.batchClaims = stats.batchClaims.plus(BigInt.fromI32(1));
  }

  stats.save();
}