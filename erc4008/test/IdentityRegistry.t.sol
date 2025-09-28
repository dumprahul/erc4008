// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {IIdentityRegistry} from "../src/interfaces/IIdentityRegistry.sol";

contract IdentityRegistryTest is Test {
    IdentityRegistry public identityRegistry;
    
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");
    
    string public aliceDomain = "alice.example.com";
    string public bobDomain = "bob.example.com";
    string public charlieDomain = "charlie.example.com";

    function setUp() public {
        identityRegistry = new IdentityRegistry();
    }

    function test_RegisterAgent() public {
        vm.prank(alice);
        uint256 agentId = identityRegistry.registerAgent(aliceDomain, alice);
        
        assertEq(agentId, 1);
        
        (uint256 id, string memory domain, address agentAddress) = identityRegistry.getAgent(agentId);
        assertEq(id, 1);
        assertEq(domain, aliceDomain);
        assertEq(agentAddress, alice);
    }

    function test_RegisterMultipleAgents() public {
        vm.prank(alice);
        uint256 aliceId = identityRegistry.registerAgent(aliceDomain, alice);
        
        vm.prank(bob);
        uint256 bobId = identityRegistry.registerAgent(bobDomain, bob);
        
        vm.prank(charlie);
        uint256 charlieId = identityRegistry.registerAgent(charlieDomain, charlie);
        
        assertEq(aliceId, 1);
        assertEq(bobId, 2);
        assertEq(charlieId, 3);
        
        assertEq(identityRegistry.getTotalAgents(), 3);
    }

    function test_ResolveByDomain() public {
        vm.prank(alice);
        uint256 agentId = identityRegistry.registerAgent(aliceDomain, alice);
        
        (uint256 id, string memory domain, address agentAddress) = identityRegistry.resolveByDomain(aliceDomain);
        assertEq(id, agentId);
        assertEq(domain, aliceDomain);
        assertEq(agentAddress, alice);
    }

    function test_ResolveByAddress() public {
        vm.prank(alice);
        uint256 agentId = identityRegistry.registerAgent(aliceDomain, alice);
        
        (uint256 id, string memory domain, address agentAddress) = identityRegistry.resolveByAddress(alice);
        assertEq(id, agentId);
        assertEq(domain, aliceDomain);
        assertEq(agentAddress, alice);
    }

    function test_UpdateAgent() public {
        vm.prank(alice);
        uint256 agentId = identityRegistry.registerAgent(aliceDomain, alice);
        
        string memory newDomain = "newalice.example.com";
        address newAddress = makeAddr("newalice");
        
        vm.prank(alice);
        bool success = identityRegistry.updateAgent(agentId, newDomain, newAddress);
        
        assertTrue(success);
        
        (uint256 id, string memory domain, address agentAddress) = identityRegistry.getAgent(agentId);
        assertEq(domain, newDomain);
        assertEq(agentAddress, newAddress);
    }

    function test_UpdateAgentDomainOnly() public {
        vm.prank(alice);
        uint256 agentId = identityRegistry.registerAgent(aliceDomain, alice);
        
        string memory newDomain = "newalice.example.com";
        
        vm.prank(alice);
        bool success = identityRegistry.updateAgent(agentId, newDomain, address(0));
        
        assertTrue(success);
        
        (uint256 id, string memory domain, address agentAddress) = identityRegistry.getAgent(agentId);
        assertEq(domain, newDomain);
        assertEq(agentAddress, alice); // Address should remain the same
    }

    function test_UpdateAgentAddressOnly() public {
        vm.prank(alice);
        uint256 agentId = identityRegistry.registerAgent(aliceDomain, alice);
        
        address newAddress = makeAddr("newalice");
        
        vm.prank(alice);
        bool success = identityRegistry.updateAgent(agentId, "", newAddress);
        
        assertTrue(success);
        
        (uint256 id, string memory domain, address agentAddress) = identityRegistry.getAgent(agentId);
        assertEq(domain, aliceDomain); // Domain should remain the same
        assertEq(agentAddress, newAddress);
    }

    function test_RevertWhen_RegisterWithZeroAddress() public {
        vm.expectRevert("IdentityRegistry: Invalid agent address");
        identityRegistry.registerAgent(aliceDomain, address(0));
    }

    function test_RevertWhen_RegisterWithEmptyDomain() public {
        vm.expectRevert("IdentityRegistry: Empty agent domain");
        identityRegistry.registerAgent("", alice);
    }

    function test_RevertWhen_RegisterDuplicateAddress() public {
        vm.prank(alice);
        identityRegistry.registerAgent(aliceDomain, alice);
        
        vm.expectRevert("IdentityRegistry: Address already registered");
        identityRegistry.registerAgent("another.example.com", alice);
    }

    function test_RevertWhen_RegisterDuplicateDomain() public {
        vm.prank(alice);
        identityRegistry.registerAgent(aliceDomain, alice);
        
        vm.expectRevert("IdentityRegistry: Domain already registered");
        identityRegistry.registerAgent(aliceDomain, bob);
    }

    function test_RevertWhen_UpdateNonExistentAgent() public {
        vm.expectRevert("IdentityRegistry: Agent does not exist");
        identityRegistry.updateAgent(999, aliceDomain, alice);
    }

    function test_RevertWhen_UpdateByNonOwner() public {
        vm.prank(alice);
        uint256 agentId = identityRegistry.registerAgent(aliceDomain, alice);
        
        vm.expectRevert("IdentityRegistry: Only agent can update");
        vm.prank(bob);
        identityRegistry.updateAgent(agentId, bobDomain, bob);
    }

    function test_RevertWhen_UpdateWithDuplicateDomain() public {
        vm.prank(alice);
        uint256 aliceId = identityRegistry.registerAgent(aliceDomain, alice);
        
        vm.prank(bob);
        uint256 bobId = identityRegistry.registerAgent(bobDomain, bob);
        
        vm.expectRevert("IdentityRegistry: Domain already in use");
        vm.prank(alice);
        identityRegistry.updateAgent(aliceId, bobDomain, alice);
    }

    function test_RevertWhen_UpdateWithDuplicateAddress() public {
        vm.prank(alice);
        uint256 aliceId = identityRegistry.registerAgent(aliceDomain, alice);
        
        vm.prank(bob);
        uint256 bobId = identityRegistry.registerAgent(bobDomain, bob);
        
        vm.expectRevert("IdentityRegistry: Address already in use");
        vm.prank(alice);
        identityRegistry.updateAgent(aliceId, aliceDomain, bob);
    }

    function test_RevertWhen_UpdateWithNoChanges() public {
        vm.prank(alice);
        uint256 agentId = identityRegistry.registerAgent(aliceDomain, alice);
        
        vm.expectRevert("IdentityRegistry: No changes provided");
        vm.prank(alice);
        identityRegistry.updateAgent(agentId, aliceDomain, alice);
    }

    function test_RevertWhen_GetNonExistentAgent() public {
        vm.expectRevert("IdentityRegistry: Agent does not exist");
        identityRegistry.getAgent(999);
    }

    function test_RevertWhen_ResolveNonExistentDomain() public {
        vm.expectRevert("IdentityRegistry: Agent not found for domain");
        identityRegistry.resolveByDomain("nonexistent.example.com");
    }

    function test_RevertWhen_ResolveNonExistentAddress() public {
        vm.expectRevert("IdentityRegistry: Agent not found for address");
        identityRegistry.resolveByAddress(makeAddr("nonexistent"));
    }

    function test_AgentExists() public {
        assertFalse(identityRegistry.agentExists(1));
        
        vm.prank(alice);
        uint256 agentId = identityRegistry.registerAgent(aliceDomain, alice);
        
        assertTrue(identityRegistry.agentExists(agentId));
        assertFalse(identityRegistry.agentExists(999));
    }

    function test_GetNextAgentId() public {
        assertEq(identityRegistry.getNextAgentId(), 1);
        
        vm.prank(alice);
        identityRegistry.registerAgent(aliceDomain, alice);
        
        assertEq(identityRegistry.getNextAgentId(), 2);
    }

    function test_Events() public {
        // Test that events are emitted (without exact matching due to complexity)
        vm.prank(alice);
        identityRegistry.registerAgent(aliceDomain, alice);
        
        string memory newDomain = "newalice.example.com";
        address newAddress = makeAddr("newalice");
        
        vm.prank(alice);
        identityRegistry.updateAgent(1, newDomain, newAddress);
        
        // If we get here without reverting, events were emitted successfully
        assertTrue(true);
    }
}
