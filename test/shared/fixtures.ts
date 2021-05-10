import { Wallet, providers } from 'ethers'
import { waffle } from 'hardhat'

import { ORT, ORTMinter } from '../../typechain'

import ORTAbi from '../../artifacts/contracts/ORT.sol/ORT.json'
import ORTMinterAbi from '../../artifacts/contracts/test/ORTMinter.sol/ORTMinter.json'

const overrides = {
  gasLimit: 9500000
}

interface V2Fixture {
  ort: ORT
  ortMinter: ORTMinter
}

export async function v2Fixture([wallet]: Wallet[], provider: providers.Web3Provider): Promise<V2Fixture> {
  // deploy tokens
  const ort = await waffle.deployContract(wallet, ORTAbi, [], overrides) as unknown as ORT

  // ort minter
  const ortMinter = await waffle.deployContract(wallet, ORTMinterAbi, [], overrides) as unknown as ORTMinter
  await ortMinter.setORTAddress(ort.address);

  return {
    ort,
    ortMinter
  }
}
