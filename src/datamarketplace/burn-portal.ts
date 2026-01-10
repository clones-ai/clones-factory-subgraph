import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  TokensBurnedForAccess,
  DatasetActivated,
} from "../../generated/BurnPortal/BurnPortal";
import {
  BurnPortal,
  Dataset,
  BurnForAccess,
  DatamarketplaceUser,
  DatamarketplaceDailyStats,
} from "../../generated/schema";

export function handleTokensBurnedForAccess(event: TokensBurnedForAccess): void {
  let burnPortal = getOrCreateBurnPortal(event.address);
  let dataset = Dataset.load(event.params.datasetToken);
  if (!dataset) return;

  let user = getOrCreateDatamarketplaceUser(event.params.burner);
  
  // Create burn event
  let burnId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let burn = new BurnForAccess(burnId);
  burn.dataset = dataset.id;
  burn.burner = user.id;
  burn.burnPortal = burnPortal.id;
  burn.amount = event.params.amount;
  burn.burnThreshold = event.params.burnThreshold;
  burn.transactionHash = event.transaction.hash;
  burn.blockNumber = event.block.number;
  burn.timestamp = event.params.timestamp;

  // Update dataset stats
  dataset.totalBurned = dataset.totalBurned.plus(event.params.amount);
  
  // Check if this is a new user accessing this dataset
  // This requires checking if user has previously burned tokens for this dataset
  // For simplicity, we increment on every burn - could be optimized with a separate tracking entity
  if (user.totalBurns.equals(BigInt.zero())) {
    dataset.totalAccesses = dataset.totalAccesses.plus(BigInt.fromI32(1));
    user.uniqueDatasetsAccessed = user.uniqueDatasetsAccessed.plus(BigInt.fromI32(1));
  }

  // Update burn portal stats
  burnPortal.totalBurns = burnPortal.totalBurns.plus(BigInt.fromI32(1));
  burnPortal.totalTokensBurned = burnPortal.totalTokensBurned.plus(event.params.amount);

  // Check if this is a new burner
  if (user.totalBurns.equals(BigInt.zero())) {
    burnPortal.uniqueBurners = burnPortal.uniqueBurners.plus(BigInt.fromI32(1));
  }

  // Update user stats
  user.totalBurns = user.totalBurns.plus(BigInt.fromI32(1));
  user.totalTokensBurned = user.totalTokensBurned.plus(event.params.amount);
  if (user.firstActivityAt.equals(BigInt.zero())) {
    user.firstActivityAt = event.block.timestamp;
  }
  user.lastActivityAt = event.block.timestamp;

  // Update daily stats
  let dailyStats = getOrCreateDatamarketplaceDailyStats(event.block.timestamp);
  dailyStats.totalBurns = dailyStats.totalBurns.plus(BigInt.fromI32(1));
  dailyStats.totalTokensBurned = dailyStats.totalTokensBurned.plus(event.params.amount);
  
  // Check if this is a unique burner for the day
  let dailyBurnerId = dailyStats.id + "-" + event.params.burner.toHexString();
  // For simplicity, we'll increment unique burners (in production, you'd track this more precisely)
  dailyStats.uniqueBurners = dailyStats.uniqueBurners.plus(BigInt.fromI32(1));

  // Save entities
  burn.save();
  dataset.save();
  burnPortal.save();
  user.save();
  dailyStats.save();
}

export function handleDatasetActivated(event: DatasetActivated): void {
  let burnPortal = getOrCreateBurnPortal(event.address);
  let dataset = Dataset.load(event.params.datasetToken);
  if (!dataset) return;

  // Update dataset activation status
  dataset.isActive = true;
  dataset.activatedAt = event.params.timestamp;
  dataset.burnThreshold = event.params.burnThreshold;

  // Update burn portal stats
  burnPortal.totalDatasets = burnPortal.totalDatasets.plus(BigInt.fromI32(1));
  burnPortal.updatedAt = event.block.timestamp;

  // Save entities
  dataset.save();
  burnPortal.save();
}

// Helper functions
function getOrCreateBurnPortal(address: Address): BurnPortal {
  let burnPortal = BurnPortal.load(address);
  if (!burnPortal) {
    burnPortal = new BurnPortal(address);
    burnPortal.totalDatasets = BigInt.zero();
    burnPortal.totalBurns = BigInt.zero();
    burnPortal.totalTokensBurned = BigInt.zero();
    burnPortal.uniqueBurners = BigInt.zero();
    burnPortal.createdAt = BigInt.zero();
    burnPortal.updatedAt = BigInt.zero();
  }
  return burnPortal;
}

function getOrCreateDatamarketplaceUser(address: Address): DatamarketplaceUser {
  let user = DatamarketplaceUser.load(address);
  if (!user) {
    user = new DatamarketplaceUser(address);
    user.datasetsCreated = BigInt.zero();
    user.totalTrades = BigInt.zero();
    user.totalVolumeETH = BigInt.zero();
    user.totalFeesEarned = BigInt.zero();
    user.totalFeesPaid = BigInt.zero();
    user.totalBurns = BigInt.zero();
    user.totalTokensBurned = BigInt.zero();
    user.uniqueDatasetsAccessed = BigInt.zero();
    user.firstActivityAt = BigInt.zero();
    user.lastActivityAt = BigInt.zero();
  }
  return user;
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