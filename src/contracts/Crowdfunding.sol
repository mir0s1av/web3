// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Crowdfunding {
    string public name;
    string public description;
    uint256 public goal;
    uint256 public deadline;
    address public owner;

    constructor(string memory _name, string memory _description, uint256 _goal, uint256 _durationInDays) {
        name = _name;
        description = _description;
        goal = _goal;
        deadline = block.timestamp + _durationInDays * 1 days;
        owner = msg.sender;
    }

    function fund() public payable {
        require(block.timestamp < deadline, "Campaign has ended");
        require(msg.value > 0, "Amount must be greater than 0");

    }

    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        require(address(this).balance >= goal, "Goal has not been reached");
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner).transfer(balance); 
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}