// npx hardhat run scripts/upgrades/upgrade-staking.ts --network bscmainnet

require("dotenv").config({path: `${__dirname}/.env`});
import { run, ethers, upgrades, defender } from "hardhat";
import { StakingPool } from "../../typechain";
import StakingPoolAbi from "../../abi/contracts/staking/StakingPool.sol/StakingPool.json";

const main = async() => {
  // const signer = ethers.provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // hardhat
  // const signer = ethers.provider.getSigner("0xCCD0C72BAA17f4d3217e6133739de63ff6F0b462"); // ganache
  const signer = ethers.provider.getSigner("0xD993af5263DcD70b6991fa31E1FE247f9cD3208F"); // bsc test and main
  console.log("upgrading stakingPool with signer:", signer._address);

  // let stakingPool = new ethers.Contract("0xb369c518dAe2388C264Ee14d704A96934F49a27F", StakingPoolAbi, signer) as StakingPool; // bsc test
  let stakingPool = new ethers.Contract("0x6f40A3d0c89cFfdC8A1af212A019C220A295E9bB", StakingPoolAbi, signer) as StakingPool; // bsc main

  // const StakingPool = await ethers.getContractFactory("StakingPool");
  // console.log("Preparing StakingPool proposal...");
  // const proposal = await defender.proposeUpgrade(stakingPool.address, StakingPool);
  // console.log("StakingPool Upgrade proposal created at:", proposal.url);

  const implAddress = await upgrades.erc1967.getImplementationAddress(stakingPool.address)
  console.log("StakingPool implementation address:", implAddress)
  await run("verify:verify", { address: implAddress, constructorArguments: [] })
  console.log("StakingPool implementation verified")
}

main()
//   .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
