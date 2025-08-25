import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
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
} from "../generated/RewardPool/RewardPool"

export function createFactoryFundedEvent(
  factory: Address,
  token: Address,
  amount: BigInt,
  actualAmountReceived: BigInt
): FactoryFunded {
  let factoryFundedEvent = changetype<FactoryFunded>(newMockEvent())

  factoryFundedEvent.parameters = new Array()

  factoryFundedEvent.parameters.push(
    new ethereum.EventParam("factory", ethereum.Value.fromAddress(factory))
  )
  factoryFundedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  factoryFundedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  factoryFundedEvent.parameters.push(
    new ethereum.EventParam(
      "actualAmountReceived",
      ethereum.Value.fromUnsignedBigInt(actualAmountReceived)
    )
  )

  return factoryFundedEvent
}

export function createFactoryRefundedEvent(
  factory: Address,
  token: Address,
  amount: BigInt
): FactoryRefunded {
  let factoryRefundedEvent = changetype<FactoryRefunded>(newMockEvent())

  factoryRefundedEvent.parameters = new Array()

  factoryRefundedEvent.parameters.push(
    new ethereum.EventParam("factory", ethereum.Value.fromAddress(factory))
  )
  factoryRefundedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  factoryRefundedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return factoryRefundedEvent
}

export function createFeeSweepFailedEvent(
  token: Address,
  treasury: Address,
  amount: BigInt
): FeeSweepFailed {
  let feeSweepFailedEvent = changetype<FeeSweepFailed>(newMockEvent())

  feeSweepFailedEvent.parameters = new Array()

  feeSweepFailedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  feeSweepFailedEvent.parameters.push(
    new ethereum.EventParam("treasury", ethereum.Value.fromAddress(treasury))
  )
  feeSweepFailedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return feeSweepFailedEvent
}

export function createFeeSweptEvent(
  token: Address,
  treasury: Address,
  amount: BigInt
): FeeSwept {
  let feeSweptEvent = changetype<FeeSwept>(newMockEvent())

  feeSweptEvent.parameters = new Array()

  feeSweptEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  feeSweptEvent.parameters.push(
    new ethereum.EventParam("treasury", ethereum.Value.fromAddress(treasury))
  )
  feeSweptEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return feeSweptEvent
}

export function createFeeUpdatedEvent(
  oldFeeBps: i32,
  newFeeBps: i32
): FeeUpdated {
  let feeUpdatedEvent = changetype<FeeUpdated>(newMockEvent())

  feeUpdatedEvent.parameters = new Array()

  feeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldFeeBps",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(oldFeeBps))
    )
  )
  feeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newFeeBps",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newFeeBps))
    )
  )

  return feeUpdatedEvent
}

export function createInitializedEvent(version: BigInt): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )

  return initializedEvent
}

export function createPausedEvent(account: Address): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return pausedEvent
}

export function createRewardRecordedEvent(
  factory: Address,
  farmer: Address,
  token: Address,
  amount: BigInt,
  timestamp: BigInt
): RewardRecorded {
  let rewardRecordedEvent = changetype<RewardRecorded>(newMockEvent())

  rewardRecordedEvent.parameters = new Array()

  rewardRecordedEvent.parameters.push(
    new ethereum.EventParam("factory", ethereum.Value.fromAddress(factory))
  )
  rewardRecordedEvent.parameters.push(
    new ethereum.EventParam("farmer", ethereum.Value.fromAddress(farmer))
  )
  rewardRecordedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  rewardRecordedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  rewardRecordedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return rewardRecordedEvent
}

export function createRewardsWithdrawnEvent(
  farmer: Address,
  token: Address,
  grossAmount: BigInt,
  feeAmount: BigInt,
  netAmount: BigInt,
  factoryCount: BigInt,
  timestamp: BigInt
): RewardsWithdrawn {
  let rewardsWithdrawnEvent = changetype<RewardsWithdrawn>(newMockEvent())

  rewardsWithdrawnEvent.parameters = new Array()

  rewardsWithdrawnEvent.parameters.push(
    new ethereum.EventParam("farmer", ethereum.Value.fromAddress(farmer))
  )
  rewardsWithdrawnEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  rewardsWithdrawnEvent.parameters.push(
    new ethereum.EventParam(
      "grossAmount",
      ethereum.Value.fromUnsignedBigInt(grossAmount)
    )
  )
  rewardsWithdrawnEvent.parameters.push(
    new ethereum.EventParam(
      "feeAmount",
      ethereum.Value.fromUnsignedBigInt(feeAmount)
    )
  )
  rewardsWithdrawnEvent.parameters.push(
    new ethereum.EventParam(
      "netAmount",
      ethereum.Value.fromUnsignedBigInt(netAmount)
    )
  )
  rewardsWithdrawnEvent.parameters.push(
    new ethereum.EventParam(
      "factoryCount",
      ethereum.Value.fromUnsignedBigInt(factoryCount)
    )
  )
  rewardsWithdrawnEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return rewardsWithdrawnEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}

export function createTaskCompletedEvent(
  taskId: Bytes,
  farmer: Address,
  factory: Address,
  token: Address,
  amount: BigInt,
  timestamp: BigInt
): TaskCompleted {
  let taskCompletedEvent = changetype<TaskCompleted>(newMockEvent())

  taskCompletedEvent.parameters = new Array()

  taskCompletedEvent.parameters.push(
    new ethereum.EventParam("taskId", ethereum.Value.fromFixedBytes(taskId))
  )
  taskCompletedEvent.parameters.push(
    new ethereum.EventParam("farmer", ethereum.Value.fromAddress(farmer))
  )
  taskCompletedEvent.parameters.push(
    new ethereum.EventParam("factory", ethereum.Value.fromAddress(factory))
  )
  taskCompletedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  taskCompletedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  taskCompletedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return taskCompletedEvent
}

export function createTaskValidatedEvent(
  taskId: Bytes,
  farmer: Address,
  factory: Address,
  blockNumber: BigInt,
  blockHash: Bytes
): TaskValidated {
  let taskValidatedEvent = changetype<TaskValidated>(newMockEvent())

  taskValidatedEvent.parameters = new Array()

  taskValidatedEvent.parameters.push(
    new ethereum.EventParam("taskId", ethereum.Value.fromFixedBytes(taskId))
  )
  taskValidatedEvent.parameters.push(
    new ethereum.EventParam("farmer", ethereum.Value.fromAddress(farmer))
  )
  taskValidatedEvent.parameters.push(
    new ethereum.EventParam("factory", ethereum.Value.fromAddress(factory))
  )
  taskValidatedEvent.parameters.push(
    new ethereum.EventParam(
      "blockNumber",
      ethereum.Value.fromUnsignedBigInt(blockNumber)
    )
  )
  taskValidatedEvent.parameters.push(
    new ethereum.EventParam(
      "blockHash",
      ethereum.Value.fromFixedBytes(blockHash)
    )
  )

  return taskValidatedEvent
}

export function createTokenCooldownUpdatedEvent(
  token: Address,
  oldCooldown: BigInt,
  newCooldown: BigInt
): TokenCooldownUpdated {
  let tokenCooldownUpdatedEvent =
    changetype<TokenCooldownUpdated>(newMockEvent())

  tokenCooldownUpdatedEvent.parameters = new Array()

  tokenCooldownUpdatedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  tokenCooldownUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldCooldown",
      ethereum.Value.fromUnsignedBigInt(oldCooldown)
    )
  )
  tokenCooldownUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newCooldown",
      ethereum.Value.fromUnsignedBigInt(newCooldown)
    )
  )

  return tokenCooldownUpdatedEvent
}

export function createTokensRecoveredEvent(
  token: Address,
  to: Address,
  amount: BigInt
): TokensRecovered {
  let tokensRecoveredEvent = changetype<TokensRecovered>(newMockEvent())

  tokensRecoveredEvent.parameters = new Array()

  tokensRecoveredEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  tokensRecoveredEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  tokensRecoveredEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return tokensRecoveredEvent
}

export function createTreasuryUpdatedEvent(
  oldTreasury: Address,
  newTreasury: Address
): TreasuryUpdated {
  let treasuryUpdatedEvent = changetype<TreasuryUpdated>(newMockEvent())

  treasuryUpdatedEvent.parameters = new Array()

  treasuryUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldTreasury",
      ethereum.Value.fromAddress(oldTreasury)
    )
  )
  treasuryUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newTreasury",
      ethereum.Value.fromAddress(newTreasury)
    )
  )

  return treasuryUpdatedEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}

export function createUpgradedEvent(implementation: Address): Upgraded {
  let upgradedEvent = changetype<Upgraded>(newMockEvent())

  upgradedEvent.parameters = new Array()

  upgradedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )

  return upgradedEvent
}

export function createWithdrawalNonceIncrementedEvent(
  farmer: Address,
  oldNonce: BigInt,
  newNonce: BigInt
): WithdrawalNonceIncremented {
  let withdrawalNonceIncrementedEvent =
    changetype<WithdrawalNonceIncremented>(newMockEvent())

  withdrawalNonceIncrementedEvent.parameters = new Array()

  withdrawalNonceIncrementedEvent.parameters.push(
    new ethereum.EventParam("farmer", ethereum.Value.fromAddress(farmer))
  )
  withdrawalNonceIncrementedEvent.parameters.push(
    new ethereum.EventParam(
      "oldNonce",
      ethereum.Value.fromUnsignedBigInt(oldNonce)
    )
  )
  withdrawalNonceIncrementedEvent.parameters.push(
    new ethereum.EventParam(
      "newNonce",
      ethereum.Value.fromUnsignedBigInt(newNonce)
    )
  )

  return withdrawalNonceIncrementedEvent
}
