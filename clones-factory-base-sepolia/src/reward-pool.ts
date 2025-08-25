import {
  FactoryFunded as FactoryFundedEvent,
  FactoryRefunded as FactoryRefundedEvent,
  FeeSweepFailed as FeeSweepFailedEvent,
  FeeSwept as FeeSweptEvent,
  FeeUpdated as FeeUpdatedEvent,
  Initialized as InitializedEvent,
  Paused as PausedEvent,
  RewardRecorded as RewardRecordedEvent,
  RewardsWithdrawn as RewardsWithdrawnEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  TaskCompleted as TaskCompletedEvent,
  TaskValidated as TaskValidatedEvent,
  TokenCooldownUpdated as TokenCooldownUpdatedEvent,
  TokensRecovered as TokensRecoveredEvent,
  TreasuryUpdated as TreasuryUpdatedEvent,
  Unpaused as UnpausedEvent,
  Upgraded as UpgradedEvent,
  WithdrawalNonceIncremented as WithdrawalNonceIncrementedEvent
} from "../generated/RewardPool/RewardPool"
import {
  FactoryFunded,
  FactoryRefunded,
  FeeSweepFailed,
  FeeSwept,
  FeeUpdated,
  Initialized,
  Paused,
  RewardRecorded,
  RewardsWithdrawn,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  TaskCompleted,
  TaskValidated,
  TokenCooldownUpdated,
  TokensRecovered,
  TreasuryUpdated,
  Unpaused,
  Upgraded,
  WithdrawalNonceIncremented
} from "../generated/schema"

export function handleFactoryFunded(event: FactoryFundedEvent): void {
  let entity = new FactoryFunded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.factory = event.params.factory
  entity.token = event.params.token
  entity.amount = event.params.amount
  entity.actualAmountReceived = event.params.actualAmountReceived

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFactoryRefunded(event: FactoryRefundedEvent): void {
  let entity = new FactoryRefunded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.factory = event.params.factory
  entity.token = event.params.token
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFeeSweepFailed(event: FeeSweepFailedEvent): void {
  let entity = new FeeSweepFailed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.treasury = event.params.treasury
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFeeSwept(event: FeeSweptEvent): void {
  let entity = new FeeSwept(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.treasury = event.params.treasury
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFeeUpdated(event: FeeUpdatedEvent): void {
  let entity = new FeeUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldFeeBps = event.params.oldFeeBps
  entity.newFeeBps = event.params.newFeeBps

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new Paused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRewardRecorded(event: RewardRecordedEvent): void {
  let entity = new RewardRecorded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.factory = event.params.factory
  entity.farmer = event.params.farmer
  entity.token = event.params.token
  entity.amount = event.params.amount
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRewardsWithdrawn(event: RewardsWithdrawnEvent): void {
  let entity = new RewardsWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.farmer = event.params.farmer
  entity.token = event.params.token
  entity.grossAmount = event.params.grossAmount
  entity.feeAmount = event.params.feeAmount
  entity.netAmount = event.params.netAmount
  entity.factoryCount = event.params.factoryCount
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  let entity = new RoleAdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let entity = new RoleGranted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let entity = new RoleRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTaskCompleted(event: TaskCompletedEvent): void {
  let entity = new TaskCompleted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.taskId = event.params.taskId
  entity.farmer = event.params.farmer
  entity.factory = event.params.factory
  entity.token = event.params.token
  entity.amount = event.params.amount
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTaskValidated(event: TaskValidatedEvent): void {
  let entity = new TaskValidated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.taskId = event.params.taskId
  entity.farmer = event.params.farmer
  entity.factory = event.params.factory
  entity.blockNumber = event.params.blockNumber
  entity.blockHash = event.params.blockHash

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokenCooldownUpdated(
  event: TokenCooldownUpdatedEvent
): void {
  let entity = new TokenCooldownUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.oldCooldown = event.params.oldCooldown
  entity.newCooldown = event.params.newCooldown

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokensRecovered(event: TokensRecoveredEvent): void {
  let entity = new TokensRecovered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.to = event.params.to
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTreasuryUpdated(event: TreasuryUpdatedEvent): void {
  let entity = new TreasuryUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldTreasury = event.params.oldTreasury
  entity.newTreasury = event.params.newTreasury

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new Unpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUpgraded(event: UpgradedEvent): void {
  let entity = new Upgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.implementation = event.params.implementation

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWithdrawalNonceIncremented(
  event: WithdrawalNonceIncrementedEvent
): void {
  let entity = new WithdrawalNonceIncremented(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.farmer = event.params.farmer
  entity.oldNonce = event.params.oldNonce
  entity.newNonce = event.params.newNonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
