// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./interfaces/IIdentityRegistry.sol";

/**
 * @title IdentityRegistry
 * @dev Implementation of the Identity Registry for ERC-8004 Trustless Agents
 * @notice Manages agent registration, updates, and resolution
 */
contract IdentityRegistry is IIdentityRegistry {
    struct Agent {
        uint256 agentId;
        string agentDomain;
        address agentAddress;
        bool exists;
    }

    // State variables
    uint256 private _nextAgentId = 1;
    mapping(uint256 => Agent) private _agents;
    mapping(string => uint256) private _domainToAgentId;
    mapping(address => uint256) private _addressToAgentId;

    /**
     * @dev Registers a new agent
     * @param agentDomain The domain where the agent's card is hosted (RFC 8615 compliant)
     * @param agentAddress The EVM address of the agent
     * @return agentId The unique identifier assigned to the agent
     */
    function registerAgent(string calldata agentDomain, address agentAddress) external override returns (uint256 agentId) {
        require(agentAddress != address(0), "IdentityRegistry: Invalid agent address");
        require(bytes(agentDomain).length > 0, "IdentityRegistry: Empty agent domain");
        require(_addressToAgentId[agentAddress] == 0, "IdentityRegistry: Address already registered");
        require(_domainToAgentId[agentDomain] == 0, "IdentityRegistry: Domain already registered");

        agentId = _nextAgentId++;
        
        _agents[agentId] = Agent({
            agentId: agentId,
            agentDomain: agentDomain,
            agentAddress: agentAddress,
            exists: true
        });

        _domainToAgentId[agentDomain] = agentId;
        _addressToAgentId[agentAddress] = agentId;

        emit AgentRegistered(agentId, agentDomain, agentAddress);
    }

    /**
     * @dev Updates an agent's information
     * @param agentId The unique identifier of the agent
     * @param newAgentDomain The new domain (empty string to keep current)
     * @param newAgentAddress The new address (zero address to keep current)
     * @return success True if the update was successful
     */
    function updateAgent(uint256 agentId, string calldata newAgentDomain, address newAgentAddress) external override returns (bool success) {
        require(_agents[agentId].exists, "IdentityRegistry: Agent does not exist");
        require(msg.sender == _agents[agentId].agentAddress, "IdentityRegistry: Only agent can update");

        Agent storage agent = _agents[agentId];
        bool domainChanged = false;
        bool addressChanged = false;

        // Update domain if provided
        if (bytes(newAgentDomain).length > 0 && keccak256(bytes(newAgentDomain)) != keccak256(bytes(agent.agentDomain))) {
            require(_domainToAgentId[newAgentDomain] == 0, "IdentityRegistry: Domain already in use");
            
            // Remove old domain mapping
            delete _domainToAgentId[agent.agentDomain];
            
            // Set new domain
            agent.agentDomain = newAgentDomain;
            _domainToAgentId[newAgentDomain] = agentId;
            domainChanged = true;
        }

        // Update address if provided
        if (newAgentAddress != address(0) && newAgentAddress != agent.agentAddress) {
            require(_addressToAgentId[newAgentAddress] == 0, "IdentityRegistry: Address already in use");
            
            // Remove old address mapping
            delete _addressToAgentId[agent.agentAddress];
            
            // Set new address
            agent.agentAddress = newAgentAddress;
            _addressToAgentId[newAgentAddress] = agentId;
            addressChanged = true;
        }

        require(domainChanged || addressChanged, "IdentityRegistry: No changes provided");

        emit AgentUpdated(agentId, newAgentDomain, newAgentAddress);
        return true;
    }

    /**
     * @dev Gets agent information by ID
     * @param agentId The unique identifier of the agent
     * @return agentId_ The agent ID
     * @return agentDomain The agent's domain
     * @return agentAddress The agent's address
     */
    function getAgent(uint256 agentId) external view override returns (uint256 agentId_, string memory agentDomain, address agentAddress) {
        require(_agents[agentId].exists, "IdentityRegistry: Agent does not exist");
        
        Agent memory agent = _agents[agentId];
        return (agent.agentId, agent.agentDomain, agent.agentAddress);
    }

    /**
     * @dev Resolves agent information by domain
     * @param agentDomain The domain to resolve
     * @return agentId The agent ID
     * @return agentDomain_ The agent's domain
     * @return agentAddress The agent's address
     */
    function resolveByDomain(string calldata agentDomain) external view override returns (uint256 agentId, string memory agentDomain_, address agentAddress) {
        agentId = _domainToAgentId[agentDomain];
        require(agentId != 0, "IdentityRegistry: Agent not found for domain");
        
        Agent memory agent = _agents[agentId];
        return (agent.agentId, agent.agentDomain, agent.agentAddress);
    }

    /**
     * @dev Resolves agent information by address
     * @param agentAddress The address to resolve
     * @return agentId The agent ID
     * @return agentDomain The agent's domain
     * @return agentAddress_ The agent's address
     */
    function resolveByAddress(address agentAddress) external view override returns (uint256 agentId, string memory agentDomain, address agentAddress_) {
        agentId = _addressToAgentId[agentAddress];
        require(agentId != 0, "IdentityRegistry: Agent not found for address");
        
        Agent memory agent = _agents[agentId];
        return (agent.agentId, agent.agentDomain, agent.agentAddress);
    }

    /**
     * @dev Gets the total number of registered agents
     * @return count The total number of agents
     */
    function getTotalAgents() external view override returns (uint256 count) {
        return _nextAgentId - 1;
    }

    /**
     * @dev Checks if an agent exists
     * @param agentId The agent ID to check
     * @return exists True if the agent exists
     */
    function agentExists(uint256 agentId) external view returns (bool exists) {
        return _agents[agentId].exists;
    }

    /**
     * @dev Gets the next agent ID that will be assigned
     * @return nextId The next agent ID
     */
    function getNextAgentId() external view returns (uint256 nextId) {
        return _nextAgentId;
    }
}
