import { ethers } from 'ethers';
import { config } from '../common/config';
import Web3 from 'web3';
import { ESTIMATE_GAS_BYTECODE } from '../common/constants';
import { EstimateGas__factory } from '../types';

const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

const web3Provider = new Web3(config.rpcUrl);
// extend web3's eth_call allowing state overrides
web3Provider.extend({
  methods: [
    {
      name: 'ethCallWithStateOverride',
      call: 'eth_call',
      params: 3,
    },
  ],
});

export const estimateGas = async (
  estimateGasAddress: string,
  targetTxn: ethers.PopulatedTransaction,
  stateOverrides: any = undefined
) => {
  const estimateGasContract = EstimateGas__factory.connect(
    estimateGasAddress,
    provider
  );

  const txn = await estimateGasContract.populateTransaction.estimateGasForTxn(
    targetTxn.to ?? '',
    targetTxn.value ?? 0,
    targetTxn.data ?? ''
  );

  const stateOverride = {
    [estimateGasAddress]: {
      code: ESTIMATE_GAS_BYTECODE,
    },
  };

  // @ts-ignore
  const estimateGas = await web3Provider.ethCallWithStateOverride(
    txn,
    'latest',
    stateOverride
  );
  const { gasUsed } = estimateGasContract.interface.decodeFunctionResult(
    'estimateGasForTxn',
    estimateGas
  );
  console.log('🚀 ~ file: estimateGas.ts:49 ~ gasUsed', gasUsed.toString());

  const gasUsedPlusBaseTxnGas = gasUsed.add(20_000);
  console.log(
    '🚀 ~ file: estimateGas.ts:67 ~ gasUsedPlusBaseTxnGas',
    gasUsedPlusBaseTxnGas.toString()
  );
};
