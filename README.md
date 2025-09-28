# 0G Network Contract Indexer

A comprehensive smart contract indexer for the [0G network](https://0g.ai/) that monitors, indexes, and stores blockchain data including events, transactions, and contract state changes. 0G is a modular AI blockchain that enables scalable on-chain AI with data availability and storage solutions.

## Features

- 🔍 **Event Monitoring**: Real-time indexing of smart contract events on 0G network
- 📊 **Transaction Tracking**: Complete transaction history and status tracking
- 🗄️ **SQLite Database**: Efficient local data storage with optimized indexes
- 🚀 **REST API**: Query indexed data via HTTP endpoints with pagination
- 📝 **Logging**: Comprehensive logging system with structured output
- ⚙️ **Configurable**: Easy configuration via environment variables
- 🔄 **Block Reorg Handling**: Handles blockchain reorganizations gracefully
- 📈 **Performance Monitoring**: Built-in performance metrics and health checks
- 🎯 **0G Network Optimized**: Specifically tuned for 0G's network characteristics

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Copy `.env.example` to `.env` and update with your settings:
   ```bash
   cp .env.example .env
   ```

3. **Start the indexer**:
   ```bash
   npm start
   ```

4. **Development mode**:
   ```bash
   npm run dev
   ```

## Configuration

The indexer is configured via environment variables in `.env`:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `OG_RPC_URL` | 0G network RPC endpoint | Required | `https://evmrpc-testnet.0g.ai` |
| `CONTRACT_ADDRESSES` | Comma-separated contract addresses | Required | `0x123...,0xabc...` |
| `START_BLOCK` | Block number to start indexing from | `latest` | `latest`, `12345` |
| `DB_PATH` | SQLite database file path | `./data/indexer.db` | `./data/indexer.db` |
| `API_PORT` | REST API server port | `3000` | `3000` |
| `BATCH_SIZE` | Number of blocks to process per batch | `100` | `100` |
| `POLLING_INTERVAL` | Seconds between polling cycles | `5` | `5` |
| `BLOCK_CONFIRMATIONS` | Blocks to wait before considering final | `12` | `12` |

## API Endpoints

### Events
- `GET /api/events` - Get all indexed events
- `GET /api/events/:contractAddress` - Get events for specific contract
- `GET /api/events/:contractAddress/:eventName` - Get specific events

### Transactions
- `GET /api/transactions` - Get all indexed transactions
- `GET /api/transactions/:hash` - Get specific transaction
- `GET /api/transactions/contract/:address` - Get transactions for contract

### Blocks
- `GET /api/blocks` - Get indexed block information
- `GET /api/blocks/:number` - Get specific block

### Stats
- `GET /api/stats` - Get indexer statistics

## Database Schema

The indexer creates the following tables:

- **blocks**: Block information
- **transactions**: Transaction data
- **events**: Contract event logs
- **contracts**: Tracked contract metadata
- **indexer_state**: Current indexer state

## Architecture

```
src/
├── index.js              # Main application entry
├── config/
│   └── database.js       # Database configuration
├── services/
│   ├── indexer.js        # Core indexing logic
│   ├── blockchain.js     # Blockchain interaction
│   └── storage.js        # Data storage operations
├── api/
│   └── routes.js         # REST API routes
├── models/
│   └── schema.js         # Database schema
└── utils/
    ├── logger.js         # Logging configuration
    └── helpers.js        # Utility functions
```

## Development

Run tests:
```bash
npm test
```

Lint code:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

## License

MIT License - see LICENSE file for details.