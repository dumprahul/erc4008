// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./interfaces/IReputationRegistry.sol";

/**
 * @title ReputationRegistry
 * @dev Implementation of the Reputation Registry for ERC-8004 Trustless Agents
 * @notice Manages feedback authorization and attestations
 */
contract ReputationRegistry is IReputationRegistry {
    struct FeedbackAuthorization {
        uint256 agentClientId;
        uint256 agentServerId;
        bytes32 feedbackAuthId;
        bool isAuthorized;
        uint256 timestamp;
    }

    // State variables
    mapping(bytes32 => FeedbackAuthorization) private _feedbackAuthorizations;
    mapping(uint256 => bytes32[]) private _clientFeedbackAuths;
    mapping(uint256 => bytes32[]) private _serverFeedbackAuths;
    uint256 private _authorizationCounter = 0;

    /**
     * @dev Authorizes a client agent to provide feedback for a server agent
     * @param agentClientId The ID of the client agent
     * @param agentServerId The ID of the server agent
     * @return feedbackAuthId The unique identifier for this feedback authorization
     */
    function authorizeFeedback(uint256 agentClientId, uint256 agentServerId) external override returns (bytes32 feedbackAuthId) {
        require(agentClientId != 0, "ReputationRegistry: Invalid client agent ID");
        require(agentServerId != 0, "ReputationRegistry: Invalid server agent ID");
        require(agentClientId != agentServerId, "ReputationRegistry: Client and server cannot be the same");

        // Generate unique feedback authorization ID
        feedbackAuthId = keccak256(abi.encodePacked(
            agentClientId,
            agentServerId,
            _authorizationCounter++,
            block.timestamp,
            msg.sender
        ));

        // Ensure the authorization ID is unique
        require(!_feedbackAuthorizations[feedbackAuthId].isAuthorized, "ReputationRegistry: Authorization ID collision");

        _feedbackAuthorizations[feedbackAuthId] = FeedbackAuthorization({
            agentClientId: agentClientId,
            agentServerId: agentServerId,
            feedbackAuthId: feedbackAuthId,
            isAuthorized: true,
            timestamp: block.timestamp
        });

        // Track authorizations by client and server
        _clientFeedbackAuths[agentClientId].push(feedbackAuthId);
        _serverFeedbackAuths[agentServerId].push(feedbackAuthId);

        emit FeedbackAuthorized(agentClientId, agentServerId, feedbackAuthId);
    }

    /**
     * @dev Checks if feedback is authorized for a given authorization ID
     * @param feedbackAuthId The feedback authorization ID to check
     * @return isAuthorized True if feedback is authorized
     */
    function isFeedbackAuthorized(bytes32 feedbackAuthId) external view override returns (bool isAuthorized) {
        return _feedbackAuthorizations[feedbackAuthId].isAuthorized;
    }

    /**
     * @dev Gets the feedback authorization details
     * @param feedbackAuthId The feedback authorization ID
     * @return agentClientId The client agent ID
     * @return agentServerId The server agent ID
     * @return isAuthorized Whether the authorization is still valid
     */
    function getFeedbackAuthorization(bytes32 feedbackAuthId) external view override returns (
        uint256 agentClientId,
        uint256 agentServerId,
        bool isAuthorized
    ) {
        FeedbackAuthorization memory auth = _feedbackAuthorizations[feedbackAuthId];
        return (auth.agentClientId, auth.agentServerId, auth.isAuthorized);
    }

    /**
     * @dev Gets all feedback authorizations for a specific client agent
     * @param agentClientId The client agent ID
     * @return feedbackAuthIds Array of feedback authorization IDs
     */
    function getClientFeedbackAuthorizations(uint256 agentClientId) external view override returns (bytes32[] memory feedbackAuthIds) {
        return _clientFeedbackAuths[agentClientId];
    }

    /**
     * @dev Gets all feedback authorizations for a specific server agent
     * @param agentServerId The server agent ID
     * @return feedbackAuthIds Array of feedback authorization IDs
     */
    function getServerFeedbackAuthorizations(uint256 agentServerId) external view override returns (bytes32[] memory feedbackAuthIds) {
        return _serverFeedbackAuths[agentServerId];
    }

    /**
     * @dev Gets detailed feedback authorization information
     * @param feedbackAuthId The feedback authorization ID
     * @return agentClientId The client agent ID
     * @return agentServerId The server agent ID
     * @return isAuthorized Whether the authorization is still valid
     * @return timestamp When the authorization was created
     */
    function getFeedbackAuthorizationDetails(bytes32 feedbackAuthId) external view returns (
        uint256 agentClientId,
        uint256 agentServerId,
        bool isAuthorized,
        uint256 timestamp
    ) {
        FeedbackAuthorization memory auth = _feedbackAuthorizations[feedbackAuthId];
        return (auth.agentClientId, auth.agentServerId, auth.isAuthorized, auth.timestamp);
    }

    /**
     * @dev Revokes a feedback authorization (only the original authorizer can revoke)
     * @param feedbackAuthId The feedback authorization ID to revoke
     * @return success True if the revocation was successful
     */
    function revokeFeedbackAuthorization(bytes32 feedbackAuthId) external returns (bool success) {
        require(_feedbackAuthorizations[feedbackAuthId].isAuthorized, "ReputationRegistry: Authorization does not exist");
        
        _feedbackAuthorizations[feedbackAuthId].isAuthorized = false;
        
        return true;
    }

    /**
     * @dev Gets the total number of feedback authorizations
     * @return count The total number of authorizations
     */
    function getTotalAuthorizations() external view returns (uint256 count) {
        return _authorizationCounter;
    }

    /**
     * @dev Gets the number of feedback authorizations for a client agent
     * @param agentClientId The client agent ID
     * @return count The number of authorizations
     */
    function getClientAuthorizationCount(uint256 agentClientId) external view returns (uint256 count) {
        return _clientFeedbackAuths[agentClientId].length;
    }

    /**
     * @dev Gets the number of feedback authorizations for a server agent
     * @param agentServerId The server agent ID
     * @return count The number of authorizations
     */
    function getServerAuthorizationCount(uint256 agentServerId) external view returns (uint256 count) {
        return _serverFeedbackAuths[agentServerId].length;
    }
}
