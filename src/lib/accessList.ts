import { ethers } from 'ethers';
import { config } from '../common/config';

export const createAccessList = async (txn: ethers.PopulatedTransaction) => {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

  const callParams = [
    {
      from: txn.from,
      to: txn.to,
      data: txn.data,
      gas: '0x55730', // 350000 - constant high enough gas to make it work
    },
    'pending',
  ];

  const { accessList } = await provider.send(
    'eth_createAccessList',
    callParams
  );
  /* console.log(
    '🚀 ~ file: accessList.ts:17 ~ createAccessList ~ accessList',
    accessList
  ); */

  return accessList;
};
