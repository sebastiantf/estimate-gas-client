# estimate-gas-client

This repo implements the requirement of having to estimate gas for a txn, that is dependent on a particular blockchain state, without really having to setup that state onchain.

An example usecase is estimating the gas usage of a [Multisend](https://etherscan.io/address/0x22Bc0693163eC3CeE5DeD3c2EE55ddbCb2bA9bbe) txn, without requiring the corresponding token allowance being set.

We [make use of](https://github.com/sebastiantf/estimate-gas-client/blob/d3796f33c80fe6d81e42c0b45babec2cc7b06bad/src/lib/estimateGas.ts#L41) Geth's State Override input for [`eth_call`](https://geth.ethereum.org/docs/interacting-with-geth/rpc/ns-eth), to **set the contract code of the caller to the `EstimateGas` contract** given below, and also **set the token allowance to max**. Thus the multisend txn and the gas estimation would execute successfully.

We also make use of [`eth_createAccessList`](https://geth.ethereum.org/docs/interacting-with-geth/rpc/ns-eth#eth-createaccesslist) to correctly determine the exact storage slot that needs to be overridden to simulate the token allowance.

Combination of `eth_call`'s state override and `eth_createAccessList` is a really powerful technique for applications such as these.

A diff of `eth_estimateGas` and this method is also logged towards the end

## EstimateGas.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

contract EstimateGas {
    function estimateGasForTxn(
        address target,
        uint256 value,
        bytes calldata cdata
    ) external returns (uint256 gasUsed) {
        uint256 gasBefore = gasleft();
        (bool success, ) = target.call{ value: value }(cdata);
        require(success);
        gasUsed = gasBefore - gasleft();
    }
}
```

```hex
608060405234801561001057600080fd5b506004361061002b5760003560e01c80634cd47f8314610030575b600080fd5b61004a60048036038101906100459190610178565b610060565b6040516100579190610239565b60405180910390f35b6000805a905060008673ffffffffffffffffffffffffffffffffffffffff16868686604051610090929190610220565b60006040518083038185875af1925050503d80600081146100cd576040519150601f19603f3d011682016040523d82523d6000602084013e6100d2565b606091505b50509050806100e057600080fd5b5a826100ec919061025f565b92505050949350505050565b60008135905061010781610326565b92915050565b60008083601f84011261012357610122610312565b5b8235905067ffffffffffffffff8111156101405761013f61030d565b5b60208301915083600182028301111561015c5761015b610317565b5b9250929050565b6000813590506101728161033d565b92915050565b6000806000806060858703121561019257610191610321565b5b60006101a0878288016100f8565b94505060206101b187828801610163565b935050604085013567ffffffffffffffff8111156101d2576101d161031c565b5b6101de8782880161010d565b925092505092959194509250565b60006101f88385610254565b93506102058385846102cf565b82840190509392505050565b61021a816102c5565b82525050565b600061022d8284866101ec565b91508190509392505050565b600060208201905061024e6000830184610211565b92915050565b600081905092915050565b600061026a826102c5565b9150610275836102c5565b925082821015610288576102876102de565b5b828203905092915050565b600061029e826102a5565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b82818337600083830152505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b61032f81610293565b811461033a57600080fd5b50565b610346816102c5565b811461035157600080fd5b5056fea264697066735822122067f8dd522a7b9b6bb09be2d281ea1447cb4d3ca7a0423faa244de4a91c481e7c64736f6c63430008070033
```

#### Sample outputs

```sh
?????? estimateActualMultisend failed. Try approving the token onchain
Allowance of from -> to without stateDiff 0.0
Allowance of from -> to *with* stateDiff  115792089237316195423570985008687907853269984665640564039457.584007913129639935
???? ~ file: estimateGas.ts:49 ~ gasUsed 124030
???? ~ file: estimateGas.ts:67 ~ gasUsedPlusBaseTxnGas 145030
```

```sh
???? ~ file: estimateGas.ts:32 ~ estimateActualMultisend 93104
Allowance of from -> to without stateDiff 115792089237316195423570985008687907853269984665640564039457.584007913129639935
Allowance of from -> to *with* stateDiff  115792089237316195423570985008687907853269984665640564039457.584007913129639935
???? ~ file: estimateGas.ts:49 ~ gasUsed 73376
???? ~ file: estimateGas.ts:67 ~ gasUsedPlusBaseTxnGas 94376
offsetPerRecipient:  575
offset:  575
???? estimatePlusOffset:  94,951
???? ~ file: index.ts:64 ~ diff1 -1847
???? ~ file: index.ts:64 ~ diff2 -1272
```
