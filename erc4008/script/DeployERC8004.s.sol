// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {ValidationRegistry} from "../src/ValidationRegistry.sol";

/**
 * @title DeployERC8004
 * @dev Deployment script for ERC-8004 Trustless Agents registries
 */
contract DeployERC8004 is Script {
    IdentityRegistry public identityRegistry;
    ReputationRegistry public reputationRegistry;
    ValidationRegistry public validationRegistry;

    function run() public {
        vm.startBroadcast();

        console.log("Deploying ERC-8004 Trustless Agents Registries...");
        console.log("Deployer:", msg.sender);
        console.log("Block number:", block.number);
        console.log("Block timestamp:", block.timestamp);

        // Deploy Identity Registry
        console.log("\nDeploying Identity Registry...");
        identityRegistry = new IdentityRegistry();
        console.log("Identity Registry deployed at:", address(identityRegistry));

        // Deploy Reputation Registry
        console.log("\nDeploying Reputation Registry...");
        reputationRegistry = new ReputationRegistry();
        console.log("Reputation Registry deployed at:", address(reputationRegistry));

        // Deploy Validation Registry
        console.log("\nDeploying Validation Registry...");
        validationRegistry = new ValidationRegistry();
        console.log("Validation Registry deployed at:", address(validationRegistry));

        console.log("\n=== Deployment Summary ===");
        console.log("Identity Registry:", address(identityRegistry));
        console.log("Reputation Registry:", address(reputationRegistry));
        console.log("Validation Registry:", address(validationRegistry));
        console.log("\nERC-8004 Trustless Agents deployment completed successfully!");

        vm.stopBroadcast();
    }

    /**
     * @dev Deploy and verify contracts on a specific network
     * @param rpcUrl The RPC URL for the network
     * @param privateKey The private key for deployment
     */
    function deployToNetwork(string memory rpcUrl, uint256 privateKey) public {
        vm.startBroadcast(privateKey);

        console.log("Deploying to network:", rpcUrl);
        console.log("Deployer address:", vm.addr(privateKey));

        // Deploy all registries
        identityRegistry = new IdentityRegistry();
        reputationRegistry = new ReputationRegistry();
        validationRegistry = new ValidationRegistry();

        console.log("Deployment completed on network:", rpcUrl);
        console.log("Identity Registry:", address(identityRegistry));
        console.log("Reputation Registry:", address(reputationRegistry));
        console.log("Validation Registry:", address(validationRegistry));

        vm.stopBroadcast();
    }
}
