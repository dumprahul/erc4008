// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IReputationRegistry
 * @dev Interface for the Reputation Registry contract
 * @notice Manages feedback and attestations for ERC-8004 Trustless Agents
 */
interface IReputationRegistry {
    /**
     * @dev Emitted when feedback is authorized for a client-server pair
     * @param agentClientId The ID of the client agent
     * @param agentServerId The ID of the server agent
     * @param feedbackAuthId The unique identifier for this feedback authorization
     */
    event FeedbackAuthorized(uint256 indexed agentClientId, uint256 indexed agentServerId, bytes32 indexed feedbackAuthId);

    /**
     * @dev Authorizes a client agent to provide feedback for a server agent
     * @param agentClientId The ID of the client agent
     * @param agentServerId The ID of the server agent
     * @return feedbackAuthId The unique identifier for this feedback authorization
     */
    function authorizeFeedback(uint256 agentClientId, uint256 agentServerId) external returns (bytes32 feedbackAuthId);

    /**
     * @dev Checks if feedback is authorized for a given authorization ID
     * @param feedbackAuthId The feedback authorization ID to check
     * @return isAuthorized True if feedback is authorized
     */
    function isFeedbackAuthorized(bytes32 feedbackAuthId) external view returns (bool isAuthorized);

    /**
     * @dev Gets the feedback authorization details
     * @param feedbackAuthId The feedback authorization ID
     * @return agentClientId The client agent ID
     * @return agentServerId The server agent ID
     * @return isAuthorized Whether the authorization is still valid
     */
    function getFeedbackAuthorization(bytes32 feedbackAuthId) external view returns (
        uint256 agentClientId,
        uint256 agentServerId,
        bool isAuthorized
    );

    /**
     * @dev Gets all feedback authorizations for a specific client agent
     * @param agentClientId The client agent ID
     * @return feedbackAuthIds Array of feedback authorization IDs
     */
    function getClientFeedbackAuthorizations(uint256 agentClientId) external view returns (bytes32[] memory feedbackAuthIds);

    /**
     * @dev Gets all feedback authorizations for a specific server agent
     * @param agentServerId The server agent ID
     * @return feedbackAuthIds Array of feedback authorization IDs
     */
    function getServerFeedbackAuthorizations(uint256 agentServerId) external view returns (bytes32[] memory feedbackAuthIds);
}
