import { 
  PoolCreated,
  TokenAllowedUpdated,
  PublisherRotationInitiated,
  PublisherRotationCancelled
} from "../generated/RewardPoolFactory/RewardPoolFactory";

import { RewardPoolVault } from "../generated/templates";
import { Factory, Pool, Token, User, PublisherRotation, FactoryStats } from "../generated/schema";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

// Constants
const FACTORY_STATS_ID = "factory-stats";

/**
 * Handler for PoolCreated event
 * Creates Pool entity and starts tracking vault events
 */
export function handlePoolCreated(event: PoolCreated): void {
  // Load or create factory
  let factory = Factory.load(event.address);
  if (!factory) {
    factory = new Factory(event.address);
    factory.implementation = Address.zero(); // Will be set by initialization
    factory.treasury = Address.zero();
    factory.timelock = Address.zero(); 
    factory.guardian = Address.zero();
    factory.publisher = Address.zero();
    factory.oldPublisher = Address.zero();
    factory.graceEndTime = BigInt.zero();
    factory.totalPools = BigInt.zero();
    factory.createdAt = event.block.timestamp;
    factory.createdAtBlock = event.block.number;
  }
  
  // Increment total pools
  factory.totalPools = factory.totalPools.plus(BigInt.fromI32(1));
  factory.save();
  
  // Load or create token
  let token = Token.load(event.params.token);
  if (!token) {
    token = new Token(event.params.token);
    token.factory = event.address;
    token.symbol = "UNKNOWN"; // Will be updated by token contract calls
    token.name = "Unknown Token";
    token.decimals = 18; // Default
    token.isAllowed = true;
    token.totalPools = BigInt.zero();
    token.totalVolume = BigInt.zero();
    token.totalFees = BigInt.zero();
    token.createdAt = event.block.timestamp;
    token.updatedAt = event.block.timestamp;
  }
  
  // Increment token usage
  token.totalPools = token.totalPools.plus(BigInt.fromI32(1));
  token.updatedAt = event.block.timestamp;
  token.save();
  
  // Create pool entity
  let pool = new Pool(event.params.pool);
  pool.factory = event.address;
  pool.creator = event.params.creator;
  pool.token = event.params.token;
  pool.salt = event.params.salt;
  
  // Initialize statistics
  pool.totalFunded = BigInt.zero();
  pool.totalClaimed = BigInt.zero();
  pool.totalFees = BigInt.zero();
  pool.totalUsers = BigInt.zero();
  pool.totalClaims = BigInt.zero();
  
  // Initialize state
  pool.isActive = true;
  pool.lastActivityAt = event.block.timestamp;
  
  // Initialize search metadata
  pool.skillsHash = null;
  pool.taskTypeHash = null;
  pool.description = null;
  pool.tags = [];
  
  // Timestamps
  pool.createdAt = event.block.timestamp;
  pool.createdAtBlock = event.block.number;
  pool.updatedAt = event.block.timestamp;
  
  pool.save();
  
  // Start tracking vault events
  RewardPoolVault.create(event.params.pool);
  
  // Update global stats
  updateFactoryStats();
}

/**
 * Handler for TokenAllowedUpdated event
 */
export function handleTokenAllowedUpdated(event: TokenAllowedUpdated): void {
  let token = Token.load(event.params.token);
  if (!token) {
    // Create new token entry
    token = new Token(event.params.token);
    token.factory = event.address;
    token.symbol = "UNKNOWN";
    token.name = "Unknown Token";
    token.decimals = 18;
    token.totalPools = BigInt.zero();
    token.totalVolume = BigInt.zero();
    token.totalFees = BigInt.zero();
    token.createdAt = event.block.timestamp;
  }
  
  token.isAllowed = event.params.allowed;
  token.updatedAt = event.block.timestamp;
  token.save();
}

/**
 * Handler for PublisherRotationInitiated event
 */
export function handlePublisherRotationInitiated(event: PublisherRotationInitiated): void {
  // Update factory publisher info
  let factory = Factory.load(event.address);
  if (factory) {
    factory.oldPublisher = event.params.oldPublisher;
    factory.publisher = event.params.newPublisher;
    factory.graceEndTime = event.params.graceEndTime;
    factory.save();
  }
  
  // Create rotation record
  let rotation = new PublisherRotation(event.transaction.hash);
  rotation.factory = event.address;
  rotation.oldPublisher = event.params.oldPublisher;
  rotation.newPublisher = event.params.newPublisher;
  rotation.graceEndTime = event.params.graceEndTime;
  rotation.status = "ACTIVE";
  rotation.initiatedAt = event.block.timestamp;
  rotation.save();
}

/**
 * Handler for PublisherRotationCancelled event  
 */
export function handlePublisherRotationCancelled(event: PublisherRotationCancelled): void {
  // Update factory - restored publisher is now current
  let factory = Factory.load(event.address);
  if (factory) {
    factory.publisher = event.params.restoredPublisher;
    factory.oldPublisher = Address.zero(); // Clear old publisher
    factory.graceEndTime = BigInt.zero(); // Clear grace period
    factory.save();
  }
  
  // Find and update rotation record
  // Note: We need to find by searching recent rotations
  // This is a simplified approach - in production might need more sophisticated lookup
  let rotation = PublisherRotation.load(event.transaction.hash);
  if (!rotation) {
    // Create a new record for the cancellation
    rotation = new PublisherRotation(event.transaction.hash);
    rotation.factory = event.address;
    rotation.oldPublisher = event.params.cancelledPublisher;
    rotation.newPublisher = event.params.restoredPublisher; 
    rotation.graceEndTime = BigInt.zero();
    rotation.initiatedAt = event.block.timestamp;
  }
  
  rotation.status = "CANCELLED";
  rotation.completedAt = event.block.timestamp;
  rotation.save();
}

/**
 * Update global factory statistics
 */
function updateFactoryStats(): void {
  let stats = FactoryStats.load(FACTORY_STATS_ID);
  if (!stats) {
    stats = new FactoryStats(FACTORY_STATS_ID);
    stats.totalPools = BigInt.zero();
    stats.totalVolume = BigInt.zero();
    stats.totalFees = BigInt.zero();
    stats.totalUsers = BigInt.zero();
    stats.totalClaims = BigInt.zero();
    stats.averagePoolSize = BigInt.zero();
  }
  
  stats.totalPools = stats.totalPools.plus(BigInt.fromI32(1));
  stats.updatedAt = BigInt.fromI32(1); // Will be updated with actual timestamp
  stats.save();
}