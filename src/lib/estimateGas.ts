import { BigNumber, ethers } from 'ethers';
import { config } from '../common/config';
import { EstimateGas__factory } from '../types';

const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

export const estimateGas = async (
  estimateGasAddress: string,
  targetTxn: ethers.PopulatedTransaction,
  stateOverrides: any = undefined
): Promise<BigNumber> => {
  const estimateGasContract = EstimateGas__factory.connect(
    estimateGasAddress,
    provider
  );

  const txn = await estimateGasContract.populateTransaction.estimateGasForTxn(
    targetTxn.to ?? '',
    targetTxn.value ?? 0,
    targetTxn.data ?? ''
  );
  const txnParams = [
    {
      from: txn.from,
      to: txn.to,
      data: txn.data,
    },
    'latest',
  ];

  const stateOverride = {
    [estimateGasAddress]: {
      code: await getEstimateGasBytecode(),
    },
    ...stateOverrides,
  };

  const estimateGas = await provider.send('eth_call', [
    ...txnParams,
    stateOverride,
  ]);

  const { gasUsed } = estimateGasContract.interface.decodeFunctionResult(
    'estimateGasForTxn',
    estimateGas
  );
  console.log('🚀 ~ file: estimateGas.ts:49 ~ gasUsed', gasUsed.toString());

  const gasUsedPlusBaseTxnGas = gasUsed.add(21_000);
  console.log(
    '🚀 ~ file: estimateGas.ts:67 ~ gasUsedPlusBaseTxnGas',
    gasUsedPlusBaseTxnGas.toString()
  );

  return gasUsedPlusBaseTxnGas;
};

export const getEstimateGasBytecode = async () => {
  const deployTransaction = new EstimateGas__factory().getDeployTransaction();
  const callParams = [
    {
      data: deployTransaction.data,
    },
    'latest',
  ];
  const deployedBytecode = await provider.send('eth_call', callParams);
  return deployedBytecode;
};
