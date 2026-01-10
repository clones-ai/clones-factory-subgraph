import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import {
  DatasetCreated,
  BurnPortalUpdated,
  GraduationManagerUpdated,
  FallbackLaunchFeeUpdated,
  LaunchFeeUpdated,
  OracleUsageUpdated,
} from "../../generated/DatasetFactory/DatasetFactory";
import {
  DatasetFactory,
  Dataset,
  BondingCurve,
  DatamarketplaceUser,
} from "../../generated/schema";
import { BondingCurve as BondingCurveTemplate, DatasetToken as DatasetTokenTemplate } from "../../generated/templates";

export function handleDatasetCreated(event: DatasetCreated): void {
  let factory = getOrCreateDatasetFactory(event.address);
  let dataset = getOrCreateDataset(
    event.params.datasetToken,
    event.params.creator,
    factory,
    event.params.bondingCurve
  );
  let bondingCurve = getOrCreateBondingCurve(
    event.params.bondingCurve,
    dataset,
    factory
  );
  let user = getOrCreateDatamarketplaceUser(event.params.creator);

  // Update dataset details
  dataset.name = event.params.name;
  dataset.symbol = event.params.symbol;
  dataset.burnThresholdPercentage = event.params.burnThresholdPercentage;
  dataset.salt = event.params.salt;
  dataset.nonce = event.params.nonce;
  dataset.createdAt = event.params.timestamp;
  dataset.createdAtBlock = event.block.number;
  
  // Initialize dataset state
  dataset.totalSupply = BigInt.fromI32(1000000000).times(BigInt.fromI32(10).pow(6)); // 1B tokens with 6 decimals
  dataset.decimals = 6;
  dataset.burnThreshold = dataset.totalSupply
    .times(BigInt.fromI32(dataset.burnThresholdPercentage))
    .div(BigInt.fromI32(100));
  dataset.isGraduated = false;
  dataset.isActive = false;
  dataset.totalVolume = BigInt.zero();
  dataset.totalBurned = BigInt.zero();
  dataset.totalAccesses = BigInt.zero();
  dataset.uniqueTraders = BigInt.zero();
  dataset.totalTrades = BigInt.zero();

  // Update factory stats
  factory.totalDatasets = factory.totalDatasets.plus(BigInt.fromI32(1));
  factory.updatedAt = event.block.timestamp;

  // Update user stats
  user.datasetsCreated = user.datasetsCreated.plus(BigInt.fromI32(1));
  if (user.firstActivityAt.equals(BigInt.zero())) {
    user.firstActivityAt = event.block.timestamp;
  }
  user.lastActivityAt = event.block.timestamp;

  // Create templates for dynamic contract tracking
  BondingCurveTemplate.create(event.params.bondingCurve);
  DatasetTokenTemplate.create(event.params.datasetToken);

  // Save entities
  factory.save();
  dataset.save();
  bondingCurve.save();
  user.save();
}

export function handleBurnPortalUpdated(event: BurnPortalUpdated): void {
  let factory = getOrCreateDatasetFactory(event.address);
  factory.burnPortal = event.params.newPortal;
  factory.updatedAt = event.block.timestamp;
  factory.save();
}

export function handleGraduationManagerUpdated(event: GraduationManagerUpdated): void {
  let factory = getOrCreateDatasetFactory(event.address);
  factory.graduationManager = event.params.newManager;
  factory.updatedAt = event.block.timestamp;
  factory.save();
}

export function handleFallbackLaunchFeeUpdated(event: FallbackLaunchFeeUpdated): void {
  let factory = getOrCreateDatasetFactory(event.address);
  factory.fallbackLaunchFee = event.params.newFee;
  factory.updatedAt = event.block.timestamp;
  factory.save();
}

export function handleLaunchFeeUpdated(event: LaunchFeeUpdated): void {
  let factory = getOrCreateDatasetFactory(event.address);
  factory.fallbackLaunchFee = event.params.newFee;
  factory.updatedAt = event.block.timestamp;
  factory.save();
}

export function handleOracleUsageUpdated(event: OracleUsageUpdated): void {
  let factory = getOrCreateDatasetFactory(event.address);
  factory.useOracle = event.params.useOracle;
  factory.updatedAt = event.block.timestamp;
  factory.save();
}

// Helper functions
function getOrCreateDatasetFactory(address: Address): DatasetFactory {
  let factory = DatasetFactory.load(address);
  if (!factory) {
    factory = new DatasetFactory(address);
    factory.totalDatasets = BigInt.zero();
    factory.totalVolume = BigInt.zero();
    factory.totalFees = BigInt.zero();
    factory.fallbackLaunchFee = BigInt.zero();
    factory.useOracle = true;
    factory.createdAt = BigInt.zero();
    factory.createdAtBlock = BigInt.zero();
    factory.updatedAt = BigInt.zero();
  }
  return factory;
}

function getOrCreateDataset(
  address: Address,
  creator: Address,
  factory: DatasetFactory,
  bondingCurveAddress: Address
): Dataset {
  let dataset = Dataset.load(address);
  if (!dataset) {
    dataset = new Dataset(address);
    dataset.factory = factory.id;
    dataset.creator = creator;
    dataset.bondingCurve = bondingCurveAddress;
    dataset.name = "";
    dataset.symbol = "";
    dataset.totalSupply = BigInt.zero();
    dataset.decimals = 6;
    dataset.burnThresholdPercentage = 0;
    dataset.burnThreshold = BigInt.zero();
    dataset.isGraduated = false;
    dataset.isActive = false;
    dataset.totalVolume = BigInt.zero();
    dataset.totalBurned = BigInt.zero();
    dataset.totalAccesses = BigInt.zero();
    dataset.uniqueTraders = BigInt.zero();
    dataset.totalTrades = BigInt.zero();
    dataset.salt = Bytes.empty();
    dataset.nonce = BigInt.zero();
    dataset.createdAt = BigInt.zero();
    dataset.createdAtBlock = BigInt.zero();
  }
  return dataset;
}

function getOrCreateBondingCurve(
  address: Address,
  dataset: Dataset,
  factory: DatasetFactory
): BondingCurve {
  let bondingCurve = BondingCurve.load(address);
  if (!bondingCurve) {
    bondingCurve = new BondingCurve(address);
    bondingCurve.dataset = dataset.id;
    bondingCurve.factory = factory.id;
    bondingCurve.ethUsdPriceFeed = Bytes.empty();
    bondingCurve.virtualEthReserves = BigInt.zero();
    bondingCurve.virtualTokenReserves = BigInt.zero();
    bondingCurve.currentPrice = BigInt.zero();
    bondingCurve.currentMarketCap = BigInt.zero();
    bondingCurve.graduationThreshold = BigInt.zero();
    bondingCurve.totalBuys = BigInt.zero();
    bondingCurve.totalSells = BigInt.zero();
    bondingCurve.totalVolumeETH = BigInt.zero();
    bondingCurve.totalVolumeTokens = BigInt.zero();
    bondingCurve.totalCreatorFees = BigInt.zero();
    bondingCurve.totalProtocolFees = BigInt.zero();
    bondingCurve.isGraduated = false;
    bondingCurve.createdAt = BigInt.zero();
  }
  return bondingCurve;
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