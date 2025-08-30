// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleTest {
    string public message = "Hello World";
    
    function setMessage(string memory newMessage) external {
        message = newMessage;
    }
    
    function getMessage() external view returns (string memory) {
        return message;
    }
}
