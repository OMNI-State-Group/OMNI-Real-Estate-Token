// npx hardhat run scripts/deploy_ort.ts

require("dotenv").config({path: `${__dirname}/.env`});
import { ethers } from "hardhat";
import { ORT } from "../typechain";
import ORTAbi from "../abi/contracts/ORT.sol/ORT.json";

const main = async() => {
  // const signer = ethers.provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // hardhat
  // const signer = ethers.provider.getSigner("0xCCD0C72BAA17f4d3217e6133739de63ff6F0b462"); // ganache
  const signer = ethers.provider.getSigner("0xD993af5263DcD70b6991fa31E1FE247f9cD3208F"); // bsc test and main

  console.log("deploying ort with signer:", signer._address);
  // const ort = new ethers.Contract("0x1d64327C74d6519afeF54E58730aD6fc797f05Ba", ORTAbi, signer) as ORT; // bsc test
  const ORT = await ethers.getContractFactory("ORT");
  const ort: ORT = await ORT.connect(signer).deploy() as ORT;
  await ort.deployed();
  console.log("ORT contract deployed to:", ort.address);

  const balance = ethers.utils.formatUnits(await ort.balanceOf(signer._address), 18);
  console.log("signer balance: ", balance);
}

main()
//   .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
