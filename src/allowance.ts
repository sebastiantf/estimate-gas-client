import { ethers } from 'ethers';
import { config } from './common/config';
import { ERC20__factory } from './types';
import { MULTISEND_ADDRESSES } from './common/constants';

(async function () {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

  const tokenAddress = '0xe8B3dFEE339ce4954A7300E8d421A4BA2F51e7b0';
  const tokenContract = ERC20__factory.connect(tokenAddress, provider);

  const fromAddr = '0xFB5b21C1d090D40A29cd7BB9BbE3eBA9e8f06b91';
  const toAddr = MULTISEND_ADDRESSES[(await provider.getNetwork()).chainId];
  const slot = 2; // Allowance slot (differs from contract to contract)

  // Nested mappings
  // https://ethereum.stackexchange.com/questions/102037/storage-limit-of-2-level-mapping/102220
  const temp = ethers.utils.solidityKeccak256(
    ['uint256', 'uint256'],
    [fromAddr, slot]
  );
  const index = ethers.utils.solidityKeccak256(
    ['uint256', 'uint256'],
    [toAddr, temp]
  );

  const { data } = await tokenContract.populateTransaction.allowance(
    fromAddr,
    toAddr
  );

  const callParams = [
    {
      from: fromAddr,
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
})();
