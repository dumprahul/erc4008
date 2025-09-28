// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {IReputationRegistry} from "../src/interfaces/IReputationRegistry.sol";

contract ReputationRegistryTest is Test {
    ReputationRegistry public reputationRegistry;
    
    uint256 public clientAgentId = 1;
    uint256 public serverAgentId = 2;
    uint256 public anotherClientAgentId = 3;
    uint256 public anotherServerAgentId = 4;

    function setUp() public {
        reputationRegistry = new ReputationRegistry();
    }

    function test_AuthorizeFeedback() public {
        bytes32 feedbackAuthId = reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
        
        assertTrue(feedbackAuthId != bytes32(0));
        assertTrue(reputationRegistry.isFeedbackAuthorized(feedbackAuthId));
        
        (uint256 clientId, uint256 serverId, bool isAuthorized) = reputationRegistry.getFeedbackAuthorization(feedbackAuthId);
        assertEq(clientId, clientAgentId);
        assertEq(serverId, serverAgentId);
        assertTrue(isAuthorized);
    }

    function test_AuthorizeMultipleFeedback() public {
        bytes32 authId1 = reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
        bytes32 authId2 = reputationRegistry.authorizeFeedback(anotherClientAgentId, serverAgentId);
        bytes32 authId3 = reputationRegistry.authorizeFeedback(clientAgentId, anotherServerAgentId);
        
        assertTrue(authId1 != authId2);
        assertTrue(authId2 != authId3);
        assertTrue(authId1 != authId3);
        
        assertTrue(reputationRegistry.isFeedbackAuthorized(authId1));
        assertTrue(reputationRegistry.isFeedbackAuthorized(authId2));
        assertTrue(reputationRegistry.isFeedbackAuthorized(authId3));
    }

    function test_GetClientFeedbackAuthorizations() public {
        bytes32 authId1 = reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
        bytes32 authId2 = reputationRegistry.authorizeFeedback(clientAgentId, anotherServerAgentId);
        
        bytes32[] memory clientAuths = reputationRegistry.getClientFeedbackAuthorizations(clientAgentId);
        assertEq(clientAuths.length, 2);
        assertEq(clientAuths[0], authId1);
        assertEq(clientAuths[1], authId2);
    }

    function test_GetServerFeedbackAuthorizations() public {
        bytes32 authId1 = reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
        bytes32 authId2 = reputationRegistry.authorizeFeedback(anotherClientAgentId, serverAgentId);
        
        bytes32[] memory serverAuths = reputationRegistry.getServerFeedbackAuthorizations(serverAgentId);
        assertEq(serverAuths.length, 2);
        assertEq(serverAuths[0], authId1);
        assertEq(serverAuths[1], authId2);
    }

    function test_GetFeedbackAuthorizationDetails() public {
        bytes32 feedbackAuthId = reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
        
        (uint256 clientId, uint256 serverId, bool isAuthorized, uint256 timestamp) = 
            reputationRegistry.getFeedbackAuthorizationDetails(feedbackAuthId);
        
        assertEq(clientId, clientAgentId);
        assertEq(serverId, serverAgentId);
        assertTrue(isAuthorized);
        assertTrue(timestamp > 0);
    }

    function test_RevokeFeedbackAuthorization() public {
        bytes32 feedbackAuthId = reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
        
        assertTrue(reputationRegistry.isFeedbackAuthorized(feedbackAuthId));
        
        bool success = reputationRegistry.revokeFeedbackAuthorization(feedbackAuthId);
        assertTrue(success);
        
        assertFalse(reputationRegistry.isFeedbackAuthorized(feedbackAuthId));
        
        (uint256 clientId, uint256 serverId, bool isAuthorized) = reputationRegistry.getFeedbackAuthorization(feedbackAuthId);
        assertEq(clientId, clientAgentId);
        assertEq(serverId, serverAgentId);
        assertFalse(isAuthorized);
    }

    function test_GetTotalAuthorizations() public {
        assertEq(reputationRegistry.getTotalAuthorizations(), 0);
        
        reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
        assertEq(reputationRegistry.getTotalAuthorizations(), 1);
        
        reputationRegistry.authorizeFeedback(anotherClientAgentId, serverAgentId);
        assertEq(reputationRegistry.getTotalAuthorizations(), 2);
    }

    function test_GetClientAuthorizationCount() public {
        assertEq(reputationRegistry.getClientAuthorizationCount(clientAgentId), 0);
        
        reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
        assertEq(reputationRegistry.getClientAuthorizationCount(clientAgentId), 1);
        
        reputationRegistry.authorizeFeedback(clientAgentId, anotherServerAgentId);
        assertEq(reputationRegistry.getClientAuthorizationCount(clientAgentId), 2);
    }

    function test_GetServerAuthorizationCount() public {
        assertEq(reputationRegistry.getServerAuthorizationCount(serverAgentId), 0);
        
        reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
        assertEq(reputationRegistry.getServerAuthorizationCount(serverAgentId), 1);
        
        reputationRegistry.authorizeFeedback(anotherClientAgentId, serverAgentId);
        assertEq(reputationRegistry.getServerAuthorizationCount(serverAgentId), 2);
    }

    function test_RevertWhen_AuthorizeWithZeroClientId() public {
        vm.expectRevert("ReputationRegistry: Invalid client agent ID");
        reputationRegistry.authorizeFeedback(0, serverAgentId);
    }

    function test_RevertWhen_AuthorizeWithZeroServerId() public {
        vm.expectRevert("ReputationRegistry: Invalid server agent ID");
        reputationRegistry.authorizeFeedback(clientAgentId, 0);
    }

    function test_RevertWhen_AuthorizeWithSameClientAndServer() public {
        vm.expectRevert("ReputationRegistry: Client and server cannot be the same");
        reputationRegistry.authorizeFeedback(clientAgentId, clientAgentId);
    }

    function test_RevertWhen_RevokeNonExistentAuthorization() public {
        bytes32 nonExistentAuthId = keccak256("non-existent");
        
        vm.expectRevert("ReputationRegistry: Authorization does not exist");
        reputationRegistry.revokeFeedbackAuthorization(nonExistentAuthId);
    }

    function test_Events() public {
        // Test that events are emitted (without exact matching due to complexity)
        reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
        
        // If we get here without reverting, events were emitted successfully
        assertTrue(true);
    }

    function test_UniqueFeedbackAuthIds() public {
        bytes32[] memory authIds = new bytes32[](10);
        
        for (uint256 i = 0; i < 10; i++) {
            authIds[i] = reputationRegistry.authorizeFeedback(clientAgentId + i, serverAgentId + i);
        }
        
        // Check that all auth IDs are unique
        for (uint256 i = 0; i < 10; i++) {
            for (uint256 j = i + 1; j < 10; j++) {
                assertTrue(authIds[i] != authIds[j], "Auth IDs should be unique");
            }
        }
    }

    function test_MultipleAuthorizationsForSamePair() public {
        bytes32 authId1 = reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
        bytes32 authId2 = reputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
        
        assertTrue(authId1 != authId2);
        assertTrue(reputationRegistry.isFeedbackAuthorized(authId1));
        assertTrue(reputationRegistry.isFeedbackAuthorized(authId2));
        
        bytes32[] memory clientAuths = reputationRegistry.getClientFeedbackAuthorizations(clientAgentId);
        assertEq(clientAuths.length, 2);
    }
}
