// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IIdentityRegistry
 * @dev Interface for the Identity Registry contract
 * @notice Manages agent registration and resolution for ERC-8004 Trustless Agents
 */
interface IIdentityRegistry {
    /**
     * @dev Emitted when a new agent is registered
     * @param agentId The unique identifier assigned to the agent
     * @param agentDomain The domain where the agent's card is hosted
     * @param agentAddress The EVM address of the agent
     */
    event AgentRegistered(uint256 indexed agentId, string agentDomain, address agentAddress);

    /**
     * @dev Emitted when an agent's information is updated
     * @param agentId The unique identifier of the agent
     * @param newAgentDomain The new domain (empty if not changed)
     * @param newAgentAddress The new address (zero if not changed)
     */
    event AgentUpdated(uint256 indexed agentId, string newAgentDomain, address newAgentAddress);

    /**
     * @dev Registers a new agent
     * @param agentDomain The domain where the agent's card is hosted (RFC 8615 compliant)
     * @param agentAddress The EVM address of the agent
     * @return agentId The unique identifier assigned to the agent
     */
    function registerAgent(string calldata agentDomain, address agentAddress) external returns (uint256 agentId);

    /**
     * @dev Updates an agent's information
     * @param agentId The unique identifier of the agent
     * @param newAgentDomain The new domain (empty string to keep current)
     * @param newAgentAddress The new address (zero address to keep current)
     * @return success True if the update was successful
     */
    function updateAgent(uint256 agentId, string calldata newAgentDomain, address newAgentAddress) external returns (bool success);

    /**
     * @dev Gets agent information by ID
     * @param agentId The unique identifier of the agent
     * @return agentId_ The agent ID
     * @return agentDomain The agent's domain
     * @return agentAddress The agent's address
     */
    function getAgent(uint256 agentId) external view returns (uint256 agentId_, string memory agentDomain, address agentAddress);

    /**
     * @dev Resolves agent information by domain
     * @param agentDomain The domain to resolve
     * @return agentId The agent ID
     * @return agentDomain_ The agent's domain
     * @return agentAddress The agent's address
     */
    function resolveByDomain(string calldata agentDomain) external view returns (uint256 agentId, string memory agentDomain_, address agentAddress);

    /**
     * @dev Resolves agent information by address
     * @param agentAddress The address to resolve
     * @return agentId The agent ID
     * @return agentDomain The agent's domain
     * @return agentAddress_ The agent's address
     */
    function resolveByAddress(address agentAddress) external view returns (uint256 agentId, string memory agentDomain, address agentAddress_);

    /**
     * @dev Gets the total number of registered agents
     * @return count The total number of agents
     */
    function getTotalAgents() external view returns (uint256 count);
}
