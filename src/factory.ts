import { 
  PoolCreated,
  TokenAllowedUpdated,
  PublisherRotationInitiated,
  PublisherRotationCancelled,
  RewardPoolFactory
} from "../generated/RewardPoolFactory/RewardPoolFactory";

import { RewardPoolVault } from "../generated/templates";
import { Factory, Pool, Token, User, PublisherRotation, FactoryStats, PoolMetadataUpdate } from "../generated/schema";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

// ERC20 interface for token calls
import { ERC20 } from "../generated/RewardPoolFactory/ERC20";

// Constants
const FACTORY_STATS_ID = "factory-stats";

/**
 * Create factory entity with proper initialization from contract calls
 */
function createFactoryWithInitialization(
  factoryAddress: Address, 
  timestamp: BigInt, 
  blockNumber: BigInt
): Factory {
  let factory = new Factory(factoryAddress);
  
  // Initialize contract instance for calls
  let factoryContract = RewardPoolFactory.bind(factoryAddress);
  
  // Initialize with contract calls (with fallback to zero addresses)
  let implementationResult = factoryContract.try_poolImplementation();
  let treasuryResult = factoryContract.try_platformTreasury();
  let guardianResult = factoryContract.try_getGuardianInfo();
  
  factory.implementation = implementationResult.reverted 
    ? Address.zero() 
    : implementationResult.value;
  factory.treasury = treasuryResult.reverted 
    ? Address.zero() 
    : treasuryResult.value;
  factory.guardian = guardianResult.reverted 
    ? Address.zero() 
    : guardianResult.value;
  
  // Publisher will be set during publisher events or try to read from contract
  factory.publisher = Address.zero(); // Will be updated by publisher rotation events
  factory.timelock = Address.zero(); // No direct getter available, will be zero until updated
  factory.oldPublisher = Address.zero();
  factory.graceEndTime = BigInt.zero();
  factory.totalPools = BigInt.zero();
  
  // Validate initialization
  factory.isInitialized = validateFactoryInitialization(factory);
  
  factory.createdAt = timestamp;
  factory.createdAtBlock = blockNumber;
  factory.save();
  
  return factory;
}

/**
 * Validate that factory has been properly initialized
 */
function validateFactoryInitialization(factory: Factory): boolean {
  // Factory is considered initialized if critical addresses are not zero
  let hasImplementation = !factory.implementation.equals(Address.zero());
  let hasTreasury = !factory.treasury.equals(Address.zero());
  let hasGuardian = !factory.guardian.equals(Address.zero());
  
  // All critical governance addresses should be set
  return hasImplementation && hasTreasury && hasGuardian;
}

/**
 * Validate critical addresses to prevent zero address attacks
 */
function isValidAddress(address: Address): boolean {
  return !address.equals(Address.zero());
}

/**
 * Validate pool creation parameters
 */
function validatePoolCreation(creator: Address, token: Address, pool: Address): boolean {
  return isValidAddress(creator) && isValidAddress(token) && isValidAddress(pool);
}

/**
 * Validate token parameters with comprehensive checks
 */
function validateTokenParameters(tokenAddress: Address, symbol: string, name: string): boolean {
  // Basic validation
  if (!isValidAddress(tokenAddress)) {
    return false;
  }
  
  // Symbol validation
  if (symbol.length == 0 || symbol.length > 20) {
    return false; // Symbol should be 1-20 characters
  }
  
  // Name validation
  if (name.length == 0 || name.length > 100) {
    return false; // Name should be 1-100 characters
  }
  
  // Check for suspicious patterns
  if (symbol.includes("INVALID") || name.includes("Invalid")) {
    return false;
  }
  
  return true;
}

/**
 * Advanced token validation using contract calls
 */
function validateTokenContract(tokenAddress: Address): boolean {
  let tokenContract = ERC20.bind(tokenAddress);
  
  // Try to call standard ERC20 functions
  let symbolResult = tokenContract.try_symbol();
  let nameResult = tokenContract.try_name();
  let decimalsResult = tokenContract.try_decimals();
  
  // Token must implement basic ERC20 interface
  if (symbolResult.reverted || nameResult.reverted || decimalsResult.reverted) {
    return false;
  }
  
  // Additional validation
  if (symbolResult.value.length == 0 || nameResult.value.length == 0) {
    return false;
  }
  
  // Decimals should be reasonable
  if (decimalsResult.value < 0 || decimalsResult.value > 77) {
    return false;
  }
  
  return true;
}

/**
 * Check if token appears to be malicious or spam
 */
function isTokenSuspicious(symbol: string, name: string): boolean {
  // Convert to lowercase for checking
  let lowerSymbol = symbol.toLowerCase();
  let lowerName = name.toLowerCase();
  
  // List of suspicious patterns
  let suspiciousPatterns = [
    "scam", "fake", "test", "spam", "hack", "exploit",
    "phishing", "malicious", "virus", "trojan"
  ];
  
  // Check for suspicious patterns
  for (let i = 0; i < suspiciousPatterns.length; i++) {
    if (lowerSymbol.includes(suspiciousPatterns[i]) || lowerName.includes(suspiciousPatterns[i])) {
      return true;
    }
  }
  
  // Check for excessive special characters or numbers
  if (symbol.length > 0 && (symbol.charCodeAt(0) < 65 || symbol.charCodeAt(0) > 90)) {
    // Symbol should start with uppercase letter
    return true;
  }
  
  return false;
}

/**
 * Validate token for pool creation
 */
function validateTokenForPoolCreation(token: Token): boolean {
  // Token must be explicitly allowed
  if (!token.isAllowed) {
    return false;
  }
  
  // Token should not be marked as invalid or suspicious
  if (token.symbol.includes("INVALID") || 
      token.symbol.includes("SUSPICIOUS") || 
      token.name.includes("Invalid") || 
      token.name.includes("Suspicious")) {
    return false;
  }
  
  // Additional checks for token legitimacy
  if (token.symbol == "UNKNOWN" || token.name == "Unknown Token") {
    // Allow unknown tokens if they're explicitly allowed (might be legitimate but metadata issues)
    return token.isAllowed;
  }
  
  return true;
}

/**
 * Create token entity with proper initialization from contract calls
 */
function createTokenWithInitialization(tokenAddress: Address, timestamp: BigInt): Token {
  let token = new Token(tokenAddress);
  
  // First, validate that this appears to be a valid ERC20 contract
  let isValidContract = validateTokenContract(tokenAddress);
  
  // Try to get token metadata from contract calls with enhanced error handling
  let tokenContract = ERC20.bind(tokenAddress);
  
  // Get symbol with validation
  let symbolResult = tokenContract.try_symbol();
  let symbol = symbolResult.reverted ? "UNKNOWN" : symbolResult.value;
  if (symbol.length == 0) {
    symbol = "UNKNOWN";
  }
  
  // Get name with validation
  let nameResult = tokenContract.try_name();
  let name = nameResult.reverted ? "Unknown Token" : nameResult.value;
  if (name.length == 0) {
    name = "Unknown Token";
  }
  
  // Get decimals with validation (must be reasonable)
  let decimalsResult = tokenContract.try_decimals();
  let decimals = decimalsResult.reverted ? 18 : decimalsResult.value;
  if (decimals < 0 || decimals > 77) { // ERC20 standard allows up to 77 decimals
    decimals = 18; // Default to 18 if unreasonable
  }
  
  // Check for suspicious tokens
  let isSuspicious = isTokenSuspicious(symbol, name);
  
  // Validate token parameters
  if (!validateTokenParameters(tokenAddress, symbol, name) || !isValidContract || isSuspicious) {
    // Mark as invalid/suspicious token
    if (!isValidContract) {
      symbol = "INVALID_CONTRACT";
      name = "Invalid Contract";
    } else if (isSuspicious) {
      symbol = "SUSPICIOUS";
      name = "Suspicious Token";
    } else {
      symbol = "INVALID";
      name = "Invalid Token";
    }
    decimals = 18;
  }
  
  token.symbol = symbol;
  token.name = name;
  token.decimals = decimals;
  // Default to NOT allowed until explicitly set via TokenAllowedUpdated
  token.isAllowed = false;
  
  // Initialize statistics
  token.totalPools = BigInt.zero();
  token.totalVolume = BigInt.zero();
  token.totalFees = BigInt.zero();
  
  token.createdAt = timestamp;
  token.updatedAt = timestamp;
  token.save();
  
  return token;
}

/**
 * Update existing token metadata from contract calls
 */
function updateTokenMetadata(token: Token, timestamp: BigInt): Token {
  // Try to refresh metadata from contract
  let tokenContract = ERC20.bind(Address.fromBytes(token.id));
  
  let symbolResult = tokenContract.try_symbol();
  let nameResult = tokenContract.try_name();
  let decimalsResult = tokenContract.try_decimals();
  
  // Only update if we get better data than what we have
  if (!symbolResult.reverted && symbolResult.value.length > 0 && token.symbol == "UNKNOWN") {
    token.symbol = symbolResult.value;
  }
  
  if (!nameResult.reverted && nameResult.value.length > 0 && token.name == "Unknown Token") {
    token.name = nameResult.value;
  }
  
  if (!decimalsResult.reverted && decimalsResult.value >= 0 && decimalsResult.value <= 77) {
    token.decimals = decimalsResult.value;
  }
  
  token.updatedAt = timestamp;
  token.save();
  
  return token;
}

/**
 * Update token allowlist statistics
 */
function updateTokenAllowlistStats(_isAllowed: boolean, timestamp: BigInt): void {
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
  
  // Note: We could add token allowlist counters to FactoryStats schema if needed
  // For now, just update the timestamp to reflect allowlist changes
  stats.updatedAt = timestamp;
  stats.save();
}

/**
 * Handler for PoolCreated event
 * Creates Pool entity and starts tracking vault events
 */
export function handlePoolCreated(event: PoolCreated): void {
  // Validate pool creation parameters
  if (!validatePoolCreation(event.params.creator, event.params.token, event.params.pool)) {
    return; // Skip invalid pool creation
  }
  
  // Load or create factory
  let factory = Factory.load(event.address);
  if (!factory) {
    factory = createFactoryWithInitialization(event.address, event.block.timestamp, event.block.number);
  }
  
  // Increment total pools
  factory.totalPools = factory.totalPools.plus(BigInt.fromI32(1));
  factory.save();
  
  // Load or create token
  let token = Token.load(event.params.token);
  if (!token) {
    token = createTokenWithInitialization(event.params.token, event.block.timestamp);
  } else {
    // Refresh metadata for existing tokens if needed
    if (token.symbol == "UNKNOWN" || token.name == "Unknown Token") {
      token = updateTokenMetadata(token, event.block.timestamp);
    }
  }
  
  // Validate token for pool creation
  let tokenValidationResult = validateTokenForPoolCreation(token);
  if (!tokenValidationResult) {
    // Pool creation with invalid/suspicious token
    // This could indicate a factory bypass or malicious activity
    return; // Skip creating pool with invalid token
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
  
  // Initialize metadata
  pool.skills = [];
  pool.taskTypes = [];
  pool.description = null;
  pool.tags = [];
  pool.searchString = null;
  
  // Timestamps
  pool.createdAt = event.block.timestamp;
  pool.createdAtBlock = event.block.number;
  pool.updatedAt = event.block.timestamp;
  
  pool.save();
  
  // Start tracking vault events
  RewardPoolVault.create(event.params.pool);
  
  // Update global stats
  updateFactoryStats(event.block.timestamp);
  
}

/**
 * Handler for TokenAllowedUpdated event - manages token allowlist
 */
export function handleTokenAllowedUpdated(event: TokenAllowedUpdated): void {
  // Validate token address
  if (!isValidAddress(event.params.token)) {
    return; // Skip invalid token updates
  }
  
  let token = Token.load(event.params.token);
  if (!token) {
    // Create new token when it's added to allowlist
    token = createTokenWithInitialization(event.params.token, event.block.timestamp);
  } else {
    // Update existing token metadata if it's unknown
    if (token.symbol == "UNKNOWN" || token.name == "Unknown Token") {
      token = updateTokenMetadata(token, event.block.timestamp);
    }
  }
  
  // Update allowlist status
  let wasAllowed = token.isAllowed;
  token.isAllowed = event.params.allowed;
  token.updatedAt = event.block.timestamp;
  
  // Log allowlist changes for analytics
  if (wasAllowed != event.params.allowed) {
    updateTokenAllowlistStats(event.params.allowed, event.block.timestamp);
  }
  
  token.save();
}

/**
 * Handler for PublisherRotationInitiated event
 */
export function handlePublisherRotationInitiated(event: PublisherRotationInitiated): void {
  // Validate publisher addresses
  if (!isValidAddress(event.params.oldPublisher) || !isValidAddress(event.params.newPublisher)) {
    return; // Skip invalid publisher rotations
  }
  
  // Load or create factory
  let factory = Factory.load(event.address);
  if (!factory) {
    factory = createFactoryWithInitialization(event.address, event.block.timestamp, event.block.number);
  }
  
  // Update publisher info
  factory.oldPublisher = event.params.oldPublisher;
  factory.publisher = event.params.newPublisher;
  factory.graceEndTime = event.params.graceEndTime;
  
  // Re-validate initialization now that publisher is set
  factory.isInitialized = validateFactoryInitialization(factory);
  factory.save();
  
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
  // Validate restored publisher address
  if (!isValidAddress(event.params.restoredPublisher)) {
    return; // Skip invalid publisher restoration
  }
  
  // Load or create factory
  let factory = Factory.load(event.address);
  if (!factory) {
    factory = createFactoryWithInitialization(event.address, event.block.timestamp, event.block.number);
  }
  
  // Update factory - restored publisher is now current
  factory.publisher = event.params.restoredPublisher;
  factory.oldPublisher = Address.zero(); // Clear old publisher
  factory.graceEndTime = BigInt.zero(); // Clear grace period
  
  // Re-validate initialization
  factory.isInitialized = validateFactoryInitialization(factory);
  factory.save();
  
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
 * Update global factory statistics for pool creation
 */
function updateFactoryStats(timestamp: BigInt): void {
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
  
  // Increment pool count when new pool is created
  stats.totalPools = stats.totalPools.plus(BigInt.fromI32(1));
  
  // Recalculate average pool size
  if (stats.totalPools.gt(BigInt.zero()) && stats.totalVolume.gt(BigInt.zero())) {
    stats.averagePoolSize = stats.totalVolume.div(stats.totalPools);
  }
  
  stats.updatedAt = timestamp;
  stats.save();
}

/**
 * Update pool metadata from external source or transaction analysis
 */
export function updatePoolMetadata(
  poolAddress: Address,
  skills: string[],
  taskTypes: string[],
  description: string | null,
  tags: string[],
  updaterAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  transactionHash: Bytes
): void {
  let pool = Pool.load(poolAddress);
  if (!pool) {
    return;
  }
  
  pool.skills = skills;
  pool.taskTypes = taskTypes;
  pool.description = description;
  pool.tags = tags;
  
  let searchParts: string[] = [];
  if (description) searchParts.push(description.toLowerCase());
  for (let i = 0; i < skills.length; i++) {
    searchParts.push(skills[i].toLowerCase());
  }
  for (let i = 0; i < taskTypes.length; i++) {
    searchParts.push(taskTypes[i].toLowerCase());
  }
  for (let i = 0; i < tags.length; i++) {
    searchParts.push(tags[i].toLowerCase());
  }
  
  pool.searchString = searchParts.join(' ');
  pool.updatedAt = timestamp;
  
  let updateId = transactionHash.concatI32(0);
  let metadataUpdate = new PoolMetadataUpdate(updateId);
  metadataUpdate.pool = pool.id;
  metadataUpdate.updater = updaterAddress;
  metadataUpdate.skills = skills;
  metadataUpdate.taskTypes = taskTypes;
  metadataUpdate.description = description;
  metadataUpdate.tags = tags;
  metadataUpdate.searchString = pool.searchString ? pool.searchString! : '';
  metadataUpdate.timestamp = timestamp;
  metadataUpdate.blockNumber = blockNumber;
  metadataUpdate.save();
  
  pool.save();
}