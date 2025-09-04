import {
  Funded,
  Withdrawn,
  ClaimedMinimal,
  PlatformTreasuryUpdated,
  EmergencySweep,
  EmergencySweepNoticeInitiated
} from "../generated/templates/RewardPoolVault/RewardPoolImplementation";

import { Pool, User, Claim, Funding, Token, FactoryStats, DailyStatistic, UserPoolState } from "../generated/schema";
import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";

// Constants
const FACTORY_STATS_ID = "factory-stats";
const PLATFORM_FEE_BPS = BigInt.fromI32(1000); // 10% = 1000 basis points
const BASIS_POINTS = BigInt.fromI32(10000);

/**
 * Create new user entity with proper initialization
 */
function createUser(userAddress: Bytes, timestamp: BigInt): User {
  let user = new User(userAddress);
  user.totalClaimed = BigInt.zero();
  user.totalFeesPaid = BigInt.zero();
  user.uniquePools = BigInt.zero();
  user.totalClaims = BigInt.zero();
  user.firstActivityAt = timestamp;
  user.lastActivityAt = timestamp;
  user.save();
  return user;
}

/**
 * Create new user pool state for tracking cumulative amounts per pool
 */
function createUserPoolState(
  userPoolStateId: Bytes,
  userAddress: Bytes,
  poolAddress: Bytes,
  timestamp: BigInt
): UserPoolState {
  let userPoolState = new UserPoolState(userPoolStateId);
  userPoolState.user = userAddress;
  userPoolState.pool = poolAddress;
  userPoolState.lastCumulativeAmount = BigInt.zero();
  userPoolState.totalClaimed = BigInt.zero();
  userPoolState.totalFeesPaid = BigInt.zero();
  userPoolState.claimCount = BigInt.zero();
  userPoolState.firstClaimAt = timestamp;
  userPoolState.lastClaimAt = timestamp;
  userPoolState.save();
  return userPoolState;
}

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
    user = createUser(event.params.funder, event.block.timestamp);
  } else {
    user.lastActivityAt = event.block.timestamp;
    user.save();
  }

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
 * Handler for Withdrawn event - tracks creator withdrawals
 */
export function handleWithdrawn(event: Withdrawn): void {
  // Load pool
  let pool = Pool.load(event.address);
  if (!pool) {
    return; // Pool should exist from PoolCreated event
  }

  // Load or create user (creator)
  let user = User.load(event.params.creator);
  if (!user) {
    user = createUser(event.params.creator, event.block.timestamp);
  } else {
    user.lastActivityAt = event.block.timestamp;
    user.save();
  }

  // Create withdrawal record (reuse Funding entity for simplicity)
  let withdrawalId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let withdrawal = new Funding(withdrawalId);
  withdrawal.pool = event.address;
  withdrawal.funder = event.params.creator;
  withdrawal.amount = event.params.amount.neg(); // Negative amount to indicate withdrawal
  withdrawal.transactionHash = event.transaction.hash;
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.save();

  // Update pool statistics - subtract withdrawn amount from funded total
  pool.totalFunded = pool.totalFunded.minus(event.params.amount);
  pool.lastActivityAt = event.block.timestamp;
  pool.updatedAt = event.block.timestamp;
  pool.save();

  // Update token statistics
  let token = Token.load(pool.token);
  if (token) {
    token.totalVolume = token.totalVolume.plus(event.params.amount); // Still count as volume
    token.updatedAt = event.block.timestamp;
    token.save();
  }

  // Update daily stats - withdrawal counts as negative funding
  updateDailyStats(event.block.timestamp, BigInt.zero(), event.params.amount.neg(), BigInt.zero(), false);
}

/**
 * Handler for ClaimedMinimal event - tracks reward claims with proper cumulative calculation
 */
export function handleClaimed(event: ClaimedMinimal): void {
  // Load pool
  let pool = Pool.load(event.address);
  if (!pool) {
    return; // Pool should exist
  }
  
  // Validate pool token
  let token = Token.load(pool.token);
  if (!token || !token.isAllowed) {
    return; // Skip claims for pools with invalid/disallowed tokens
  }

  // Load or create user
  let user = User.load(event.params.account);
  if (!user) {
    user = createUser(event.params.account, event.block.timestamp);
  } else {
    user.lastActivityAt = event.block.timestamp;
  }

  // Get or create user pool state for incremental calculation
  let userPoolStateId = event.params.account.concat(event.address);
  let userPoolState = UserPoolState.load(userPoolStateId);
  
  let isNewPoolForUser = false;
  if (!userPoolState) {
    userPoolState = createUserPoolState(userPoolStateId, event.params.account, event.address, event.block.timestamp);
    isNewPoolForUser = true;
  }

  // Calculate incremental amounts from cumulative values
  let newCumulativeAmount = event.params.cumulativeAmount;
  let previousCumulativeAmount = userPoolState.lastCumulativeAmount;
  
  // Validate that cumulative amount is increasing
  if (newCumulativeAmount.le(previousCumulativeAmount)) {
    return; // Skip invalid claims where cumulative amount doesn't increase
  }
  
  // Calculate incremental gross amount (what user actually received in this claim)
  let incrementalGrossAmount = newCumulativeAmount.minus(previousCumulativeAmount);
  
  // Calculate incremental fee and net amounts
  let incrementalFeeAmount = incrementalGrossAmount.times(PLATFORM_FEE_BPS).div(BASIS_POINTS);
  let incrementalNetAmount = incrementalGrossAmount.minus(incrementalFeeAmount);
  
  // Additional validation - ensure positive amounts
  if (incrementalGrossAmount.le(BigInt.zero()) || incrementalNetAmount.lt(BigInt.zero())) {
    return; // Skip invalid claims
  }

  // Create claim record with correct incremental amounts
  let claimId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let claim = new Claim(claimId);
  claim.pool = event.address;
  claim.user = event.params.account;
  claim.cumulativeAmount = newCumulativeAmount; // Full cumulative amount from event
  claim.grossAmount = incrementalGrossAmount; // Actual amount claimed this time
  claim.feeAmount = incrementalFeeAmount; // Fee on incremental amount
  claim.netAmount = incrementalNetAmount; // Net incremental amount
  claim.transactionHash = event.transaction.hash;
  claim.blockNumber = event.block.number;
  claim.timestamp = event.block.timestamp;
  claim.gasUsed = BigInt.zero(); // Not available in subgraph context
  claim.gasPrice = BigInt.zero(); // Not available in subgraph context
  claim.save();

  // Update user pool state
  userPoolState.lastCumulativeAmount = newCumulativeAmount;
  userPoolState.totalClaimed = userPoolState.totalClaimed.plus(incrementalNetAmount);
  userPoolState.totalFeesPaid = userPoolState.totalFeesPaid.plus(incrementalFeeAmount);
  userPoolState.claimCount = userPoolState.claimCount.plus(BigInt.fromI32(1));
  userPoolState.lastClaimAt = event.block.timestamp;
  userPoolState.save();

  // Update user global statistics
  if (isNewPoolForUser) {
    user.uniquePools = user.uniquePools.plus(BigInt.fromI32(1));
  }
  user.totalClaimed = user.totalClaimed.plus(incrementalNetAmount);
  user.totalFeesPaid = user.totalFeesPaid.plus(incrementalFeeAmount);
  user.totalClaims = user.totalClaims.plus(BigInt.fromI32(1));
  user.save();

  // Update pool statistics with incremental amounts (with validation)
  if (incrementalGrossAmount.ge(BigInt.zero()) && incrementalFeeAmount.ge(BigInt.zero())) {
    pool.totalClaimed = pool.totalClaimed.plus(incrementalGrossAmount);
    pool.totalFees = pool.totalFees.plus(incrementalFeeAmount);
    pool.totalClaims = pool.totalClaims.plus(BigInt.fromI32(1));
    if (isNewPoolForUser) {
      pool.totalUsers = pool.totalUsers.plus(BigInt.fromI32(1));
    }
    pool.lastActivityAt = event.block.timestamp;
    pool.updatedAt = event.block.timestamp;
    pool.save();
  }

  // Update token statistics (token is already validated above)
  if (token) {
    token.totalVolume = token.totalVolume.plus(incrementalGrossAmount);
    token.totalFees = token.totalFees.plus(incrementalFeeAmount);
    token.updatedAt = event.block.timestamp;
    token.save();
  }

  // Update global and daily stats
  updateFactoryStats(incrementalGrossAmount, incrementalFeeAmount, isNewPoolForUser, event.block.timestamp);
  updateDailyStats(event.block.timestamp, incrementalGrossAmount, BigInt.zero(), BigInt.fromI32(1), false);
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
 * Update global factory statistics with proper validation
 */
function updateFactoryStats(grossAmount: BigInt, feeAmount: BigInt, isNewUser: boolean, timestamp: BigInt): void {
  // Validate input amounts
  if (grossAmount.lt(BigInt.zero()) || feeAmount.lt(BigInt.zero())) {
    return; // Skip invalid amounts
  }

  let stats = FactoryStats.load(FACTORY_STATS_ID);
  if (!stats) {
    stats = new FactoryStats(FACTORY_STATS_ID);
    stats.totalPools = BigInt.zero();
    stats.totalVolume = BigInt.zero();
    stats.totalFees = BigInt.zero();
    stats.totalUsers = BigInt.zero();
    stats.totalClaims = BigInt.zero();
    stats.averagePoolSize = BigInt.zero();
    stats.updatedAt = timestamp;
  }

  // Update statistics with incremental amounts
  stats.totalVolume = stats.totalVolume.plus(grossAmount);
  stats.totalFees = stats.totalFees.plus(feeAmount);
  stats.totalClaims = stats.totalClaims.plus(BigInt.fromI32(1));
  if (isNewUser) {
    stats.totalUsers = stats.totalUsers.plus(BigInt.fromI32(1));
  }

  // Calculate average pool size (total volume / number of pools)
  if (stats.totalPools.gt(BigInt.zero())) {
    stats.averagePoolSize = stats.totalVolume.div(stats.totalPools);
  }

  stats.updatedAt = timestamp;
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

/**
 * Handler for EmergencySweepNoticeInitiated event
 */
export function handleEmergencySweepNoticeInitiated(event: EmergencySweepNoticeInitiated): void {
  // Track emergency sweep notice for monitoring
  // For now, just track the event without creating entities
}