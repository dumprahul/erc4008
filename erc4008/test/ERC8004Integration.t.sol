// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {ValidationRegistry} from "../src/ValidationRegistry.sol";

/**
 * @title ERC8004IntegrationTest
 * @dev Integration tests for the complete ERC-8004 Trustless Agents system
 */
contract ERC8004IntegrationTest is Test {
    IdentityRegistry public identityRegistry;
    ReputationRegistry public reputationRegistry;
    ValidationRegistry public validationRegistry;
    
    // Test agents
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");
    address public david = makeAddr("david");
    
    string public aliceDomain = "alice.example.com";
    string public bobDomain = "bob.example.com";
    string public charlieDomain = "charlie.example.com";
    string public davidDomain = "david.example.com";
    
    uint256 public aliceAgentId;
    uint256 public bobAgentId;
    uint256 public charlieAgentId;
    uint256 public davidAgentId;

    function setUp() public {
        // Deploy all registries
        identityRegistry = new IdentityRegistry();
        reputationRegistry = new ReputationRegistry();
        validationRegistry = new ValidationRegistry();
        
        // Register agents
        vm.prank(alice);
        aliceAgentId = identityRegistry.registerAgent(aliceDomain, alice);
        
        vm.prank(bob);
        bobAgentId = identityRegistry.registerAgent(bobDomain, bob);
        
        vm.prank(charlie);
        charlieAgentId = identityRegistry.registerAgent(charlieDomain, charlie);
        
        vm.prank(david);
        davidAgentId = identityRegistry.registerAgent(davidDomain, david);
        
        console.log("Setup completed with 4 registered agents");
    }

    function test_CompleteWorkflow() public {
        console.log("Testing complete ERC-8004 workflow...");
        
        // 1. Agent Registration (already done in setUp)
        assertEq(identityRegistry.getTotalAgents(), 4);
        console.log("Agent registration completed");
        
        // 2. Feedback Authorization
        bytes32 feedbackAuthId = reputationRegistry.authorizeFeedback(aliceAgentId, bobAgentId);
        assertTrue(reputationRegistry.isFeedbackAuthorized(feedbackAuthId));
        console.log("Feedback authorization completed");
        
        // 3. Validation Request
        bytes32 dataHash = keccak256("test task data");
        bytes32 validationRequestId = validationRegistry.requestValidation(charlieAgentId, bobAgentId, dataHash);
        
        (uint256 validatorId, uint256 serverId, bytes32 hash, bool isPending, uint256 response) = 
            validationRegistry.getValidationRequest(validationRequestId);
        
        assertEq(validatorId, charlieAgentId);
        assertEq(serverId, bobAgentId);
        assertEq(hash, dataHash);
        assertTrue(isPending);
        assertEq(response, 0);
        console.log("Validation request completed");
        
        // 4. Agent Resolution
        (uint256 id, string memory domain, address agentAddress) = identityRegistry.resolveByDomain(aliceDomain);
        assertEq(id, aliceAgentId);
        assertEq(domain, aliceDomain);
        assertEq(agentAddress, alice);
        console.log("Agent resolution completed");
        
        console.log("Complete workflow test passed!");
    }

    function test_MultiAgentFeedbackSystem() public {
        console.log("Testing multi-agent feedback system...");
        
        // Alice provides feedback for Bob and Charlie
        bytes32 aliceBobAuth = reputationRegistry.authorizeFeedback(aliceAgentId, bobAgentId);
        bytes32 aliceCharlieAuth = reputationRegistry.authorizeFeedback(aliceAgentId, charlieAgentId);
        
        // David provides feedback for Bob
        bytes32 davidBobAuth = reputationRegistry.authorizeFeedback(davidAgentId, bobAgentId);
        
        // Verify all authorizations
        assertTrue(reputationRegistry.isFeedbackAuthorized(aliceBobAuth));
        assertTrue(reputationRegistry.isFeedbackAuthorized(aliceCharlieAuth));
        assertTrue(reputationRegistry.isFeedbackAuthorized(davidBobAuth));
        
        // Check Bob's feedback authorizations
        bytes32[] memory bobAuths = reputationRegistry.getServerFeedbackAuthorizations(bobAgentId);
        assertEq(bobAuths.length, 2);
        
        // Check Alice's feedback authorizations
        bytes32[] memory aliceAuths = reputationRegistry.getClientFeedbackAuthorizations(aliceAgentId);
        assertEq(aliceAuths.length, 2);
        
        console.log("Multi-agent feedback system test passed!");
    }

    function test_ValidationWorkflow() public {
        console.log("Testing validation workflow...");
        
        // Multiple validators for same server
        bytes32 dataHash1 = keccak256("task 1 data");
        bytes32 dataHash2 = keccak256("task 2 data");
        
        bytes32 request1 = validationRegistry.requestValidation(charlieAgentId, bobAgentId, dataHash1);
        bytes32 request2 = validationRegistry.requestValidation(davidAgentId, bobAgentId, dataHash2);
        
        // Check pending validations for Charlie
        bytes32[] memory charliePending = validationRegistry.getPendingValidations(charlieAgentId);
        assertEq(charliePending.length, 1);
        assertEq(charliePending[0], request1);
        
        // Check Bob's validation requests
        bytes32[] memory bobValidations = validationRegistry.getServerValidations(bobAgentId);
        assertEq(bobValidations.length, 2);
        
        console.log("Validation workflow test passed!");
    }

    function test_AgentUpdateWorkflow() public {
        console.log("Testing agent update workflow...");
        
        // Alice updates her domain
        string memory newAliceDomain = "newalice.example.com";
        vm.prank(alice);
        bool success = identityRegistry.updateAgent(aliceAgentId, newAliceDomain, address(0));
        assertTrue(success);
        
        // Verify domain update
        (uint256 id, string memory domain, address agentAddress) = identityRegistry.resolveByDomain(newAliceDomain);
        assertEq(id, aliceAgentId);
        assertEq(domain, newAliceDomain);
        assertEq(agentAddress, alice);
        
        // Old domain should not resolve
        vm.expectRevert("IdentityRegistry: Agent not found for domain");
        identityRegistry.resolveByDomain(aliceDomain);
        
        console.log("Agent update workflow test passed!");
    }

    function test_CrossRegistryIntegration() public {
        console.log("Testing cross-registry integration...");
        
        // 1. Register new agent
        address eve = makeAddr("eve");
        string memory eveDomain = "eve.example.com";
        
        vm.prank(eve);
        uint256 eveAgentId = identityRegistry.registerAgent(eveDomain, eve);
        
        // 2. Authorize feedback for new agent
        bytes32 eveBobAuth = reputationRegistry.authorizeFeedback(eveAgentId, bobAgentId);
        assertTrue(reputationRegistry.isFeedbackAuthorized(eveBobAuth));
        
        // 3. Request validation for new agent
        bytes32 taskDataHash = keccak256("eve task data");
        bytes32 validationRequest = validationRegistry.requestValidation(charlieAgentId, eveAgentId, taskDataHash);
        
        (uint256 validatorId, uint256 serverId, bytes32 hash, bool isPending, uint256 response) = 
            validationRegistry.getValidationRequest(validationRequest);
        
        assertEq(validatorId, charlieAgentId);
        assertEq(serverId, eveAgentId);
        assertEq(hash, taskDataHash);
        assertTrue(isPending);
        
        console.log("Cross-registry integration test passed!");
    }

    function test_SystemStats() public {
        console.log("Testing system statistics...");
        
        // Identity Registry stats
        assertEq(identityRegistry.getTotalAgents(), 4);
        assertEq(identityRegistry.getNextAgentId(), 5);
        
        // Reputation Registry stats
        assertEq(reputationRegistry.getTotalAuthorizations(), 0);
        
        // Add some feedback authorizations
        reputationRegistry.authorizeFeedback(aliceAgentId, bobAgentId);
        reputationRegistry.authorizeFeedback(charlieAgentId, bobAgentId);
        
        assertEq(reputationRegistry.getTotalAuthorizations(), 2);
        assertEq(reputationRegistry.getClientAuthorizationCount(aliceAgentId), 1);
        assertEq(reputationRegistry.getServerAuthorizationCount(bobAgentId), 2);
        
        // Validation Registry stats
        assertEq(validationRegistry.getTotalRequests(), 0);
        
        // Add some validation requests
        validationRegistry.requestValidation(charlieAgentId, bobAgentId, keccak256("data1"));
        validationRegistry.requestValidation(davidAgentId, aliceAgentId, keccak256("data2"));
        
        assertEq(validationRegistry.getTotalRequests(), 2);
        
        console.log("System statistics test passed!");
    }

    function test_ErrorHandling() public {
        console.log("Testing error handling...");
        
        // Test invalid agent operations
        vm.expectRevert("IdentityRegistry: Agent does not exist");
        identityRegistry.getAgent(999);
        
        vm.expectRevert("ReputationRegistry: Invalid client agent ID");
        reputationRegistry.authorizeFeedback(0, bobAgentId);
        
        vm.expectRevert("ValidationRegistry: Invalid validator agent ID");
        validationRegistry.requestValidation(0, bobAgentId, keccak256("data"));
        
        console.log("Error handling test passed!");
    }

    function test_GasUsage() public {
        console.log("Testing gas usage...");
        
        uint256 gasStart = gasleft();
        
        // Register agent with new address
        address testAgent = makeAddr("testAgent");
        vm.prank(testAgent);
        identityRegistry.registerAgent("test.example.com", testAgent);
        
        uint256 gasUsed = gasStart - gasleft();
        console.log("Agent registration gas used:", gasUsed);
        
        gasStart = gasleft();
        
        // Authorize feedback
        reputationRegistry.authorizeFeedback(aliceAgentId, bobAgentId);
        
        gasUsed = gasStart - gasleft();
        console.log("Feedback authorization gas used:", gasUsed);
        
        gasStart = gasleft();
        
        // Request validation
        validationRegistry.requestValidation(charlieAgentId, bobAgentId, keccak256("test data"));
        
        gasUsed = gasStart - gasleft();
        console.log("Validation request gas used:", gasUsed);
        
        console.log("Gas usage test completed!");
    }
}
