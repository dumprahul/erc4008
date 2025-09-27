import { ethers } from 'ethers';

export async function createDemoPaymentPayload(from, to, value, verifyingContract) {
  const now = Math.floor(Date.now() / 1000);
  const nonceRaw = Math.random().toString(36).slice(2);
  const nonce = ethers.id(nonceRaw); // bytes32
  const payload = {
    from,
    to,
    value,
    validAfter: now - 60,
    validBefore: now + 300,
    nonce: nonce,
    verifyingContract,
    chainId: 80002
  };

  const domain = {
    name: 'USDC',
    version: '2',
    chainId: payload.chainId,
    verifyingContract: verifyingContract
  };

  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' }
    ]
  };

  const message = {
    from: payload.from,
    to: payload.to,
    value: payload.value,
    validAfter: payload.validAfter,
    validBefore: payload.validBefore,
    nonce: payload.nonce
  };

  const privateKey = process.env.PRIVATE_KEY || '';
  if (!privateKey) throw new Error('PRIVATE_KEY required for demo payment generation');
  const wallet = new ethers.Wallet(privateKey);

  const verifyingContractAddress = ethers.isAddress(verifyingContract) ? verifyingContract : ethers.ZeroAddress;
  domain.verifyingContract = verifyingContractAddress;
  payload.verifyingContract = verifyingContractAddress;

  const signature = await wallet.signTypedData(domain, types, message);
  payload.signature = signature;
  payload._rawNonce = nonceRaw;
  return payload;
}

export function encodePaymentPayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
