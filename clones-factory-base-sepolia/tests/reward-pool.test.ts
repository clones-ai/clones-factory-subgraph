import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { FactoryFunded } from "../generated/schema"
import { FactoryFunded as FactoryFundedEvent } from "../generated/RewardPool/RewardPool"
import { handleFactoryFunded } from "../src/reward-pool"
import { createFactoryFundedEvent } from "./reward-pool-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let factory = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let token = Address.fromString("0x0000000000000000000000000000000000000001")
    let amount = BigInt.fromI32(234)
    let actualAmountReceived = BigInt.fromI32(234)
    let newFactoryFundedEvent = createFactoryFundedEvent(
      factory,
      token,
      amount,
      actualAmountReceived
    )
    handleFactoryFunded(newFactoryFundedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("FactoryFunded created and stored", () => {
    assert.entityCount("FactoryFunded", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "FactoryFunded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "factory",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "FactoryFunded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "token",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "FactoryFunded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )
    assert.fieldEquals(
      "FactoryFunded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "actualAmountReceived",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
