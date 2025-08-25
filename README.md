# Clones Factory Subgraph

This subgraph indexes the Clones factory system smart contracts for discovery and search functionality. Currently configured for Base Sepolia testnet during development phase. Mainnet deployment addresses will be updated upon production release.

## 📊 Architecture

### Indexed Contracts (Base Sepolia)
- **RewardPoolFactory**: `0x80C79106b527f9237F200f7c03ca12035db66CB1`
- **ClaimRouter**: `0x257AE32ea73a166DD22A1608cD7D8fbb00722385`  
- **RewardPoolVault Templates**: Dynamically created vaults via EIP-1167

> **Note**: Mainnet contract addresses will be added here once production deployment is complete.

### Key Features
- **Real-time Factory Indexing**: Tracks pool creation, token allowlist, publisher rotation
- **Comprehensive Claim Analytics**: Individual and batch claim tracking with gas optimization
- **IPFS Metadata Integration**: Skills and task type hashes for advanced search
- **Advanced Analytics**: Daily stats, user statistics, performance metrics
- **Search Optimization**: Efficient queries by skills, taskType, owner via GraphQL

## 🚀 Deployment

### Local Development
```bash
npm install
npx graph codegen
npx graph build

# Local deployment (requires Graph Node)
npx graph create --node http://localhost:8020/ clones/factory
npx graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 clones/factory
```

### The Graph Studio Deployment
```bash
# Install Graph CLI
npm install -g @graphprotocol/graph-cli

# Generate types and build
npx graph codegen
npx graph build

# Authenticate with deployment key from Subgraph Studio
graph auth <YOUR_DEPLOYMENT_KEY>

# Initialize subgraph (first time only)
graph init <SUBGRAPH_SLUG>

# Deploy to Subgraph Studio
graph deploy <SUBGRAPH_SLUG>
```

**Steps to get deployment key:**
1. Go to [Subgraph Studio](https://thegraph.com/studio/)
2. Connect your wallet (MetaMask, WalletConnect, etc.)
3. Sign in to authenticate
4. Create a new subgraph or select existing one
5. Your unique deployment key will be displayed on the **Subgraph details page**
6. Copy this key - it's a long alphanumeric string

**Security Note:** The deployment key can be regenerated if compromised via the Studio interface.

**Version Management:**
- Use semantic versioning (e.g., "0.0.1", "0.1.0")
- Each deployment creates a new version
- Test thoroughly in Studio before publishing to mainnet
- Check deployment logs for errors in the Studio dashboard

## 📈 Key Query Patterns

### Discovery Queries
```graphql
# Search pools by skills
query PoolsBySkills($skills: [String!]!) {
  pools(where: { tags_contains: $skills }) {
    id
    creator
    token { symbol }
    skillsHash
    taskTypeHash
    totalFunded
    totalClaimed
    isActive
  }
}

# Factory analytics
query FactoryAnalytics {
  factoryStats(id: "factory-stats") {
    totalPools
    totalVolume
    totalUsers
    totalClaims
    averagePoolSize
  }
}

# Daily performance metrics
query DailyMetrics($date: String!) {
  dailyStats(id: $date) {
    poolsCreated
    volume
    uniqueUsers
    totalClaims
    batchClaims
    averageGasPrice
  }
}

# User activity tracking
query UserActivity($userAddress: Bytes!) {
  user(id: $userAddress) {
    totalClaimed
    uniquePools
    totalClaims
    claims(orderBy: timestamp, orderDirection: desc) {
      pool { token { symbol } }
      grossAmount
      timestamp
    }
  }
}
```

### Batch Claims Analytics
```graphql
# Batch claim efficiency
query BatchClaimAnalytics {
  batchClaims(
    orderBy: timestamp
    orderDirection: desc
    first: 100
  ) {
    successful
    failed
    totalGross
    gasCost
    caller
    timestamp
  }
}
```

## 🔍 Schema Highlights

### Core Entities
- **Factory**: Main factory contract with governance info
- **Pool**: Individual reward pools with IPFS metadata
- **Token**: ERC-20 tokens with usage statistics
- **User**: Comprehensive user activity tracking
- **Claim**: Individual claim records with fee breakdown

### Analytics Entities  
- **BatchClaim**: Batch operation tracking for gas efficiency
- **DailyStats**: Time-series analytics for dashboards
- **FactoryStats**: Global system metrics
- **PoolMetadata**: IPFS integration for search functionality

## 🎯 Search Features

### IPFS Integration
- `skillsHash`: IPFS hash linking to skills metadata
- `taskTypeHash`: IPFS hash linking to task type definitions
- `searchString`: Concatenated searchable text for full-text queries

### Analytics Optimization
- Efficient indexing with 2-parameter events for scale
- Pre-calculated statistics for dashboard performance
- Time-series data for trend analysis
- Gas cost tracking for optimization recommendations

## 📊 Performance

### Indexing Performance
- **Start Block**: 16830000 (Base Sepolia deployment block)
- **Event Processing**: Optimized for high-volume claim events
- **Query Efficiency**: 2-indexed parameter events reduce bloom filter pressure

### Analytics Capabilities
- Real-time pool creation and funding tracking
- Cumulative claim pattern with fee precision
- Batch operation success/failure rates
- Publisher rotation tracking for governance

## 🛡️ Security Features

- **Factory Validation**: Anti-phishing via approved factory registry
- **Publisher Authority**: Centralized governance tracking
- **Emergency Monitoring**: Sweep and pause event tracking
- **Audit Trail**: Complete transaction history with block timestamps

## 📁 Project Structure

```
clones-factory-subgraph/
├── src/                          # Core mapping handlers
│   ├── factory.ts               # RewardPoolFactory event handlers
│   ├── claim-router.ts          # ClaimRouter event processing  
│   └── vault.ts                 # Dynamic vault template handlers
├── abis/                        # Contract ABI definitions
│   ├── RewardPoolFactory.json   # Factory contract interface
│   ├── ClaimRouter.json         # Claim router interface
│   └── RewardPoolImplementation.json # Vault template interface
├── schema.graphql               # GraphQL schema definition
├── subgraph.yaml               # Testnet configuration
├── subgraph-mainnet.yaml       # Mainnet configuration (TBD)
├── queries.graphql             # Sample GraphQL queries
├── generated/                   # Auto-generated TypeScript types
├── scripts/                     # Testing and utility scripts
└── clones-factory-base-sepolia/ # Legacy subgraph structure
```

### Key Files
- **`schema.graphql`**: Defines all entities, relationships, and query interfaces
- **`subgraph.yaml`**: Main configuration with contract addresses and start blocks
- **`src/factory.ts`**: Handles pool creation, funding, and governance events
- **`src/claim-router.ts`**: Processes individual and batch claim transactions
- **`src/vault.ts`**: Template for dynamically created vault instances
- **`queries.graphql`**: Production-ready query examples for frontend integration

## 🔧 Development

### Generated Types
The subgraph generates TypeScript types for:
- Contract ABIs and events
- Schema entities and relationships  
- Template contracts for dynamic vault creation

### Testing Strategy
- Unit tests for event handlers
- Integration tests with local Graph Node
- Performance testing with high-volume scenarios
- Cross-chain compatibility validation