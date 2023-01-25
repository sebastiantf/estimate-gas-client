import { ethers } from 'ethers';
import { config } from './common/config';
import { MULTISEND_ADDRESSES } from './common/constants';
import {
  calculateAllowanceStorageKeyFromAccessList,
  calculateAllowanceStorageKeyFromSlot,
  getAllowanceStateDiff,
} from './lib/allowance';

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  const tokenAddress = '0xe8B3dFEE339ce4954A7300E8d421A4BA2F51e7b0';
  const fromAddress = '0xFB5b21C1d090D40A29cd7BB9BbE3eBA9e8f06b91';
  const toAddress = MULTISEND_ADDRESSES[(await provider.getNetwork()).chainId];

  const allowanceSlot = 2; // Allowance slot (differs from contract to contract)
  const storageKeyFromSlot = calculateAllowanceStorageKeyFromSlot(
    fromAddress,
    toAddress,
    allowanceSlot
  );
  console.log(
    '🚀 ~ file: allowance.ts:21 ~ storageKeyFromSlot',
    storageKeyFromSlot
  );

  const storageKeyFromAccessList =
    await calculateAllowanceStorageKeyFromAccessList(
      fromAddress,
      toAddress,
      tokenAddress
    );
  console.log(
    '🚀 ~ file: allowance.ts:27 ~ storageKeyFromAccessList',
    storageKeyFromAccessList
  );

  await getAllowanceStateDiff(
    tokenAddress,
    fromAddress,
    toAddress,
    storageKeyFromAccessList
  );
})();
