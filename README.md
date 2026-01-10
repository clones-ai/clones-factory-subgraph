# Clones Factory Subgraph

This subgraph indexes the Clones factory system smart contracts for discovery and search functionality. The project now includes two main subgraphs:

1. **Factory Subgraph**: Original reward pool factory system
2. **Datamarketplace Subgraph**: New AI training data marketplace with bonding curves

Currently configured for Base Sepolia testnet during development phase. Mainnet deployment addresses will be updated upon production release.

## Architecture

### Factory Subgraph - Indexed Contracts
- **RewardPoolFactory**
- **ClaimRouter**
- **RewardPoolVault Templates**: Dynamically created vaults via EIP-1167

### Datamarketplace Subgraph - Indexed Contracts
- **DatasetFactory**: EIP-1167 factory for creating dataset tokens with bonding curves
- **BondingCurveImplementation**: Constant product bonding curve with graduation to Uniswap
- **DatasetTokenImplementation**: ERC20 dataset tokens with burn-to-download mechanics
- **BurnPortal**: Manages token burning for dataset access after graduation
- **GraduationManager**: Handles graduation from bonding curve to Uniswap V2

> **Note**: Mainnet contract addresses will be added here once production deployment is complete.

### Factory Subgraph - Key Features
- **Real-time Factory Indexing**: Tracks pool creation, token allowlist, publisher rotation
- **Comprehensive Claim Analytics**: Individual and batch claim tracking with gas optimization
- **Direct Metadata System**: Full skills/task type storage and search functionality
- **Multi-dimensional Search**: Skills, description, and full-text search
- **Advanced Analytics**: Daily stats, user statistics, performance metrics
- **Search Optimization**: Efficient queries by skills, taskType, owner via GraphQL

### Datamarketplace Subgraph - Key Features
- **Dataset Lifecycle Tracking**: Complete tracking from creation to graduation
- **Bonding Curve Analytics**: Real-time trading data, price tracking, and volume analysis
- **Burn-to-Download Events**: Track token burning for dataset access
- **Graduation Monitoring**: Automated graduation from bonding curves to Uniswap V2
- **Creator Analytics**: Revenue tracking for dataset creators
- **User Activity**: Comprehensive user trading and access patterns
- **Daily Metrics**: Time-series data for dashboard analytics

### Metadata Features
- **Direct Storage**: Skills and task types stored directly in entities
- **Search Optimization**: Pre-computed search strings for fast queries
- **Task Type Categorization**: Extracts task types and categories
- **Full-text Search String**: Concatenated searchable content
- **Metadata Update Tracking**: Complete audit trail of metadata changes
- **Sample Data Generation**: Demonstrates functionality with realistic test data

## Deployment

### Local Development

#### Factory Subgraph
```bash
npm install

# Generate types from ABIs
npm run graph:codegen           # Uses testnet config by default
npm run graph:codegen:testnet   # Explicitly testnet
npm run graph:codegen:mainnet   # Explicitly mainnet

# Build subgraph
npm run build                   # Uses testnet config by default
npm run build:testnet           # Explicitly testnet  
npm run build:mainnet           # Explicitly mainnet

# Local deployment (requires Graph Node)
npx graph create --node http://localhost:8020/ clones/factory
npx graph deploy --node http://localhost:8020/ clones/factory --config-file subgraph-testnet.yaml
```

#### Datamarketplace Subgraph
```bash
# Generate types from ABIs
npm run graph:codegen:datamarketplace:testnet   # Datamarketplace testnet
npm run graph:codegen:datamarketplace:mainnet   # Datamarketplace mainnet

# Build subgraph
npm run build:datamarketplace:testnet           # Datamarketplace testnet
npm run build:datamarketplace:mainnet           # Datamarketplace mainnet

# Local deployment (requires Graph Node)
npx graph create --node http://localhost:8020/ clones/datamarketplace
npx graph deploy --node http://localhost:8020/ clones/datamarketplace --config-file subgraph-datamarketplace-testnet.yaml
```

### The Graph Studio Deployment

#### Factory Subgraph - Testnet (Base Sepolia)
```bash
# Build and deploy testnet version
npm run build:testnet
npm run deploy:testnet

# Or manually with specific config
graph build --config-file subgraph-testnet.yaml
graph deploy clones-factory-base-sepolia --config-file subgraph-testnet.yaml
```

#### Factory Subgraph - Mainnet (Base)
```bash
# Build and deploy mainnet version
npm run build:mainnet
npm run deploy:mainnet

# Or manually with specific config
graph build --config-file subgraph-mainnet.yaml
graph deploy clones-factory-base --config-file subgraph-mainnet.yaml
```

#### Datamarketplace Subgraph - Testnet (Base Sepolia)
```bash
# Build and deploy datamarketplace testnet version
npm run build:datamarketplace:testnet
npm run deploy:datamarketplace:testnet

# Or manually with specific config
graph build --config-file subgraph-datamarketplace-testnet.yaml
graph deploy clones-datamarketplace-base-sepolia --config-file subgraph-datamarketplace-testnet.yaml
```

#### Datamarketplace Subgraph - Mainnet (Base)
```bash
# Build and deploy datamarketplace mainnet version
npm run build:datamarketplace:mainnet
npm run deploy:datamarketplace:mainnet

# Or manually with specific config
graph build --config-file subgraph-datamarketplace-mainnet.yaml
graph deploy clones-datamarketplace-base --config-file subgraph-datamarketplace-mainnet.yaml
```

#### First-time Setup
```bash
# Install Graph CLI
npm install -g @graphprotocol/graph-cli

# Authenticate with deployment key from Subgraph Studio
graph auth <YOUR_DEPLOYMENT_KEY>

# Initialize subgraphs (first time only)
graph init clones-factory-base-sepolia    # For testnet
graph init clones-factory-base             # For mainnet
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

## Subgraph Updates (After Contract Modification)

When smart contracts are modified and redeployed, the subgraph must be updated to reflect these changes. Here is the process to follow:

1.  **Update ABIs**:
    -   Copy the new ABI (`.json`) files generated from your contract compilation.
    -   Replace the old files in the `abis/` directory.

2.  **Modify Configuration Files**:
    -   **For Testnet**: Update `subgraph-testnet.yaml`
    -   **For Mainnet**: Update `subgraph-mainnet.yaml` 
    -   **Contract Addresses**: Update the addresses in the `dataSources` section.
    -   **Start Block**: Change the `startBlock` value to match the deployment block of the new contracts. This avoids indexing unnecessary events from the old contracts.
    -   **Event Signatures**: If an event's structure has changed (parameters added/removed), update its signature in the `eventHandlers` section.

3.  **Regenerate Types and Update Mappings**:
    -   **For Testnet**: `npm run graph:codegen:testnet`
    -   **For Mainnet**: `npm run graph:codegen:mainnet`
    -   Modify the mapping functions (handlers in `src/`) to match the new event signatures. For example, if an event has a new parameter, its handling function must be adapted to receive it.

4.  **Build and Deploy**:
    -   **For Testnet**: `npm run build:testnet && npm run deploy:testnet`
    -   **For Mainnet**: `npm run build:mainnet && npm run deploy:mainnet`
    -   During deployment, the CLI will prompt you to assign a new version number (e.g., `v0.0.2`).

## Local Development & Validation

### Development Workflow

The recommended development workflow for GraphQL queries:

1. **Generate Types from ABIs**: `npm run graph:codegen` - Generates AssemblyScript types from contract ABIs
2. **Query Validation**: `npm run codegen` - Validates queries against deployed schema
3. **Live Testing**: `npm run test-queries` - Tests queries with real data
4. **Deploy**: Update subgraph when schema changes

### Query Validation

Validate your GraphQL queries against the deployed subgraph schema:

```bash
# Validate against active environment (set in .env)
npm run codegen

# Validate against specific environment
npm run codegen:testnet   # Validates against testnet deployment
npm run codegen:mainnet   # Validates against mainnet deployment
```

These commands will:
- Fetch the schema from your deployed subgraph
- Validate all queries in `queries.graphql` against the real schema
- Generate TypeScript types in `src/generated/graphql.ts`
- Fail immediately with precise error messages for invalid queries

**Important**: This validates against the **deployed** schema, not the local `schema.graphql`. Deploy your subgraph first if you've made schema changes.

### Testing Queries

Test GraphQL queries against the deployed subgraph with real data:

```bash
# Test against active environment (set in .env)
npm run test-queries

# Test against specific environment
npm run test-queries:testnet   # Tests against testnet deployment
npm run test-queries:mainnet   # Tests against mainnet deployment
```

These scripts run predefined queries and report failures or performance issues.

### Schema Type Mapping

Note that The Graph transforms your local schema types:
- `Bytes!` → `ID!` for entity lookups (e.g., `pool(id: ID!)`)
- `Bytes!` → `String!` for complex filters (e.g., `factory: String!`)
- Always validate with `npm run codegen` to catch these transformations

## Key Query Patterns

### Factory Subgraph - Metadata Queries
```graphql
# Advanced search by skills and task types
query SearchBySkills {
  pools(
    where: {
      and: [
        { isActive: true }
        { extractedSkills_contains_nocase: ["javascript", "react"] }
      ]
    }
  ) {
    id
    creator
    extractedSkills
    description
    searchString
    totalFunded
  }
}

# Full-text search across all metadata
query FullTextSearch($searchText: String!) {
  pools(
    where: {
      and: [
        { isActive: true }
        { searchString_contains_nocase: $searchText }
      ]
    }
  ) {
    id
    extractedSkills
    description
  }
}
```

### Discovery Queries
```graphql
# Search pools by skills (legacy - use extractedSkills instead)
query PoolsBySkills($skills: [String!]!) {
  pools(where: { extractedSkills_contains_nocase: $skills }) {
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

### Factory Subgraph - Batch Claims Analytics
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

### Datamarketplace Subgraph - Dataset Queries
```graphql
# Get all datasets with trading activity
query DatasetsWithActivity {
  datasets(
    where: { totalTrades_gt: "0" }
    orderBy: totalVolume
    orderDirection: desc
    first: 50
  ) {
    id
    name
    symbol
    creator
    totalVolume
    totalTrades
    uniqueTraders
    isGraduated
    bondingCurve {
      currentPrice
      currentMarketCap
      totalVolumeETH
    }
  }
}

# Search datasets by creator
query DatasetsByCreator($creator: Bytes!) {
  datasets(where: { creator: $creator }) {
    id
    name
    symbol
    totalVolume
    totalBurned
    totalAccesses
    isGraduated
    createdAt
  }
}

# Get graduation events
query RecentGraduations {
  graduations(
    orderBy: timestamp
    orderDirection: desc
    first: 20
  ) {
    id
    dataset {
      name
      symbol
    }
    finalMarketCap
    ethContributed
    tokensContributed
    lpPair
    timestamp
  }
}
```

### Datamarketplace Subgraph - Trading Analytics
```graphql
# Recent trading activity
query RecentTrades($datasetId: Bytes) {
  trades(
    where: { dataset: $datasetId }
    orderBy: timestamp
    orderDirection: desc
    first: 100
  ) {
    id
    type
    trader
    ethAmount
    tokenAmount
    priceAfter
    creatorFee
    protocolFee
    timestamp
  }
}

# Daily trading statistics
query DailyTradingStats($date: String!) {
  datamarketplaceDailyStats(id: $date) {
    date
    totalTrades
    totalVolumeETH
    uniqueTraders
    averageTradeSize
    totalCreatorFees
    totalProtocolFees
  }
}

# User trading activity
query UserTradingActivity($user: Bytes!) {
  datamarketplaceUser(id: $user) {
    totalTrades
    totalVolumeETH
    totalFeesEarned
    totalFeesPaid
    datasetsCreated
    uniqueDatasetsAccessed
    trades(orderBy: timestamp, orderDirection: desc, first: 50) {
      type
      ethAmount
      tokenAmount
      dataset {
        name
        symbol
      }
      timestamp
    }
  }
}
```

### Datamarketplace Subgraph - Burn Analytics
```graphql
# Burn events for dataset access
query BurnEvents($datasetId: Bytes) {
  burnForAccesses(
    where: { dataset: $datasetId }
    orderBy: timestamp
    orderDirection: desc
    first: 100
  ) {
    id
    burner
    amount
    burnThreshold
    timestamp
    dataset {
      name
      symbol
    }
  }
}

# Most accessed datasets
query MostAccessedDatasets {
  datasets(
    orderBy: totalAccesses
    orderDirection: desc
    first: 20
  ) {
    id
    name
    symbol
    totalAccesses
    totalBurned
    creator
  }
}
```

## Schema Highlights

### Factory Subgraph - Core Entities
- **Factory**: Main factory contract with governance info
- **Pool**: Individual reward pools with direct metadata
- **Token**: ERC-20 tokens with usage statistics
- **User**: Comprehensive user activity tracking
- **Claim**: Individual claim records with fee breakdown

### Factory Subgraph - Analytics Entities  
- **BatchClaim**: Batch operation tracking for gas efficiency
- **DailyStats**: Time-series analytics for dashboards
- **FactoryStats**: Global system metrics
- **PoolMetadata**: Direct metadata for search functionality

### Datamarketplace Subgraph - Core Entities
- **DatasetFactory**: EIP-1167 factory for dataset creation
- **Dataset**: Individual dataset tokens with trading stats
- **BondingCurve**: Bonding curve with price and volume data
- **DatamarketplaceUser**: Comprehensive user activity tracking
- **Trade**: Individual trade records (buy/sell)
- **BurnForAccess**: Token burning events for dataset access
- **Graduation**: Graduation events from bonding curve to Uniswap

### Datamarketplace Subgraph - Analytics Entities
- **DatamarketplaceDailyStats**: Time-series analytics for dashboards
- **BurnPortal**: Burn portal management and statistics
- **GraduationManager**: Graduation management and LP tracking

## Search Features

### Direct Metadata
- `skills`: Array of required skills
- `searchString`: Concatenated searchable text for full-text queries

### Analytics Optimization
- Efficient indexing with 2-parameter events for scale
- Pre-calculated statistics for dashboard performance
- Time-series data for trend analysis
- Gas cost tracking for optimization recommendations

## Performance

### Indexing Performance
- **Start Block**: 16830000 (Base Sepolia deployment block)
- **Event Processing**: Optimized for high-volume claim events
- **Query Efficiency**: 2-indexed parameter events reduce bloom filter pressure

### Analytics Capabilities
- Real-time pool creation and funding tracking
- Cumulative claim pattern with fee precision
- Batch operation success/failure rates
- Publisher rotation tracking for governance

## Security Features

- **Factory Validation**: Anti-phishing via approved factory registry
- **Publisher Authority**: Centralized governance tracking
- **Emergency Monitoring**: Sweep and pause event tracking
- **Audit Trail**: Complete transaction history with block timestamps

## Project Structure

```
clones-factory-subgraph/
├── src/                          # Core mapping handlers
│   ├── factory.ts               # RewardPoolFactory event handlers
│   ├── claim-router.ts          # ClaimRouter event processing  
│   ├── vault.ts                 # Dynamic vault template handlers
│   └── datamarketplace/         # Datamarketplace handlers
│       ├── dataset-factory.ts   # DatasetFactory event handlers
│       ├── bonding-curve.ts     # BondingCurve trading events
│       ├── burn-portal.ts       # BurnPortal access events
│       ├── graduation-manager.ts # GraduationManager events
│       └── dataset-token.ts     # DatasetToken events
├── abis/                        # Contract ABI definitions
│   ├── RewardPoolFactory.json   # Factory contract interface
│   ├── ClaimRouter.json         # Claim router interface
│   ├── RewardPoolImplementation.json # Vault template interface
│   └── datamarketplace/         # Datamarketplace ABIs
│       ├── DatasetFactory.json
│       ├── BondingCurveImplementation.json
│       ├── DatasetTokenImplementation.json
│       ├── BurnPortal.json
│       └── GraduationManager.json
├── schema.graphql               # GraphQL schema definition (both subgraphs)
├── subgraph-testnet.yaml       # Factory testnet configuration
├── subgraph-mainnet.yaml       # Factory mainnet configuration
├── subgraph-datamarketplace-testnet.yaml # Datamarketplace testnet
├── subgraph-datamarketplace-mainnet.yaml # Datamarketplace mainnet
├── queries.graphql             # Sample GraphQL queries
├── generated/                   # Auto-generated TypeScript types
├── scripts/                     # Testing and utility scripts
└── clones-factory-base-sepolia/ # Legacy subgraph structure
```

### Key Files

#### Factory Subgraph Files
- **`subgraph-testnet.yaml`**: Factory testnet configuration with contract addresses
- **`subgraph-mainnet.yaml`**: Factory mainnet configuration with contract addresses
- **`src/factory.ts`**: Handles pool creation, funding, and governance events
- **`src/claim-router.ts`**: Processes individual and batch claim transactions
- **`src/vault.ts`**: Template for dynamically created vault instances

#### Datamarketplace Subgraph Files
- **`subgraph-datamarketplace-testnet.yaml`**: Datamarketplace testnet configuration
- **`subgraph-datamarketplace-mainnet.yaml`**: Datamarketplace mainnet configuration
- **`src/datamarketplace/dataset-factory.ts`**: Handles dataset creation and factory events
- **`src/datamarketplace/bonding-curve.ts`**: Processes trading events on bonding curves
- **`src/datamarketplace/burn-portal.ts`**: Manages token burning for dataset access
- **`src/datamarketplace/graduation-manager.ts`**: Handles graduation to Uniswap V2
- **`src/datamarketplace/dataset-token.ts`**: Dataset token events and transfers

#### Shared Files
- **`schema.graphql`**: Defines all entities, relationships, and query interfaces for both subgraphs
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

### Testing

The project includes a query testing script to validate the subgraph's functionality against a live deployment (e.g., Base Sepolia).

To run the tests:

1. **Set up your environment**:
   - Create a `.env` file in the root of this project. You can copy the `.env.example` file.
   - `cp .env.example .env`
   - Set the `SUBGRAPH_URL` in your `.env` file to point to your deployed subgraph endpoint.
   
   ```bash
   # .env
   SUBGRAPH_URL="https://your-subgraph-endpoint-url"
   ```

2. **Run the test script**:
   ```bash
   npm run test-queries
   ```