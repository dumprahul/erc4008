// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./interfaces/IValidationRegistry.sol";

/**
 * @title ValidationRegistry
 * @dev Implementation of the Validation Registry for ERC-8004 Trustless Agents
 * @notice Manages validation requests and responses
 */
contract ValidationRegistry is IValidationRegistry {
    struct ValidationRequest {
        uint256 agentValidatorId;
        uint256 agentServerId;
        bytes32 dataHash;
        bytes32 requestId;
        bool isPending;
        uint256 response;
        uint256 timestamp;
        uint256 timeout;
    }

    // State variables
    mapping(bytes32 => ValidationRequest) private _validationRequests;
    mapping(uint256 => bytes32[]) private _validatorPendingRequests;
    mapping(uint256 => bytes32[]) private _serverValidationRequests;
    mapping(bytes32 => bool) private _completedValidations;
    
    uint256 private _requestCounter = 0;
    uint256 private _validationTimeout = 300; // 5 minutes default timeout

    /**
     * @dev Creates a validation request
     * @param agentValidatorId The ID of the validator agent
     * @param agentServerId The ID of the server agent to validate
     * @param dataHash The hash of the data to be validated
     * @return requestId The unique identifier for this validation request
     */
    function requestValidation(uint256 agentValidatorId, uint256 agentServerId, bytes32 dataHash) external override returns (bytes32 requestId) {
        require(agentValidatorId != 0, "ValidationRegistry: Invalid validator agent ID");
        require(agentServerId != 0, "ValidationRegistry: Invalid server agent ID");
        require(dataHash != bytes32(0), "ValidationRegistry: Invalid data hash");
        require(agentValidatorId != agentServerId, "ValidationRegistry: Validator and server cannot be the same");

        // Generate unique request ID
        requestId = keccak256(abi.encodePacked(
            agentValidatorId,
            agentServerId,
            dataHash,
            _requestCounter++,
            block.timestamp,
            msg.sender
        ));

        // Ensure the request ID is unique
        require(!_validationRequests[requestId].isPending, "ValidationRegistry: Request ID collision");

        _validationRequests[requestId] = ValidationRequest({
            agentValidatorId: agentValidatorId,
            agentServerId: agentServerId,
            dataHash: dataHash,
            requestId: requestId,
            isPending: true,
            response: 0,
            timestamp: block.timestamp,
            timeout: block.timestamp + _validationTimeout
        });

        // Track requests by validator and server
        _validatorPendingRequests[agentValidatorId].push(requestId);
        _serverValidationRequests[agentServerId].push(requestId);

        emit ValidationRequested(agentValidatorId, agentServerId, dataHash, requestId);
    }

    /**
     * @dev Responds to a validation request
     * @param dataHash The hash of the data that was validated
     * @param response The validation response (0-100)
     * @return success True if the response was recorded successfully
     */
    function respondToValidation(bytes32 dataHash, uint256 response) external override returns (bool success) {
        require(response <= 100, "ValidationRegistry: Response must be between 0 and 100");
        require(!_completedValidations[dataHash], "ValidationRegistry: Validation already completed");

        // Find the pending request for this data hash
        bytes32 requestId = _findPendingRequestByDataHash(dataHash);
        require(requestId != bytes32(0), "ValidationRegistry: No pending request found for data hash");

        ValidationRequest storage request = _validationRequests[requestId];
        require(request.isPending, "ValidationRegistry: Request is not pending");
        require(block.timestamp <= request.timeout, "ValidationRegistry: Request has timed out");

        // Mark as completed
        request.isPending = false;
        request.response = response;
        _completedValidations[dataHash] = true;

        // Remove from pending requests
        _removeFromPendingRequests(request.agentValidatorId, requestId);

        emit ValidationResponded(request.agentValidatorId, request.agentServerId, dataHash, response, requestId);
        
        return true;
    }

    /**
     * @dev Gets validation request details
     * @param requestId The validation request ID
     * @return agentValidatorId The validator agent ID
     * @return agentServerId The server agent ID
     * @return dataHash The data hash
     * @return isPending Whether the request is still pending
     * @return response The response if completed (0 if pending)
     */
    function getValidationRequest(bytes32 requestId) external view override returns (
        uint256 agentValidatorId,
        uint256 agentServerId,
        bytes32 dataHash,
        bool isPending,
        uint256 response
    ) {
        ValidationRequest memory request = _validationRequests[requestId];
        require(request.requestId != bytes32(0), "ValidationRegistry: Request does not exist");
        
        return (request.agentValidatorId, request.agentServerId, request.dataHash, request.isPending, request.response);
    }

    /**
     * @dev Gets all pending validation requests for a validator
     * @param agentValidatorId The validator agent ID
     * @return requestIds Array of pending request IDs
     */
    function getPendingValidations(uint256 agentValidatorId) external view override returns (bytes32[] memory requestIds) {
        bytes32[] memory allRequests = _validatorPendingRequests[agentValidatorId];
        uint256 pendingCount = 0;
        
        // Count pending requests
        for (uint256 i = 0; i < allRequests.length; i++) {
            if (_validationRequests[allRequests[i]].isPending) {
                pendingCount++;
            }
        }
        
        // Create array of pending requests
        bytes32[] memory pendingRequests = new bytes32[](pendingCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allRequests.length; i++) {
            if (_validationRequests[allRequests[i]].isPending) {
                pendingRequests[index] = allRequests[i];
                index++;
            }
        }
        
        return pendingRequests;
    }

    /**
     * @dev Gets all validation requests for a server agent
     * @param agentServerId The server agent ID
     * @return requestIds Array of request IDs
     */
    function getServerValidations(uint256 agentServerId) external view override returns (bytes32[] memory requestIds) {
        return _serverValidationRequests[agentServerId];
    }

    /**
     * @dev Gets the validation timeout duration
     * @return timeout The timeout duration in seconds
     */
    function getValidationTimeout() external view override returns (uint256 timeout) {
        return _validationTimeout;
    }

    /**
     * @dev Sets the validation timeout duration (only owner)
     * @param newTimeout The new timeout duration in seconds
     */
    function setValidationTimeout(uint256 newTimeout) external {
        require(newTimeout > 0, "ValidationRegistry: Timeout must be greater than 0");
        _validationTimeout = newTimeout;
    }

    /**
     * @dev Gets detailed validation request information
     * @param requestId The validation request ID
     * @return agentValidatorId The validator agent ID
     * @return agentServerId The server agent ID
     * @return dataHash The data hash
     * @return isPending Whether the request is still pending
     * @return response The response if completed
     * @return timestamp When the request was created
     * @return timeout When the request times out
     */
    function getValidationRequestDetails(bytes32 requestId) external view returns (
        uint256 agentValidatorId,
        uint256 agentServerId,
        bytes32 dataHash,
        bool isPending,
        uint256 response,
        uint256 timestamp,
        uint256 timeout
    ) {
        ValidationRequest memory request = _validationRequests[requestId];
        require(request.requestId != bytes32(0), "ValidationRegistry: Request does not exist");
        
        return (
            request.agentValidatorId,
            request.agentServerId,
            request.dataHash,
            request.isPending,
            request.response,
            request.timestamp,
            request.timeout
        );
    }

    /**
     * @dev Checks if a validation has been completed for a data hash
     * @param dataHash The data hash to check
     * @return completed True if validation is completed
     */
    function isValidationCompleted(bytes32 dataHash) external view returns (bool completed) {
        return _completedValidations[dataHash];
    }

    /**
     * @dev Gets the total number of validation requests
     * @return count The total number of requests
     */
    function getTotalRequests() external view returns (uint256 count) {
        return _requestCounter;
    }

    /**
     * @dev Internal function to find pending request by data hash
     * @param dataHash The data hash to search for
     * @return requestId The request ID if found, zero otherwise
     */
    function _findPendingRequestByDataHash(bytes32 dataHash) internal view returns (bytes32 requestId) {
        // This is a simplified implementation. In a production system,
        // you might want to maintain a mapping from dataHash to requestId
        // for more efficient lookups
        return bytes32(0); // Placeholder - would need proper implementation
    }

    /**
     * @dev Internal function to remove request from pending list
     * @param agentValidatorId The validator agent ID
     * @param requestId The request ID to remove
     */
    function _removeFromPendingRequests(uint256 agentValidatorId, bytes32 requestId) internal {
        bytes32[] storage pendingRequests = _validatorPendingRequests[agentValidatorId];
        for (uint256 i = 0; i < pendingRequests.length; i++) {
            if (pendingRequests[i] == requestId) {
                pendingRequests[i] = pendingRequests[pendingRequests.length - 1];
                pendingRequests.pop();
                break;
            }
        }
    }
}
