// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IValidationRegistry
 * @dev Interface for the Validation Registry contract
 * @notice Manages validation requests and responses for ERC-8004 Trustless Agents
 */
interface IValidationRegistry {
    /**
     * @dev Emitted when a validation request is made
     * @param agentValidatorId The ID of the validator agent
     * @param agentServerId The ID of the server agent being validated
     * @param dataHash The hash of the data to be validated
     * @param requestId The unique identifier for this validation request
     */
    event ValidationRequested(
        uint256 indexed agentValidatorId,
        uint256 indexed agentServerId,
        bytes32 indexed dataHash,
        bytes32 requestId
    );

    /**
     * @dev Emitted when a validation response is received
     * @param agentValidatorId The ID of the validator agent
     * @param agentServerId The ID of the server agent that was validated
     * @param dataHash The hash of the validated data
     * @param response The validation response (0-100)
     * @param requestId The unique identifier for this validation request
     */
    event ValidationResponded(
        uint256 indexed agentValidatorId,
        uint256 indexed agentServerId,
        bytes32 indexed dataHash,
        uint256 response,
        bytes32 requestId
    );

    /**
     * @dev Creates a validation request
     * @param agentValidatorId The ID of the validator agent
     * @param agentServerId The ID of the server agent to validate
     * @param dataHash The hash of the data to be validated
     * @return requestId The unique identifier for this validation request
     */
    function requestValidation(uint256 agentValidatorId, uint256 agentServerId, bytes32 dataHash) external returns (bytes32 requestId);

    /**
     * @dev Responds to a validation request
     * @param dataHash The hash of the data that was validated
     * @param response The validation response (0-100)
     * @return success True if the response was recorded successfully
     */
    function respondToValidation(bytes32 dataHash, uint256 response) external returns (bool success);

    /**
     * @dev Gets validation request details
     * @param requestId The validation request ID
     * @return agentValidatorId The validator agent ID
     * @return agentServerId The server agent ID
     * @return dataHash The data hash
     * @return isPending Whether the request is still pending
     * @return response The response if completed (0 if pending)
     */
    function getValidationRequest(bytes32 requestId) external view returns (
        uint256 agentValidatorId,
        uint256 agentServerId,
        bytes32 dataHash,
        bool isPending,
        uint256 response
    );

    /**
     * @dev Gets all pending validation requests for a validator
     * @param agentValidatorId The validator agent ID
     * @return requestIds Array of pending request IDs
     */
    function getPendingValidations(uint256 agentValidatorId) external view returns (bytes32[] memory requestIds);

    /**
     * @dev Gets all validation requests for a server agent
     * @param agentServerId The server agent ID
     * @return requestIds Array of request IDs
     */
    function getServerValidations(uint256 agentServerId) external view returns (bytes32[] memory requestIds);

    /**
     * @dev Gets the validation timeout duration
     * @return timeout The timeout duration in seconds
     */
    function getValidationTimeout() external view returns (uint256 timeout);
}
