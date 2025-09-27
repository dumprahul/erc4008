export const IdentityRegistryAddress = '0xb4641C1E1e01917292cCeC8DA99517142f547C8E';
export const ReputationRegistryAddress = '0xe3850deDED5AD7eC5177edA0B3E1E462AE72008B';
export const ValidationRegistryAddress = '0xF8F218aA4b0A0C18Ec22Dc97E68095e79cDCefB3';

// Import JSON files with type assertion
import IdentityRegistry from './IdentityRegistry.json' with { type: "json" };
import ReputationRegistry from './ReputationRegistry.json' with { type: "json" };
import ValidationRegistry from './ValidationRegistry.json' with { type: "json" };

export const IdentityRegistryABI = IdentityRegistry.abi;
export const ReputationRegistryABI = ReputationRegistry.abi;
export const ValidationRegistryABI = ValidationRegistry.abi;
export const rpcUrl = 'https://sepolia.infura.io/v3/866b11e8b12045fd92b01f6133381b53'