import { Wallet, ethers } from 'ethers';
import { estimateGas } from './lib/estimateGas';
import { Multisend__factory } from './types';
import { config } from './common/config';
import { MULTISEND_ADDRESSES } from './common/constants';
import { parseEther } from 'ethers/lib/utils';
import { getAllowanceStateDiff } from './lib/allowance';

(async function () {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);

  const senderAddress = '0xFB5b21C1d090D40A29cd7BB9BbE3eBA9e8f06b91';
  const multisendAddress =
    MULTISEND_ADDRESSES[(await provider.getNetwork()).chainId];
  const multisendContract = Multisend__factory.connect(
    multisendAddress,
    provider
  );

  const tokenAddress = '0xe8B3dFEE339ce4954A7300E8d421A4BA2F51e7b0';
  const recipients = [
    Wallet.createRandom().address,
    Wallet.createRandom().address,
    Wallet.createRandom().address,
  ];
  const amounts = [parseEther('10'), parseEther('14'), parseEther('20')];

  const targetTxn = await multisendContract.populateTransaction.multisendToken(
    tokenAddress,
    recipients,
    amounts
  );
  try {
    const estimateActualMultisend = await multisendContract
      .connect(signer)
      .estimateGas.multisendToken(tokenAddress, recipients, amounts);
    console.log(
      '🚀 ~ file: estimateGas.ts:32 ~ estimateActualMultisend',
      estimateActualMultisend.toString()
    );
  } catch {
    console.log('⚠️ estimateActualMultisend failed. Try approving the token onchain');
  }

  const allowanceStateDiff = await getAllowanceStateDiff(
    tokenAddress,
    senderAddress,
    multisendAddress,
    2
  );

  await estimateGas(senderAddress, targetTxn, allowanceStateDiff);
})();
