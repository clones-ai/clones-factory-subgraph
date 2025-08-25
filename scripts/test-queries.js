#!/usr/bin/env node

/**
 * Test script for GraphQL queries validation
 * Tests the subgraph queries against Base Sepolia deployment
 */

const { GraphQLClient } = require('graphql-request');

// Base Sepolia subgraph endpoint (update when deployed)
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/clones-factory-sepolia/version/latest';

const client = new GraphQLClient(SUBGRAPH_URL);

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
        allowedTokens {
          symbol
          name
          isAllowed
          totalPools
          totalVolume
        }
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
        tags
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
        
        pools(
          first: 3,
          orderBy: totalFunded,
          orderDirection: desc
        ) {
          id
          creator
          totalFunded
          totalClaimed
          totalUsers
        }
      }
    }
  `,

  // Daily stats test  
  dailyStats: `
    query GetDailyStats {
      dailyStats(
        first: 7,
        orderBy: date,
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
  results.push(await testQuery('Daily Stats', TEST_QUERIES.dailyStats));
  
  // Test batch claims
  results.push(await testQuery('Batch Claims', TEST_QUERIES.batchClaims, { 
    first: 3 
  }));
  
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
  
  const startTime = Date.now();
  
  try {
    // Test large pool query
    await client.request(TEST_QUERIES.poolSearch, { 
      first: 100, 
      minFunding: "0" 
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Large query (100 pools) completed in ${duration}ms`);
    
    if (duration > 5000) {
      console.warn('⚠️  Query took longer than 5s - consider optimization');
    }
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  }
}

// Main execution
async function main() {
  if (SUBGRAPH_URL.includes('YOUR_SUBGRAPH_ID')) {
    console.error('❌ Please update SUBGRAPH_URL with actual endpoint');
    process.exit(1);
  }
  
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