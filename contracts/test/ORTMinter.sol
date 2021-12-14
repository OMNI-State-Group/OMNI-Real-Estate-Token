// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.0;

import "../interfaces/IORT.sol";

contract ORTMinter {
    address private _ort;

    function mintORT(uint256 amount) external returns (bool) {
        return IORT(_ort).mint(amount);
    }
    function mintOrtTo(address user, uint256 amount) external returns (bool) {
        return IORT(_ort).mint(user, amount);
    }
    function burnOrt(uint256 amount) external returns (bool) {
        return IORT(_ort).burn(amount);
    }
    function burnOrtFrom(address user, uint256 amount) external returns (bool) {
        return IORT(_ort).burn(user, amount);
    }

    function setORTAddress(address ort) external {
        _ort = ort;
    }
}