import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  DatasetGraduated,
  BurnPortalActivated,
} from "../../generated/GraduationManager/GraduationManager";
import {
  GraduationManager,
  Dataset,
  BondingCurve,
  Graduation,
  DatamarketplaceDailyStats,
} from "../../generated/schema";

export function handleDatasetGraduated(event: DatasetGraduated): void {
  let graduationManager = getOrCreateGraduationManager(event.address);
  let dataset = Dataset.load(event.params.datasetToken);
  let bondingCurve = BondingCurve.load(event.params.bondingCurve);
  
  if (!dataset || !bondingCurve) return;

  // Create graduation event
  let graduation = new Graduation(event.params.datasetToken);
  graduation.dataset = dataset.id;
  graduation.bondingCurve = bondingCurve.id;
  graduation.graduationManager = event.address;
  graduation.finalMarketCap = BigInt.zero(); // Will be set by bonding curve event
  graduation.ethReserves = BigInt.zero(); // Will be set by bonding curve event  
  graduation.tokenReserves = BigInt.zero(); // Will be set by bonding curve event
  graduation.lpPair = event.params.lpPair;
  graduation.ethContributed = event.params.ethContributed;
  graduation.tokensContributed = event.params.tokensContributed;
  graduation.lpTokensBurned = event.params.lpTokensBurned;
  graduation.transactionHash = event.transaction.hash;
  graduation.blockNumber = event.block.number;
  graduation.timestamp = event.params.timestamp;

  // Update dataset with graduation info
  dataset.isGraduated = true;
  dataset.graduatedAt = event.params.timestamp;
  dataset.graduation = graduation.id;

  // Update bonding curve with graduation status
  bondingCurve.isGraduated = true;
  bondingCurve.graduatedAt = event.params.timestamp;

  // Update graduation manager stats
  graduationManager.totalGraduations = graduationManager.totalGraduations.plus(BigInt.fromI32(1));
  graduationManager.totalLPCreated = graduationManager.totalLPCreated.plus(event.params.ethContributed);
  graduationManager.updatedAt = event.block.timestamp;

  // Update daily stats
  let dailyStats = getOrCreateDatamarketplaceDailyStats(event.block.timestamp);
  dailyStats.datasetsGraduated = dailyStats.datasetsGraduated.plus(BigInt.fromI32(1));
  dailyStats.totalLPValue = dailyStats.totalLPValue.plus(event.params.ethContributed);

  // Save entities
  graduation.save();
  dataset.save();
  bondingCurve.save();
  graduationManager.save();
  dailyStats.save();
}

export function handleBurnPortalActivated(event: BurnPortalActivated): void {
  let graduationManager = getOrCreateGraduationManager(event.address);
  let dataset = Dataset.load(event.params.datasetToken);
  
  if (!dataset) return;

  // Update dataset burn portal activation
  dataset.isActive = true;
  dataset.activatedAt = event.params.timestamp;

  // Update graduation manager
  graduationManager.updatedAt = event.block.timestamp;

  // Save entities
  dataset.save();
  graduationManager.save();
}

// Helper functions
function getOrCreateGraduationManager(address: Address): GraduationManager {
  let graduationManager = GraduationManager.load(address);
  if (!graduationManager) {
    graduationManager = new GraduationManager(address);
    graduationManager.totalGraduations = BigInt.zero();
    graduationManager.totalLPCreated = BigInt.zero();
    graduationManager.createdAt = BigInt.zero();
    graduationManager.updatedAt = BigInt.zero();
  }
  return graduationManager;
}

function getOrCreateDatamarketplaceDailyStats(timestamp: BigInt): DatamarketplaceDailyStats {
  let dayId = timestamp.toI32() / 86400;
  let dayStartTimestamp = BigInt.fromI32(dayId * 86400);
  let date = new Date(dayStartTimestamp.toI32() * 1000).toISOString().substr(0, 10);
  
  let dailyStats = DatamarketplaceDailyStats.load(date);
  if (!dailyStats) {
    dailyStats = new DatamarketplaceDailyStats(date);
    dailyStats.date = date;
    dailyStats.datasetsCreated = BigInt.zero();
    dailyStats.datasetsGraduated = BigInt.zero();
    dailyStats.totalTrades = BigInt.zero();
    dailyStats.totalVolumeETH = BigInt.zero();
    dailyStats.totalVolumeTokens = BigInt.zero();
    dailyStats.uniqueTraders = BigInt.zero();
    dailyStats.averageTradeSize = BigInt.zero();
    dailyStats.totalBurns = BigInt.zero();
    dailyStats.totalTokensBurned = BigInt.zero();
    dailyStats.uniqueBurners = BigInt.zero();
    dailyStats.totalCreatorFees = BigInt.zero();
    dailyStats.totalProtocolFees = BigInt.zero();
    dailyStats.totalLPValue = BigInt.zero();
  }
  return dailyStats;
}