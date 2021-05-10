import chai, { expect } from 'chai'
import { constants, utils } from 'ethers'
import { waffle } from 'hardhat'

import { expandTo18Decimals, mineBlocks } from './shared/utilities'
import { v2Fixture } from './shared/fixtures'
import { PERMIT_TYPEHASH, TRANSFER_TYPEHASH, getPermitDigest, getDomainSeparator, sign } from './shared/signatures'

import { ORT, ORTMinter } from '../typechain'

chai.use(waffle.solidity)

const overrides = {
  gasLimit: 9500000
}
const startSupply = expandTo18Decimals(42000000)

describe('ORT', () => {
  const { provider, createFixtureLoader } = waffle;
  const [owner,user] = provider.getWallets()
  const loadFixture = createFixtureLoader([owner], provider)

  let ort: ORT
  let ortMinter: ORTMinter
  beforeEach(async function() {
    const fixture = await loadFixture(v2Fixture)
    ort = fixture.ort
    ortMinter = fixture.ortMinter
  })

  it('Details', async () => {
    expect(await ort.name()).to.eq("OMNI Real Estate Token")
    expect(await ort.symbol()).to.eq("ORT")
    expect(await ort.decimals()).to.eq(18)
    expect(await ort.totalSupply()).to.eq(startSupply)
    expect(await ort.balanceOf(owner.address)).to.eq(startSupply)
  })

  describe('Vault', () => {
    const toMint = expandTo18Decimals(300000)

    it('Initializing vault only possible by owner', async () => {
      await expect(ort.connect(user).initVault(ortMinter.address, overrides)).to.be.revertedWith("AnyswapV3ERC20: FORBIDDEN")
    })
    it('Only possible to init vault once', async () => {
      await ort.initVault(ortMinter.address, overrides)
      await expect(ort.initVault(ortMinter.address, overrides)).to.be.revertedWith("AnyswapV4ERC20: ALREADY_INITIALIZED")
    })
    it('Changing vault, mpc or setting vault is only possible by owner', async () => {
      await expect(ort.connect(user).setVault(ortMinter.address, overrides)).to.be.revertedWith("AnyswapV3ERC20: FORBIDDEN")
      await expect(ort.connect(user).changeVault(ortMinter.address, overrides)).to.be.revertedWith("AnyswapV3ERC20: FORBIDDEN")
      await expect(ort.connect(user).changeMPCOwner(ortMinter.address, overrides)).to.be.revertedWith("AnyswapV3ERC20: FORBIDDEN")
    })
    it('setting vault should have a delay configured', async () => {
      const transaction = await ort.setVault(ortMinter.address, overrides)
      await expect(ortMinter.mintORT(toMint)).to.be.revertedWith("AnyswapV4ERC20: FORBIDDEN")

      expect(await ort.pendingVault()).to.eq(ortMinter.address)
      const blockTimeStamp = (await provider.getBlock(transaction.blockHash)).timestamp
      expect(await ort.delayVault()).to.eq(blockTimeStamp + (24 * 3600))
    })
    it('Changing vault should have a delay configured', async () => {
      const transaction = await ort.changeVault(ortMinter.address, overrides);
      const blockTimeStamp = (await provider.getBlock(transaction.blockHash)).timestamp

      await expect(transaction).to.emit(ort, 'LogChangeVault')
        .withArgs(constants.AddressZero, ortMinter.address, blockTimeStamp + (24 * 3600))

      await expect(ortMinter.mintORT(toMint)).to.be.revertedWith("AnyswapV4ERC20: FORBIDDEN")
      
      expect(await ort.pendingVault()).to.eq(ortMinter.address)
      expect(await ort.delayVault()).to.eq(blockTimeStamp + (24 * 3600))
    })
    it('Changing mpc should have a delay configured', async () => {
      const transaction = await ort.changeMPCOwner(ortMinter.address, overrides);
      const blockTimeStamp = (await provider.getBlock(transaction.blockHash)).timestamp

      await expect(transaction).to.emit(ort, 'LogChangeMPCOwner')
        .withArgs(constants.AddressZero, ortMinter.address, blockTimeStamp + (24 * 3600))

      await expect(ortMinter.mintORT(toMint)).to.be.revertedWith("AnyswapV4ERC20: FORBIDDEN")

      expect(await ort.pendingVault()).to.eq(ortMinter.address)
      expect(await ort.delayVault()).to.eq(blockTimeStamp + (24 * 3600))
    })
  });

  describe('Minting', () => {
    const toMint = expandTo18Decimals(300000)

    it('Only available for configured minters', async () => {
      await expect(ort['mint(uint256)'](toMint, overrides)).to.be.revertedWith("AnyswapV4ERC20: FORBIDDEN")
      await expect(ort['mint(address,uint256)'](owner.address, toMint, overrides)).to.be.revertedWith("AnyswapV4ERC20: FORBIDDEN")
    })
    it('Owner is not a minting contract', async () => {
      expect(await ort.isMinter(owner.address, overrides)).to.eq(false)
    })
    it('ORTMinter is not yet a minting contract', async () => {
      expect(await ort.isMinter(ortMinter.address, overrides)).to.eq(false)
    })
    it('Add minting contract only possible for owner', async () => {
      await expect(ort.connect(user).setMinter(ortMinter.address, overrides)).to.be.revertedWith("AnyswapV3ERC20: FORBIDDEN")
      await ort.setMinter(ortMinter.address, overrides)
    })
    it('Removing minting contract only possible for owner', async () => {
      await ort.setMinter(ortMinter.address, overrides)
      await expect(ort.connect(user).revokeMinter(ortMinter.address, overrides)).to.be.revertedWith("AnyswapV3ERC20: FORBIDDEN")
      await ort.revokeMinter(ortMinter.address, overrides)
    })
    it('Adding minting contract should have a delay configured', async () => {
      const transaction = await ort.setMinter(ortMinter.address, overrides)
      await expect(ortMinter.mintORT(toMint)).to.be.revertedWith("AnyswapV4ERC20: FORBIDDEN")

      expect(await ort.pendingMinter()).to.eq(ortMinter.address)
      const blockTimeStamp = (await provider.getBlock(transaction.blockHash)).timestamp
      expect(await ort.delayMinter()).to.eq(blockTimeStamp + (24 * 3600))
    })
    it('Minting tokens is possible from the minting contract', async () => {
      await ort.initVault(ortMinter.address, overrides);
      await expect(ortMinter.mintORT(toMint))
        .to.emit(ort, 'Transfer')
        .withArgs(constants.Zero, ortMinter.address, toMint)
      
      expect(await ort.totalSupply()).to.eq(startSupply.add(toMint))
      expect(await ort.balanceOf(ortMinter.address)).to.eq(toMint)
    })
    it('Minting to tokens is possible from the minting contract', async () => {
      await ort.initVault(ortMinter.address, overrides);
      await expect(ortMinter.mintOrtTo(user.address, toMint))
        .to.emit(ort, 'Transfer')
        .withArgs(constants.Zero, user.address, toMint)
      
      expect(await ort.totalSupply()).to.eq(startSupply.add(toMint))
      expect(await ort.balanceOf(user.address)).to.eq(toMint)
    })
  })

  describe('Burning and burn rate', () => {
    const toBurn = expandTo18Decimals(300000)

    it('From wallet only available for configured minters', async () => {
      await expect(ort['burn(address,uint256)'](owner.address, toBurn, overrides)).to.be.revertedWith("AnyswapV4ERC20: FORBIDDEN")
    })
    it('Cannot burn more than a wallet`s holdings', async () => {
      await expect(ort.connect(user)['burn(uint256)'](1, overrides)).to.be.revertedWith("ERC20: burn amount exceeds balance")
    })
    it('Burning should update total burned', async () => {
      await expect(ort['burn(uint256)'](toBurn, overrides))
        .to.emit(ort, 'Transfer')
        .withArgs(owner.address, constants.Zero, toBurn)
      expect(await ort.totalSupply(overrides)).to.eq(startSupply.sub(toBurn))
    })
    it('From wallet possible for configured minters', async () => {
      await ort.initVault(ortMinter.address, overrides);
      await expect(ortMinter.burnOrtFrom(owner.address, toBurn, overrides))
        .to.emit(ort, 'Transfer')
        .withArgs(owner.address, constants.Zero, toBurn)
      
      expect(await ort.totalSupply(overrides)).to.eq(startSupply.sub(toBurn))
      expect(await ort.balanceOf(owner.address)).to.eq(startSupply.sub(toBurn))
    })
  })

  describe('Transfer', () => {
    const toTransfer = expandTo18Decimals(1000)

    it('Account should have the transfered balance', async () => {
      await expect(ort.transfer(user.address, toTransfer, overrides))
        .to.emit(ort, 'Transfer')
        .withArgs(owner.address, user.address, toTransfer)
      expect(await ort.balanceOf(user.address)).to.eq(toTransfer)
    })
  })

  describe('Permit', () => {
    // this is the first account that hardhat creates (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
    const ownerPrivateKey = Buffer.from('ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', 'hex')
    const chainId = 31337 // hardhat chain id

    let name: string;
    beforeEach(async () => {
      name = await ort.name()
    })

    it('initializes DOMAIN_SEPARATOR, PERMIT_TYPEHASH and TRANSFER_TYPEHASH correctly', async () => {
      expect(await ort.PERMIT_TYPEHASH()).to.eq(PERMIT_TYPEHASH)
      expect(await ort.TRANSFER_TYPEHASH()).to.eq(TRANSFER_TYPEHASH)
      expect(await ort.DOMAIN_SEPARATOR()).to.eq(getDomainSeparator(name, ort.address, chainId))
    })

    it('permits and emits Approval (replay safe)', async () => {
      // Create the approval request
      const approve = {
        owner: owner.address,
        spender: user.address,
        value: 100,
      }

      // deadline as much as you want in the future
      const deadline = 100000000000000
      // Get the user's nonce
      const nonce = await ort.nonces(approve.owner)
      // Get the EIP712 digest
      const digest = getPermitDigest(PERMIT_TYPEHASH, name, ort.address, chainId, approve, nonce, deadline)
      // Sign it
      // NOTE: Using web3.eth.sign will hash the message internally again which
      // we do not want, so we're manually signing here
      const { v, r, s } = sign(digest, ownerPrivateKey)

      // Approve it
      await expect(ort.permit(approve.owner, approve.spender, approve.value, deadline, v, r, s))
        .to.emit(ort, 'Approval')
        .withArgs(approve.owner, approve.spender, approve.value)

      // It worked!
      expect(await ort.nonces(owner.address)).to.eq(1)
      expect(await ort.allowance(approve.owner, approve.spender)).to.eq(approve.value)

      // Re-using the same sig doesn't work since the nonce has been incremented
      // on the contract level for replay-protection
      await expect(ort.permit(approve.owner, approve.spender, approve.value, deadline, v, r, s))
        .to.be.revertedWith('ERC20Permit: invalid signature')

      // invalid ecrecover's return address(0x0), so we must also guarantee that this case fails
      await expect(ort.permit(
        '0x0000000000000000000000000000000000000000',
        approve.spender,
        approve.value,
        deadline,
        '0x99',
        r,
        s
      )).to.be.revertedWith('ERC20Permit: invalid signature')
    })

    it('transfers with permit and emits Transfer (replay safe)', async () => {
      // Create the approval request
      const approve = {
        owner: owner.address,
        spender: user.address, // to
        value: 100,
      }

      // deadline as much as you want in the future
      const deadline = 100000000000000
      // Get the user's nonce
      const nonce = await ort.nonces(approve.owner)
      // Get the EIP712 digest
      const digest = getPermitDigest(TRANSFER_TYPEHASH, name, ort.address, chainId, approve, nonce, deadline)
      // Sign it
      // NOTE: Using web3.eth.sign will hash the message internally again which
      // we do not want, so we're manually signing here
      const { v, r, s } = sign(digest, ownerPrivateKey)

      // Approve it
      await expect(ort.transferWithPermit(approve.owner, approve.spender, approve.value, deadline, v, r, s))
        .to.emit(ort, 'Transfer')
        .withArgs(approve.owner, approve.spender, approve.value)

      // It worked!
      expect(await ort.nonces(owner.address)).to.eq(1)
      expect(await ort.balanceOf(approve.spender)).to.eq(approve.value)

      // Re-using the same sig doesn't work since the nonce has been incremented
      // on the contract level for replay-protection
      await expect(ort.transferWithPermit(approve.owner, approve.spender, approve.value, deadline, v, r, s))
        .to.be.revertedWith('ERC20Permit: invalid signature')

      // invalid ecrecover's return address(0x0), so we must also guarantee that this case fails
      await expect(ort.transferWithPermit(
        '0x0000000000000000000000000000000000000000',
        approve.spender,
        approve.value,
        deadline,
        '0x99',
        r,
        s
      )).to.be.revertedWith('ERC20Permit: invalid signature')
    })
  })
})
