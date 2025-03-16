// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Crowdfunding} from "./Crowdfunding.sol";

contract CrowdFundingFactory {
    address public owner;

    struct Campaign {
        address campaignAddress;
        address owner;
        string name;
        uint256 createdAt;
    }

    Campaign[] public campaigns;
 
    mapping(address => Campaign[]) public userCampaigns;

    modifier onlyOwner(){
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createCampaign(string memory _name, uint256 _durationInDays, uint256 _goal, string memory _description) external {
        Crowdfunding campaign = new Crowdfunding(msg.sender, _name, _description, _goal, _durationInDays);
        address campaignAddress = address(campaign);
        Campaign memory newCamp = Campaign({campaignAddress: campaignAddress, owner: msg.sender, name:_name, createdAt:block.timestamp});
        userCampaigns[msg.sender].push(newCamp);
        campaigns.push(newCamp);
    }

    function getCampaignsOfUser(address campaignOwenerAddress) external view returns (Campaign[] memory) {
        return userCampaigns[campaignOwenerAddress];
    }

    function getAllCampaigns() external view returns (Campaign[] memory){
        return campaigns;
    }

}