// npx hardhat run scripts/deploy_stakingpool.ts

require("dotenv").config({path: `${__dirname}/.env`});
import { ethers, upgrades } from "hardhat";
import { ORT, StakingPool } from "../typechain";
import ORTAbi from "../abi/contracts/ORT.sol/ORT.json";
import StakingPoolAbi from "../abi/contracts/staking/StakingPool.sol/StakingPool.json";

const main = async() => {
  // const signer = ethers.provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // hardhat
  // const signer = ethers.provider.getSigner("0xCCD0C72BAA17f4d3217e6133739de63ff6F0b462"); // ganache
  const signer = ethers.provider.getSigner("0xD993af5263DcD70b6991fa31E1FE247f9cD3208F"); // bsc test and main
  console.log("deploying stakingPool with signer:", signer._address);

  // const ort = new ethers.Contract("0x5Ed78a73d29696f8B591ea30Ce73E93CcE9514eE", ORTAbi, signer) as ORT; // bsc test
  const ort = new ethers.Contract("0x1d64327C74d6519afeF54E58730aD6fc797f05Ba", ORTAbi, signer) as ORT; // bsc main

  // const stakingPool = new ethers.Contract("0xb369c518dAe2388C264Ee14d704A96934F49a27F", StakingPoolAbi, signer) as StakingPool; // bsc test
  // const stakingPool = new ethers.Contract("0x6f40A3d0c89cFfdC8A1af212A019C220A295E9bB", StakingPoolAbi, signer) as StakingPool; // bsc main
  const StakingPool = await ethers.getContractFactory("StakingPool");
  const stakingPool =  await upgrades.deployProxy(StakingPool, [ort.address, ort.address], {initializer: 'initialize', unsafeAllow: ['delegatecall']}) as StakingPool;
  await stakingPool.deployed();
  console.log("StakingPool contract deployed to:", stakingPool.address);

  await (await ort.setMinter(stakingPool.address)).wait()
  console.log("Added staking contract as minter. wait 24 hours before apply");
}

main()
//   .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
