# ORT token contract

This project is using [Hardhat](https://hardhat.org/getting-started/) for development, compiling, testing and deploying. The development tool used for development is [Visual Studio Code](https://code.visualstudio.com/) which has [great plugins](https://hardhat.org/guides/vscode-tests.html) for solidity development and mocha testing.

## Contracts

* Binance Chain
  * ORT : [<TOBEDEPLOYED>](https://bscscan.com/address/<TOBEDEPLOYED>)

* Binance Test Chain
  * ORT : [0x5Ed78a73d29696f8B591ea30Ce73E93CcE9514eE](https://testnet.bscscan.com/address/0x5Ed78a73d29696f8B591ea30Ce73E93CcE9514eE)

## Compiling

Introduction to compiling these contracts

### Install needed packages

```npm
npm install or yarn install
```

### Compile code

```npm
npx hardhat compile
```

### Test code

```node
npx hardhat test
```

### Run a local development node

This is needed before a truffle migrate to the development network. You can also use this for local development with for example metamask. [Hardhat node guide](https://hardhat.org/hardhat-network/)

```node
npx hardhat node
```

### Scripts

Use the scripts in the "scripts" folder. Each script has the command to start it on top.

Make sure you have set the right settings in your ['.env' file](https://www.npmjs.com/package/dotenv). You have to create this file with the following contents yourself:

```node
BSC_PRIVATE_KEY=<private_key>
BSC_TEST_PRIVATE_KEY=<private_key>
KOVAN_PRIVATE_KEY=<private_key>
RINKEBY_PRIVATE_KEY=<private_key>
GOERLI_PRIVATE_KEY=<private_key>
MAIN_PRIVATE_KEY=<private_key>

KOVAN_INFURA=https://kovan.infura.io/v3/<infura_key>
RINKEBY_INFURA=https://rinkeby.infura.io/v3/<infura_key>
GOERLI_INFURA=https://goerli.infura.io/v3/<infura_key>
MAIN_INFURA=https://mainnet.infura.io/v3/<infura_key>

MAIN_ALCHEMY_URL=https://eth-mainnet.alchemyapi.io/v2/<alchemy_key>
KOVAN_ALCHEMY_URL=https://eth-kovan.alchemyapi.io/v2/<alchemy_key>

ETHERSCAN_API_TOKEN=<etherscan_api_token>
BSC_API_TOKEN=<bscscan_api_token>
```

### Flatten contracts

```node
npx hardhat flatten contracts/DPexRouter.sol > contracts-flattened/DPexRouter.sol
```
