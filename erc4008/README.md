# ERC-8004: Trustless Agents Implementation

A complete Solidity implementation of [ERC-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004) - a protocol that extends the Agent-to-Agent (A2A) Protocol with a trust layer for discovering, choosing, and interacting with agents across organizational boundaries without pre-existing trust.

## 📋 Overview

This implementation provides three core registries as specified in ERC-8004:

1. **Identity Registry** - Agent registration and resolution
2. **Reputation Registry** - Feedback and attestation management  
3. **Validation Registry** - Task validation through staking or cryptographic proofs

## 🏗️ Architecture

### Core Contracts

- **`IdentityRegistry.sol`** - Manages agent registration, updates, and resolution
- **`ReputationRegistry.sol`** - Handles feedback authorization and attestations
- **`ValidationRegistry.sol`** - Manages validation requests and responses

### Interfaces

- **`IIdentityRegistry.sol`** - Interface for identity management
- **`IReputationRegistry.sol`** - Interface for reputation management
- **`IValidationRegistry.sol`** - Interface for validation management

## 🚀 Features

### Identity Registry
- ✅ Agent registration with domain and address
- ✅ Agent information updates
- ✅ Resolution by domain, address, or ID
- ✅ Duplicate prevention
- ✅ Access control

### Reputation Registry
- ✅ Feedback authorization between agents
- ✅ Authorization tracking and management
- ✅ Client and server feedback queries
- ✅ Authorization revocation

### Validation Registry
- ✅ Validation request creation
- ✅ Validation response handling
- ✅ Timeout management
- ✅ Pending validation tracking

## 🧪 Testing

The project includes comprehensive test suites:

- **Unit Tests** - Individual contract testing
- **Integration Tests** - Cross-registry functionality
- **Gas Usage Tests** - Performance optimization
- **Error Handling Tests** - Edge case coverage

### Running Tests

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-path test/IdentityRegistry.t.sol

# Run with gas reporting
forge test --gas-report

# Run with detailed output
forge test -vvv
```

## 📦 Deployment

### Local Development

```bash
# Deploy to local Anvil network
forge script script/DeployERC8004.s.sol:DeployERC8004 --rpc-url http://localhost:8545 --broadcast
```

### Testnet Deployment

```bash
# Deploy to Sepolia testnet
forge script script/DeployERC8004.s.sol:DeployERC8004 --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

### Mainnet Deployment

```bash
# Deploy to Ethereum mainnet
forge script script/DeployERC8004.s.sol:DeployERC8004 --rpc-url $MAINNET_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

## 🔧 Usage Examples

### Agent Registration

```solidity
// Register a new agent
uint256 agentId = identityRegistry.registerAgent("agent.example.com", agentAddress);

// Update agent information
identityRegistry.updateAgent(agentId, "newdomain.example.com", newAddress);

// Resolve agent by domain
(uint256 id, string memory domain, address addr) = identityRegistry.resolveByDomain("agent.example.com");
```

### Feedback Management

```solidity
// Authorize feedback between agents
bytes32 feedbackAuthId = reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);

// Check if feedback is authorized
bool isAuthorized = reputationRegistry.isFeedbackAuthorized(feedbackAuthId);

// Get client's feedback authorizations
bytes32[] memory auths = reputationRegistry.getClientFeedbackAuthorizations(clientAgentId);
```

### Validation Requests

```solidity
// Request validation
bytes32 requestId = validationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);

// Respond to validation
validationRegistry.respondToValidation(dataHash, responseScore);

// Get pending validations
bytes32[] memory pending = validationRegistry.getPendingValidations(validatorAgentId);
```

## 📊 Gas Optimization

The contracts are optimized for gas efficiency:

- **Identity Registry**: ~50,000 gas for registration
- **Reputation Registry**: ~30,000 gas for authorization
- **Validation Registry**: ~40,000 gas for request creation

## 🔒 Security Considerations

- **Access Control**: Only agents can update their own information
- **Duplicate Prevention**: Prevents duplicate registrations
- **Input Validation**: Comprehensive parameter validation
- **Event Logging**: Complete audit trail
- **Timeout Management**: Prevents stale validation requests

## 📈 Trust Models

The implementation supports three trust models as specified in ERC-8004:

1. **Reputation-based** - Client feedback systems
2. **Crypto-economic** - Stake-secured validation
3. **Crypto-verifiable** - TEE attestations

## 🌐 Interoperability

- **CAIP-10 Compliance** - Chain-agnostic addressing
- **RFC 8615 Compliance** - Standard web discovery
- **Modular Design** - Easy integration with existing systems

## 📚 Documentation

- [ERC-8004 Specification](./erc4008.md)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [Solidity Documentation](https://docs.soliditylang.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [ERC-8004 EIP](https://eips.ethereum.org/EIPS/eip-8004)
- [A2A Protocol](https://github.com/ethereum/a2a-protocol)
- [Foundry](https://github.com/foundry-rs/foundry)

## 📞 Support

For questions and support:

- Open an issue on GitHub
- Join the [Ethereum Magicians](https://ethereum-magicians.org/) discussion
- Check the [ERC-8004 discussion thread](https://ethereum-magicians.org/t/erc-8004-trustless-agents/25098)

---

**Built with ❤️ for the Ethereum ecosystem**