# Clones Factory Subgraph

This subgraph indexes the Clones factory system smart contracts for discovery and search functionality. Currently configured for Base Sepolia testnet during development phase. Mainnet deployment addresses will be updated upon production release.

## Architecture

### Indexed Contracts
- **RewardPoolFactory**
- **ClaimRouter**
- **RewardPoolVault Templates**: Dynamically created vaults via EIP-1167

> **Note**: Mainnet contract addresses will be added here once production deployment is complete.

### Key Features
- **Real-time Factory Indexing**: Tracks pool creation, token allowlist, publisher rotation
- **Comprehensive Claim Analytics**: Individual and batch claim tracking with gas optimization
- **Direct Metadata System**: Full skills/task type storage and search functionality
- **Multi-dimensional Search**: Skills, description, and full-text search
- **Advanced Analytics**: Daily stats, user statistics, performance metrics
- **Search Optimization**: Efficient queries by skills, taskType, owner via GraphQL

### Metadata Features
- **Direct Storage**: Skills and task types stored directly in entities
- **Search Optimization**: Pre-computed search strings for fast queries
- **Task Type Categorization**: Extracts task types and categories
- **Full-text Search String**: Concatenated searchable content
- **Metadata Update Tracking**: Complete audit trail of metadata changes
- **Sample Data Generation**: Demonstrates functionality with realistic test data

## Deployment

### Local Development
```bash
npm install
npx graph codegen
npx graph build

# Local deployment (requires Graph Node)
npx graph create --node http://localhost:8020/ clones/factory
npx graph deploy --node http://localhost:8020/ clones/factory
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

## Subgraph Updates (After Contract Modification)

When smart contracts are modified and redeployed, the subgraph must be updated to reflect these changes. Here is the process to follow:

1.  **Update ABIs**:
    -   Copy the new ABI (`.json`) files generated from your contract compilation.
    -   Replace the old files in the `abis/` directory.

2.  **Modify `subgraph.yaml`**:
    -   **Contract Addresses**: Update the addresses in the `dataSources` section.
    -   **Start Block**: Change the `startBlock` value to match the deployment block of the new contracts. This avoids indexing unnecessary events from the old contracts.
    -   **Event Signatures**: If an event's structure has changed (parameters added/removed), update its signature in the `eventHandlers` section.

3.  **Regenerate Types and Update Mappings**:
    -   Run `npx graph codegen` to update the AssemblyScript classes based on the new ABIs.
    -   Modify the mapping functions (handlers in `src/`) to match the new event signatures. For example, if an event has a new parameter, its handling function must be adapted to receive it.

4.  **Build and Deploy**:
    -   Build the subgraph with `npx graph build`.
    -   Deploy a new version to The Graph Studio:
        ```bash
        graph deploy <YOUR_SUBGRAPH_SLUG>
        ```
    -   During deployment, the CLI will prompt you to assign a new version number (e.g., `v0.0.2`).

## Local Development & Validation

### Development Workflow

The recommended development workflow for GraphQL queries:

1. **Local Validation**: `npm run codegen` - Validates queries against deployed schema
2. **Live Testing**: `npm run test-queries` - Tests queries with real data
3. **Deploy**: Update subgraph when schema changes

### Query Validation

Validate your GraphQL queries against the deployed subgraph schema:

```bash
npm run codegen
```

This command will:
- Fetch the schema from your deployed subgraph (via `SUBGRAPH_URL` in `.env`)
- Validate all queries in `queries.graphql` against the real schema
- Generate TypeScript types in `src/generated/graphql.ts`
- Fail immediately with precise error messages for invalid queries

**Important**: This validates against the **deployed** schema, not the local `schema.graphql`. Deploy your subgraph first if you've made schema changes.

### Testing Queries

Test GraphQL queries against the deployed subgraph with real data:

```bash
npm run test-queries
```

This script runs predefined queries and reports failures or performance issues.

### Schema Type Mapping

Note that The Graph transforms your local schema types:
- `Bytes!` → `ID!` for entity lookups (e.g., `pool(id: ID!)`)
- `Bytes!` → `String!` for complex filters (e.g., `factory: String!`)
- Always validate with `npm run codegen` to catch these transformations

## Key Query Patterns

### Metadata Queries
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

## Schema Highlights

### Core Entities
- **Factory**: Main factory contract with governance info
- **Pool**: Individual reward pools with direct metadata
- **Token**: ERC-20 tokens with usage statistics
- **User**: Comprehensive user activity tracking
- **Claim**: Individual claim records with fee breakdown

### Analytics Entities  
- **BatchClaim**: Batch operation tracking for gas efficiency
- **DailyStats**: Time-series analytics for dashboards
- **FactoryStats**: Global system metrics
- **PoolMetadata**: Direct metadata for search functionality

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