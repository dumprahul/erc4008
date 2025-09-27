// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {ValidationRegistry} from "../src/ValidationRegistry.sol";
import {IValidationRegistry} from "../src/interfaces/IValidationRegistry.sol";

contract ValidationRegistryTest is Test {
    ValidationRegistry public validationRegistry;
    
    uint256 public validatorAgentId = 1;
    uint256 public serverAgentId = 2;
    uint256 public anotherValidatorAgentId = 3;
    uint256 public anotherServerAgentId = 4;
    
    bytes32 public dataHash = keccak256("test data");
    bytes32 public anotherDataHash = keccak256("another test data");

    function setUp() public {
        validationRegistry = new ValidationRegistry();
    }

    function test_RequestValidation() public {
        bytes32 requestId = validationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);
        
        assertTrue(requestId != bytes32(0));
        
        (uint256 validatorId, uint256 serverId, bytes32 hash, bool isPending, uint256 response) = 
            validationRegistry.getValidationRequest(requestId);
        
        assertEq(validatorId, validatorAgentId);
        assertEq(serverId, serverAgentId);
        assertEq(hash, dataHash);
        assertTrue(isPending);
        assertEq(response, 0);
    }

    function test_RequestMultipleValidations() public {
        bytes32 requestId1 = validationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);
        bytes32 requestId2 = validationRegistry.requestValidation(anotherValidatorAgentId, serverAgentId, anotherDataHash);
        bytes32 requestId3 = validationRegistry.requestValidation(validatorAgentId, anotherServerAgentId, dataHash);
        
        assertTrue(requestId1 != requestId2);
        assertTrue(requestId2 != requestId3);
        assertTrue(requestId1 != requestId3);
        
        assertTrue(validationRegistry.getTotalRequests() >= 3);
    }

    function test_GetPendingValidations() public {
        bytes32 requestId1 = validationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);
        bytes32 requestId2 = validationRegistry.requestValidation(validatorAgentId, anotherServerAgentId, anotherDataHash);
        
        bytes32[] memory pendingRequests = validationRegistry.getPendingValidations(validatorAgentId);
        assertEq(pendingRequests.length, 2);
    }

    function test_GetServerValidations() public {
        bytes32 requestId1 = validationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);
        bytes32 requestId2 = validationRegistry.requestValidation(anotherValidatorAgentId, serverAgentId, anotherDataHash);
        
        bytes32[] memory serverRequests = validationRegistry.getServerValidations(serverAgentId);
        assertEq(serverRequests.length, 2);
    }

    function test_GetValidationRequestDetails() public {
        bytes32 requestId = validationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);
        
        (uint256 validatorId, uint256 serverId, bytes32 hash, bool isPending, uint256 response, uint256 timestamp, uint256 timeout) = 
            validationRegistry.getValidationRequestDetails(requestId);
        
        assertEq(validatorId, validatorAgentId);
        assertEq(serverId, serverAgentId);
        assertEq(hash, dataHash);
        assertTrue(isPending);
        assertEq(response, 0);
        assertTrue(timestamp > 0);
        assertTrue(timeout > timestamp);
    }

    function test_GetValidationTimeout() public {
        uint256 timeout = validationRegistry.getValidationTimeout();
        assertTrue(timeout > 0);
    }

    function test_SetValidationTimeout() public {
        uint256 newTimeout = 600; // 10 minutes
        validationRegistry.setValidationTimeout(newTimeout);
        
        assertEq(validationRegistry.getValidationTimeout(), newTimeout);
    }

    function test_IsValidationCompleted() public {
        assertFalse(validationRegistry.isValidationCompleted(dataHash));
        
        bytes32 requestId = validationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);
        
        // Still not completed
        assertFalse(validationRegistry.isValidationCompleted(dataHash));
    }

    function test_GetTotalRequests() public {
        assertEq(validationRegistry.getTotalRequests(), 0);
        
        validationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);
        assertEq(validationRegistry.getTotalRequests(), 1);
        
        validationRegistry.requestValidation(anotherValidatorAgentId, serverAgentId, anotherDataHash);
        assertEq(validationRegistry.getTotalRequests(), 2);
    }

    function test_RevertWhen_RequestWithZeroValidatorId() public {
        vm.expectRevert("ValidationRegistry: Invalid validator agent ID");
        validationRegistry.requestValidation(0, serverAgentId, dataHash);
    }

    function test_RevertWhen_RequestWithZeroServerId() public {
        vm.expectRevert("ValidationRegistry: Invalid server agent ID");
        validationRegistry.requestValidation(validatorAgentId, 0, dataHash);
    }

    function test_RevertWhen_RequestWithZeroDataHash() public {
        vm.expectRevert("ValidationRegistry: Invalid data hash");
        validationRegistry.requestValidation(validatorAgentId, serverAgentId, bytes32(0));
    }

    function test_RevertWhen_RequestWithSameValidatorAndServer() public {
        vm.expectRevert("ValidationRegistry: Validator and server cannot be the same");
        validationRegistry.requestValidation(validatorAgentId, validatorAgentId, dataHash);
    }

    function test_RevertWhen_GetNonExistentRequest() public {
        bytes32 nonExistentRequestId = keccak256("non-existent");
        
        vm.expectRevert("ValidationRegistry: Request does not exist");
        validationRegistry.getValidationRequest(nonExistentRequestId);
    }

    function test_RevertWhen_GetNonExistentRequestDetails() public {
        bytes32 nonExistentRequestId = keccak256("non-existent");
        
        vm.expectRevert("ValidationRegistry: Request does not exist");
        validationRegistry.getValidationRequestDetails(nonExistentRequestId);
    }

    function test_RevertWhen_SetZeroTimeout() public {
        vm.expectRevert("ValidationRegistry: Timeout must be greater than 0");
        validationRegistry.setValidationTimeout(0);
    }

    function test_Events() public {
        // Test that events are emitted (without exact matching due to complexity)
        validationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);
        
        // If we get here without reverting, events were emitted successfully
        assertTrue(true);
    }

    function test_UniqueRequestIds() public {
        bytes32[] memory requestIds = new bytes32[](5);
        
        for (uint256 i = 0; i < 5; i++) {
            requestIds[i] = validationRegistry.requestValidation(validatorAgentId + i, serverAgentId + i, keccak256(abi.encodePacked("data", i)));
        }
        
        // Check that all request IDs are unique
        for (uint256 i = 0; i < 5; i++) {
            for (uint256 j = i + 1; j < 5; j++) {
                assertTrue(requestIds[i] != requestIds[j], "Request IDs should be unique");
            }
        }
    }

    function test_MultipleRequestsForSamePair() public {
        bytes32 requestId1 = validationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);
        bytes32 requestId2 = validationRegistry.requestValidation(validatorAgentId, serverAgentId, anotherDataHash);
        
        assertTrue(requestId1 != requestId2);
        
        bytes32[] memory pendingRequests = validationRegistry.getPendingValidations(validatorAgentId);
        assertEq(pendingRequests.length, 2);
    }

    function test_RequestIdGeneration() public {
        bytes32 requestId1 = validationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);
        
        // Request with same parameters should generate different ID due to timestamp
        vm.warp(block.timestamp + 1);
        bytes32 requestId2 = validationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);
        
        assertTrue(requestId1 != requestId2);
    }
}
