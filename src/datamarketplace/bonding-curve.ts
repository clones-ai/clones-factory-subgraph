import { BigInt, Bytes, Address, ethereum } from "@graphprotocol/graph-ts";
import {
  TokensBought,
  TokensSold,
  GraduationTriggered,
} from "../../generated/templates/BondingCurve/BondingCurveImplementation";
import {
  BondingCurve,
  Dataset,
  Trade,
  DatamarketplaceUser,
  DatamarketplaceDailyStats,
} from "../../generated/schema";

export function handleTokensBought(event: TokensBought): void {
  let bondingCurve = BondingCurve.load(event.address);
  if (!bondingCurve) return;
  
  let dataset = Dataset.load(bondingCurve.dataset);
  if (!dataset) return;

  let user = getOrCreateDatamarketplaceUser(event.params.buyer);
  let trade = createTrade(
    event,
    dataset,
    bondingCurve,
    user.id,
    "BUY"
  );

  // Update trade details
  trade.ethAmount = event.params.ethAmount;
  trade.tokenAmount = event.params.tokensReceived;
  trade.creatorFee = event.params.creatorFee;
  trade.protocolFee = event.params.protocolFee;
  trade.priceAfter = event.params.newPrice;
  
  // Calculate market cap after trade (approximation)
  trade.marketCapAfter = bondingCurve.virtualEthReserves;

  // Update bonding curve stats
  bondingCurve.totalBuys = bondingCurve.totalBuys.plus(BigInt.fromI32(1));
  bondingCurve.totalVolumeETH = bondingCurve.totalVolumeETH.plus(event.params.ethAmount);
  bondingCurve.totalVolumeTokens = bondingCurve.totalVolumeTokens.plus(event.params.tokensReceived);
  bondingCurve.totalCreatorFees = bondingCurve.totalCreatorFees.plus(event.params.creatorFee);
  bondingCurve.totalProtocolFees = bondingCurve.totalProtocolFees.plus(event.params.protocolFee);
  bondingCurve.currentPrice = event.params.newPrice;

  // Update dataset stats
  dataset.totalTrades = dataset.totalTrades.plus(BigInt.fromI32(1));
  dataset.totalVolume = dataset.totalVolume.plus(event.params.ethAmount);
  
  // Check if this is a new trader for this dataset
  // For simplicity, we increment unique traders on first trade by user
  if (user.totalTrades.equals(BigInt.fromI32(1))) {
    dataset.uniqueTraders = dataset.uniqueTraders.plus(BigInt.fromI32(1));
  }

  // Update user stats
  user.totalTrades = user.totalTrades.plus(BigInt.fromI32(1));
  user.totalVolumeETH = user.totalVolumeETH.plus(event.params.ethAmount);
  user.totalFeesPaid = user.totalFeesPaid.plus(event.params.creatorFee.plus(event.params.protocolFee));
  if (user.firstActivityAt.equals(BigInt.zero())) {
    user.firstActivityAt = event.block.timestamp;
  }
  user.lastActivityAt = event.block.timestamp;

  // Update daily stats
  updateDatamarketplaceDailyStats(event.block.timestamp, event.params.ethAmount, BigInt.fromI32(1));

  // Save entities
  trade.save();
  bondingCurve.save();
  dataset.save();
  user.save();
}

export function handleTokensSold(event: TokensSold): void {
  let bondingCurve = BondingCurve.load(event.address);
  if (!bondingCurve) return;
  
  let dataset = Dataset.load(bondingCurve.dataset);
  if (!dataset) return;

  let user = getOrCreateDatamarketplaceUser(event.params.seller);
  let trade = createTrade(
    event,
    dataset,
    bondingCurve,
    user.id,
    "SELL"
  );

  // Update trade details
  trade.ethAmount = event.params.ethReceived;
  trade.tokenAmount = event.params.tokensAmount;
  trade.creatorFee = event.params.creatorFee;
  trade.protocolFee = event.params.protocolFee;
  trade.priceAfter = event.params.newPrice;
  
  // Calculate market cap after trade
  trade.marketCapAfter = bondingCurve.virtualEthReserves;

  // Update bonding curve stats
  bondingCurve.totalSells = bondingCurve.totalSells.plus(BigInt.fromI32(1));
  bondingCurve.totalVolumeETH = bondingCurve.totalVolumeETH.plus(event.params.ethReceived);
  bondingCurve.totalVolumeTokens = bondingCurve.totalVolumeTokens.plus(event.params.tokensAmount);
  bondingCurve.totalCreatorFees = bondingCurve.totalCreatorFees.plus(event.params.creatorFee);
  bondingCurve.totalProtocolFees = bondingCurve.totalProtocolFees.plus(event.params.protocolFee);
  bondingCurve.currentPrice = event.params.newPrice;

  // Update dataset stats
  dataset.totalTrades = dataset.totalTrades.plus(BigInt.fromI32(1));
  dataset.totalVolume = dataset.totalVolume.plus(event.params.ethReceived);

  // Update user stats
  user.totalTrades = user.totalTrades.plus(BigInt.fromI32(1));
  user.totalVolumeETH = user.totalVolumeETH.plus(event.params.ethReceived);
  user.totalFeesPaid = user.totalFeesPaid.plus(event.params.creatorFee.plus(event.params.protocolFee));
  user.lastActivityAt = event.block.timestamp;

  // Update daily stats
  updateDatamarketplaceDailyStats(event.block.timestamp, event.params.ethReceived, BigInt.fromI32(1));

  // Save entities
  trade.save();
  bondingCurve.save();
  dataset.save();
  user.save();
}

export function handleGraduationTriggered(event: GraduationTriggered): void {
  let bondingCurve = BondingCurve.load(event.address);
  if (!bondingCurve) return;
  
  let dataset = Dataset.load(bondingCurve.dataset);
  if (!dataset) return;

  // Update bonding curve graduation status
  bondingCurve.isGraduated = true;
  bondingCurve.graduatedAt = event.params.timestamp;
  bondingCurve.currentMarketCap = event.params.finalMarketCap;

  // Update dataset graduation status  
  dataset.isGraduated = true;
  dataset.graduatedAt = event.params.timestamp;

  // Update daily stats for graduation
  let dailyStats = getOrCreateDatamarketplaceDailyStats(event.block.timestamp);
  dailyStats.datasetsGraduated = dailyStats.datasetsGraduated.plus(BigInt.fromI32(1));
  dailyStats.save();

  // Save entities
  bondingCurve.save();
  dataset.save();
}

// Helper functions
function createTrade(
  event: ethereum.Event,
  dataset: Dataset,
  bondingCurve: BondingCurve,
  trader: Bytes,
  tradeType: string
): Trade {
  let tradeId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let trade = new Trade(tradeId);
  
  trade.dataset = dataset.id;
  trade.bondingCurve = bondingCurve.id;
  trade.trader = trader;
  trade.type = tradeType;
  trade.transactionHash = event.transaction.hash;
  trade.blockNumber = event.block.number;
  trade.timestamp = event.block.timestamp;
  trade.gasUsed = BigInt.zero(); // Gas used not available in event context
  trade.gasPrice = event.transaction.gasPrice;
  
  return trade;
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

function updateDatamarketplaceDailyStats(timestamp: BigInt, volume: BigInt, trades: BigInt): void {
  let dailyStats = getOrCreateDatamarketplaceDailyStats(timestamp);
  dailyStats.totalTrades = dailyStats.totalTrades.plus(trades);
  dailyStats.totalVolumeETH = dailyStats.totalVolumeETH.plus(volume);
  
  // Calculate average trade size
  if (dailyStats.totalTrades.gt(BigInt.zero())) {
    dailyStats.averageTradeSize = dailyStats.totalVolumeETH.div(dailyStats.totalTrades);
  }
  
  dailyStats.save();
}