// EIP-3009 signer-parity test: the refactored signTypedDataAuth (decimal-string
// uint256 fields) must produce the exact same signature as the original inline
// BigInt code path. A divergence here would break facilitator verification.
const assert = require('node:assert/strict');
const { createWalletClient, http, keccak256, concat, toHex, pad, hashTypedData } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { base } = require('viem/chains');

const KEY = '0x' + '22'.repeat(32);
const acct = privateKeyToAccount(KEY);
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const domain = { name: 'USD Coin', version: '2', chainId: 8453, verifyingContract: USDC };
const types = { TransferWithAuthorization: [
  { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' },
  { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' },
]};

const fixed = {
  from: acct.address, to: acct.address, value: 0x1234n, validAfter: 0n, validBefore: 1789700000n,
  nonce: keccak256(concat([toHex(123), pad(acct.address)])),
};

(async () => {
  // ORIGINAL path: BigInt fields
  const sigBigInt = await acct.signTypedData({ domain, types, primaryType: 'TransferWithAuthorization', message: fixed });

  // NEW path: decimal-string fields (exactly what signTypedDataAuth now sends)
  const strMsg = { ...fixed, value: String(fixed.value), validAfter: '0', validBefore: fixed.validBefore.toString() };
  const sigStr = await acct.signTypedData({ domain, types, primaryType: 'TransferWithAuthorization', message: strMsg });

  assert.equal(sigStr, sigBigInt, 'string-field signature must equal BigInt-field signature');
  console.log('PASS: signatures byte-identical:', sigBigInt.slice(0, 20) + '...');

  // AND: the hash the Privy adapter will compute (viem hashTypedData over the same
  // string message) must match the BigInt hash — the adapter hashes client-side? No:
  // the HTTP variant sends typedData JSON to Privy (server-side hashing, eth_signTypedData_v4
  // semantics == same encoding for these field types). Verify hash equality for both encodings:
  const h1 = keccak256(concat([toHex(123), pad(acct.address)]));
  const a = { ...fixed, value: h1 };
  const hashBigInt = hashTypedData({ domain, types, primaryType: 'TransferWithAuthorization', message: { ...a, validAfter: 0n, validBefore: 1789700000n } });
  const hashStr = hashTypedData({ domain, types, primaryType: 'TransferWithAuthorization', message: { ...a, validAfter: '0', validBefore: '1789700000' } });
  assert.equal(hashStr, hashBigInt, 'EIP-712 hash must not depend on string vs BigInt encoding');
  console.log('PASS: EIP-712 hash identical across encodings');
  process.exit(0);
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
