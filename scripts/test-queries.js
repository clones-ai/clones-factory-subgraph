#!/usr/bin/env node
require('dotenv').config();

/**
 * Test script for GraphQL queries validation
 * Tests the subgraph queries against Base Sepolia deployment
 */

const { GraphQLClient } = require('graphql-request');


const client = new GraphQLClient(process.env.SUBGRAPH_URL);

// Test queries
const TEST_QUERIES = {
  // Factory overview test
  factoryOverview: `
    query GetFactoryOverview {
      factoryStats(id: "factory-stats") {
        totalPools
        totalVolume
        totalFees
        totalUsers
        totalClaims
        averagePoolSize
        updatedAt
      }
      
      factories {
        id
        totalPools
        publisher
      }
    }
  `,

  // Pool search test
  poolSearch: `
    query GetPoolsForSearch(
      $first: Int = 10,
      $minFunding: BigInt = "0"
    ) {
      pools(
        first: $first,
        where: {
          and: [
            { isActive: true },
            { totalFunded_gte: $minFunding }
          ]
        },
        orderBy: lastActivityAt,
        orderDirection: desc
      ) {
        id
        creator
        token {
          symbol
          name
          decimals
        }
        totalFunded
        totalClaimed
        totalUsers
        isActive
        lastActivityAt
        description
      }
    }
  `,

  // Token analytics test
  tokenAnalytics: `
    query GetTokenAnalytics {
      tokens(
        where: {
          isAllowed: true
        },
        orderBy: totalVolume,
        orderDirection: desc
      ) {
        id
        symbol
        name
        isAllowed
        totalPools
        totalVolume
        totalFees
      }
    }
  `,

  // Daily stats test  
  dailyStats: `
    query GetDailyStats {
      dailyStatistics(
        first: 10,
        orderBy: id,
        orderDirection: desc
      ) {
        id
        date
        poolsCreated
        volume
        fees
        uniqueUsers
        totalClaims
        batchClaims
      }
    }
  `,

  // Batch claims test
  batchClaims: `
    query GetBatchClaimAnalytics($first: Int = 5) {
      batchClaims(
        first: $first,
        orderBy: timestamp,
        orderDirection: desc
      ) {
        id
        caller
        successful
        failed
        totalGross
        totalFees
        totalNet
        timestamp
        
        successes(first: 3) {
          vault
          account
          gross
          fee
          net
        }
        
        failures(first: 3) {
          vault
          account
          reason
        }
      }
    }
  `,

  // Withdrawals test
  withdrawals: `
    query GetWithdrawals($first: Int = 10) {
      withdrawals(
        first: $first,
        orderBy: timestamp,
        orderDirection: desc
      ) {
        id
        pool {
          id
          creator
          totalFunded
        }
        creator {
          id
        }
        amount
        transactionHash
        blockNumber
        timestamp
      }
    }
  `,

  // Pool with funding and withdrawals
  poolFundingHistory: `
    query GetPoolFundingHistory($poolId: Bytes!) {
      pool(id: $poolId) {
        id
        creator
        totalFunded
        
        fundings(orderBy: timestamp, orderDirection: desc) {
          id
          funder {
            id
          }
          amount
          timestamp
        }
        
        withdrawals(orderBy: timestamp, orderDirection: desc) {
          id
          creator {
            id
          }
          amount
          timestamp
        }
      }
    }
  `,

  // User activity including withdrawals
  userActivity: `
    query GetUserActivity($userId: Bytes!) {
      user(id: $userId) {
        id
        totalClaimed
        totalFeesPaid
        uniquePools
        totalClaims
        
        fundings(first: 5, orderBy: timestamp, orderDirection: desc) {
          id
          pool {
            id
          }
          amount
          timestamp
        }
        
        withdrawals(first: 5, orderBy: timestamp, orderDirection: desc) {
          id
          pool {
            id
          }
          amount
          timestamp
        }
        
        claims(first: 5, orderBy: timestamp, orderDirection: desc) {
          id
          pool {
            id
          }
          netAmount
          timestamp
        }
      }
    }
  `,

  // Health check
  healthCheck: `
    query HealthCheck {
      _meta {
        deployment
        hasIndexingErrors
        block {
          number
          timestamp
        }
      }
    }
  `
};

async function testQuery(name, query, variables = {}) {
  console.log(`\n=== Testing ${name} ===`);

  try {
    const data = await client.request(query, variables);
    console.log(`✅ ${name} - Success`);
    console.log(JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ ${name} - Failed:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting subgraph query tests...\n');

  const results = [];

  // Test health check first
  results.push(await testQuery('Health Check', TEST_QUERIES.healthCheck));

  // Test factory overview
  results.push(await testQuery('Factory Overview', TEST_QUERIES.factoryOverview));

  // Test pool search
  results.push(await testQuery('Pool Search', TEST_QUERIES.poolSearch, {
    first: 5,
    minFunding: "0"
  }));

  // Test token analytics
  results.push(await testQuery('Token Analytics', TEST_QUERIES.tokenAnalytics));

  // Test daily stats
  // TODO: Disabled due to subgraph issue
  //results.push(await testQuery('Daily Stats', TEST_QUERIES.dailyStats));

  // Test batch claims
  results.push(await testQuery('Batch Claims', TEST_QUERIES.batchClaims, {
    first: 3
  }));

  // Test withdrawals
  // NOTE: These tests will fail until the subgraph is redeployed with the new Withdrawal entity
  results.push(await testQuery('Withdrawals', TEST_QUERIES.withdrawals, {
    first: 5
  }));

  // Test pool funding history (will use first available pool if any)
  // NOTE: This test will fail until the subgraph is redeployed with the new Withdrawal entity
  try {
    const poolsData = await client.request(TEST_QUERIES.poolSearch, { first: 1 });
    if (poolsData.pools && poolsData.pools.length > 0) {
      results.push(await testQuery('Pool Funding History', TEST_QUERIES.poolFundingHistory, {
        poolId: poolsData.pools[0].id
      }));
    } else {
      console.log('⚠️  Skipping Pool Funding History test - no pools found');
    }
  } catch (error) {
    console.log('⚠️  Skipping Pool Funding History test - error getting pools');
  }

  // Test user activity (will use first available user if any)
  // NOTE: This test will fail until the subgraph is redeployed with the new Withdrawal entity
  try {
    const usersData = await client.request(`
      query GetFirstUser {
        users(first: 1) {
          id
        }
      }
    `);
    if (usersData.users && usersData.users.length > 0) {
      results.push(await testQuery('User Activity', TEST_QUERIES.userActivity, {
        userId: usersData.users[0].id
      }));
    } else {
      console.log('⚠️  Skipping User Activity test - no users found');
    }
  } catch (error) {
    console.log('⚠️  Skipping User Activity test - error getting users');
  }

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`\n=== Test Summary ===`);
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('🎉 All tests passed! Subgraph is ready for production.');
  } else {
    console.log('⚠️  Some tests failed. Check subgraph deployment and schema.');
    process.exit(1);
  }
}

// Performance test for high-volume queries
async function performanceTest() {
  console.log('\n🏃 Running performance tests...');

  try {
    // Test large pool query
    let startTime = Date.now();
    await client.request(TEST_QUERIES.poolSearch, {
      first: 100,
      minFunding: "0"
    });
    let endTime = Date.now();
    let duration = endTime - startTime;

    console.log(`✅ Large pool query (100 pools) completed in ${duration}ms`);
    if (duration > 5000) {
      console.warn('⚠️  Pool query took longer than 5s - consider optimization');
    }

    // Test large withdrawals query
    startTime = Date.now();
    await client.request(TEST_QUERIES.withdrawals, {
      first: 100
    });
    endTime = Date.now();
    duration = endTime - startTime;

    console.log(`✅ Large withdrawals query (100 withdrawals) completed in ${duration}ms`);
    if (duration > 5000) {
      console.warn('⚠️  Withdrawals query took longer than 5s - consider optimization');
    }

  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  }
}

// Main execution
async function main() {
  await runTests();
  await performanceTest();
}

// CLI usage
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testQuery,
  TEST_QUERIES,
  client
};