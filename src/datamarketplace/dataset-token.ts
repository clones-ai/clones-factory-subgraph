import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  Transfer,
  BurnForDownload,
  Graduated,
  BondingCurveSet,
  BurnPortalSet,
} from "../../generated/templates/DatasetToken/DatasetTokenImplementation";
import {
  Dataset,
  BurnForAccess,
  DatamarketplaceUser,
} from "../../generated/schema";

export function handleTransfer(event: Transfer): void {
  // Handle standard ERC20 transfers if needed for additional analytics
  // For now, we focus on the specific datamarketplace events
}

export function handleBurnForDownload(event: BurnForDownload): void {
  let dataset = Dataset.load(event.address);
  if (!dataset) return;

  let user = getOrCreateDatamarketplaceUser(event.params.burner);
  
  // Create burn event
  let burnId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let burn = new BurnForAccess(burnId);
  burn.dataset = dataset.id;
  burn.burner = user.id;
  burn.burnPortal = dataset.burnPortal!; // Assume burn portal is set
  burn.amount = event.params.amount;
  burn.burnThreshold = dataset.burnThreshold;
  burn.transactionHash = event.transaction.hash;
  burn.blockNumber = event.block.number;
  burn.timestamp = event.params.timestamp;

  // Update dataset stats
  dataset.totalBurned = dataset.totalBurned.plus(event.params.amount);
  
  // Check if this is a new user accessing this dataset
  // For simplicity, we increment on every burn - could be optimized with separate tracking
  if (user.totalBurns.equals(BigInt.zero())) {
    dataset.totalAccesses = dataset.totalAccesses.plus(BigInt.fromI32(1));
    user.uniqueDatasetsAccessed = user.uniqueDatasetsAccessed.plus(BigInt.fromI32(1));
  }

  // Update user stats
  user.totalBurns = user.totalBurns.plus(BigInt.fromI32(1));
  user.totalTokensBurned = user.totalTokensBurned.plus(event.params.amount);
  if (user.firstActivityAt.equals(BigInt.zero())) {
    user.firstActivityAt = event.block.timestamp;
  }
  user.lastActivityAt = event.block.timestamp;

  // Save entities
  burn.save();
  dataset.save();
  user.save();
}

export function handleGraduated(event: Graduated): void {
  let dataset = Dataset.load(event.address);
  if (!dataset) return;

  // Update dataset graduation status
  dataset.isGraduated = true;
  dataset.graduatedAt = event.params.timestamp;

  // Save entity
  dataset.save();
}

export function handleBondingCurveSet(event: BondingCurveSet): void {
  let dataset = Dataset.load(event.address);
  if (!dataset) return;

  // Update dataset bonding curve reference
  dataset.bondingCurve = event.params.bondingCurve;

  // Save entity
  dataset.save();
}

export function handleBurnPortalSet(event: BurnPortalSet): void {
  let dataset = Dataset.load(event.address);
  if (!dataset) return;

  // Dataset burn portal is set - this means it's ready for burning after graduation
  // The actual activation will be handled by the BurnPortal contract events

  // Save entity
  dataset.save();
}

// Helper functions
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