import {
  BatchClaimed,
  ClaimSucceeded,
  ClaimFailed,
  FactoryApprovalUpdated
} from "../generated/ClaimRouter/ClaimRouter";

import {
  BatchClaim,
  ClaimSuccess,
  ClaimFailure,
  Factory,
  DailyStatistic
} from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

/**
 * Handler for BatchClaimed event - tracks batch claim operations
 */
export function handleBatchClaimed(event: BatchClaimed): void {
  // Create batch claim record
  let batchClaim = new BatchClaim(event.transaction.hash);
  batchClaim.caller = event.params.caller;
  batchClaim.successful = event.params.successful;
  batchClaim.failed = event.params.failed;
  batchClaim.totalGross = event.params.totalGross;
  batchClaim.totalFees = event.params.totalFees;
  batchClaim.totalNet = event.params.totalNet;

  // Gas analytics - Note: transaction.gasUsed not available in subgraph context
  batchClaim.gasUsed = BigInt.zero(); // Would need to be calculated off-chain
  batchClaim.gasPrice = BigInt.zero(); // Would need to be extracted from receipt
  batchClaim.gasCost = BigInt.zero(); // Would need to be calculated off-chain

  // Timestamps
  batchClaim.timestamp = event.params.timestamp;
  batchClaim.blockNumber = event.block.number;

  batchClaim.save();

  // Update daily stats for batch claims
  updateDailyStats(event.block.timestamp, event.params.totalGross, true, BigInt.zero(), BigInt.zero());
}

/**
 * Handler for ClaimSucceeded event - tracks individual successful claims within a batch
 */
export function handleClaimSucceeded(event: ClaimSucceeded): void {
  // Create success record
  let successId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let success = new ClaimSuccess(successId);
  success.batchClaim = event.transaction.hash;
  success.vault = event.params.vault;
  success.account = event.params.account;
  success.factory = event.params.factory;
  success.gross = event.params.gross;
  success.fee = event.params.fee;
  success.net = event.params.net;

  success.save();
}

/**
 * Handler for ClaimFailed event - tracks failed claims within a batch
 */
export function handleClaimFailed(event: ClaimFailed): void {
  // Create failure record
  let failureId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let failure = new ClaimFailure(failureId);
  failure.batchClaim = event.transaction.hash;
  failure.vault = event.params.vault;
  failure.account = event.params.account;
  failure.reason = event.params.reason;

  failure.save();
}

/**
 * Handler for FactoryApprovalUpdated event
 */
export function handleFactoryApprovalUpdated(event: FactoryApprovalUpdated): void {
  // Load factory and update approval status
  let factory = Factory.load(event.params.factory);
  if (factory) {
    // Factory approval is tracked in ClaimRouter, not Factory entity
    // This could be used for analytics on approved/disapproved factories
  }
}

/**
 * Update daily statistics for batch claim analytics
 */
function updateDailyStats(
  timestamp: BigInt,
  volume: BigInt,
  isBatch: boolean,
  gasUsed: BigInt,
  gasPrice: BigInt
): void {
  // Use the timestamp for the start of the day as the ID
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

  stats.volume = stats.volume.plus(volume);
  if (isBatch) {
    stats.batchClaims = stats.batchClaims.plus(BigInt.fromI32(1));
  }

  // Update gas analytics
  stats.totalGasUsed = stats.totalGasUsed.plus(gasUsed);
  stats.averageGasPrice = gasPrice; // Simplified - should be weighted average
  stats.averageClaimCost = gasUsed.times(gasPrice); // Simplified

  stats.save();
}