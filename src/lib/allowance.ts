import { ethers } from 'ethers';
import { ERC20__factory } from '../types';
import { config } from '../common/config';
import { createAccessList } from './accessList';
import { formatEther } from '@ethersproject/units';

export const populateAllowanceTxn = async (
  tokenAddress: string,
  owner: string,
  spender: string
) => {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

  const tokenContract = ERC20__factory.connect(tokenAddress, provider);

  return await tokenContract.populateTransaction.allowance(owner, spender);
};

export const calculateAllowanceStorageKeyFromAccessList = async (
  fromAddress: string,
  toAddress: string,
  tokenAddress: string
) => {
  const accessList = await createAccessList(
    await populateAllowanceTxn(tokenAddress, fromAddress, toAddress)
  );

  const [
    {
      storageKeys: [storageKey],
    },
  ] = accessList;

  return storageKey;
};

export const calculateAllowanceStorageKeyFromSlot = (
  fromAddress: string,
  toAddress: string,
  allowanceSlot: number
) => {
  // Nested mappings
  // https://ethereum.stackexchange.com/questions/102037/storage-limit-of-2-level-mapping/102220
  const temp = ethers.utils.solidityKeccak256(
    ['uint256', 'uint256'],
    [fromAddress, allowanceSlot]
  );
  const index = ethers.utils.solidityKeccak256(
    ['uint256', 'uint256'],
    [toAddress, temp]
  );
  console.log('🚀 ~ file: allowance.ts:39 ~ index', index);

  return index;
};

export const getAllowanceStateDiff = async (
  tokenAddress: string,
  fromAddress: string,
  toAddress: string,
  storageKey: string
) => {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

  const tokenContract = ERC20__factory.connect(tokenAddress, provider);

  const { data } = await tokenContract.populateTransaction.allowance(
    fromAddress,
    toAddress
  );

  const callParams = [
    {
      from: fromAddress,
      to: tokenAddress,
      data,
    },
    'latest',
  ];

  const stateDiff = {
    [tokenAddress]: {
      stateDiff: {
        [storageKey]: ethers.constants.MaxUint256.toHexString(),
      },
    },
  };

  const abiCoder = new ethers.utils.AbiCoder();

  // Call with no state overrides
  const call1 = await provider.send('eth_call', callParams);
  const decodedCall1 = abiCoder.decode(['uint256'], call1);

  // Call with no state overrides
  const call2 = await provider.send('eth_call', [...callParams, stateDiff]);
  const decodedCall2 = abiCoder.decode(['uint256'], call2);

  console.log(
    'Allowance of from -> to without stateDiff',
    formatEther(decodedCall1.toString())
  );
  console.log(
    'Allowance of from -> to *with* stateDiff ',
    formatEther(decodedCall2.toString())
  );

  return stateDiff;
};
