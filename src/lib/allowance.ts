import { ethers } from 'ethers';
import { ERC20__factory } from '../types';
import { config } from '../common/config';

export const getAllowanceStateDiff = async (
  tokenAddress: string,
  fromAddress: string,
  toAddress: string,
  allowanceSlot: number
) => {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

  const tokenContract = ERC20__factory.connect(tokenAddress, provider);

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
        [index]: ethers.constants.MaxUint256.toHexString(),
      },
    },
  };

  // Call with no state overrides
  const call1 = await provider.send('eth_call', callParams);

  // Call with no state overrides
  const call2 = await provider.send('eth_call', [...callParams, stateDiff]);

  console.log('Allowance of from -> to without stateDiff', call1);
  console.log('Allowance of from -> to *with* stateDiff ', call2);

  return stateDiff;
};
