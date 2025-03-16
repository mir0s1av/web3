// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Crowdfunding {
    string public name;
    string public description;
    uint256 public goal;
    uint256 public deadline;
    address public owner;
    bool public isCampaignPaused;
    struct Tier {
        string name;
        uint256 amount;
        uint256 backers;
    }
    struct Backer {
        address backer;
        uint256 totalContribution;
        mapping(uint256 => bool) fundedTiers;
    }
    enum CampaignStatus {
        Active,
        Successful,
        Failed
    }
    mapping(address => Backer) public backers;
    CampaignStatus public campaignStatus;
    Tier[] public tiers;


    modifier campaignNotPaused() {
        require(!isCampaignPaused, "Campaign is paused");
        _;
    }

    modifier campaignActive() {
        require(block.timestamp < deadline, "Campaign has ended");
        require(
            campaignStatus == CampaignStatus.Active,
            "Campaign is not active"
        );
        _;
    }
    modifier campaignEnded() {
        require(
            campaignStatus == CampaignStatus.Successful ||
                campaignStatus == CampaignStatus.Failed,
            "Campaign is not ended"
        );
        _;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    modifier greaterThanZero(uint256 _amount) {
        require(_amount > 0, "Amount must be greater than 0");
        _;
    }

    constructor(
        address _owner,
        string memory _name,
        string memory _description,
        uint256 _goal,
        uint256 _durationInDays
    ) {
        
        name = _name;
        description = _description;
        goal = _goal;
        deadline = block.timestamp + _durationInDays * 1 days;
        owner = _owner;
        campaignStatus = CampaignStatus.Active;
    }

    function checkAndUpdateCampaignStatus() internal {
        if (campaignStatus == CampaignStatus.Active) {
            if (block.timestamp >= deadline) {
                campaignStatus = address(this).balance >= goal
                    ? CampaignStatus.Successful
                    : CampaignStatus.Failed;
            } else {
                campaignStatus = address(this).balance >= goal
                    ? CampaignStatus.Successful
                    : CampaignStatus.Active;
            }
        }
    }

    function fund(uint256 _tierIndex) public payable campaignActive campaignNotPaused {
        require(_tierIndex < tiers.length, "Invalid tier index");
        require(msg.value == tiers[_tierIndex].amount, "Invalid amount");
        tiers[_tierIndex].backers++;
        checkAndUpdateCampaignStatus();
        backers[msg.sender].totalContribution += msg.value;
        backers[msg.sender].fundedTiers[_tierIndex] = true;

    }

    function withdraw() public onlyOwner {
        checkAndUpdateCampaignStatus();
        require(
            campaignStatus == CampaignStatus.Successful,
            "Campaign is not successful"
        );
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner).transfer(balance);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    function addTier(
        string memory _name,
        uint256 _amount
    ) public onlyOwner greaterThanZero(_amount) {
        tiers.push(Tier(_name, _amount, 0));
    }
    function removeTier(uint256 _index) public onlyOwner {
        require(_index < tiers.length, "Invalid tier index");
        require(tiers[_index].backers == 0, "Cannot remove tier with backers");

        // Move last tier to deleted position and pop
        tiers[_index] = tiers[tiers.length - 1];
        tiers.pop();
    }

    function getTiers() public view returns (Tier[] memory) {
        return tiers;
    }

    function refund() public {
        checkAndUpdateCampaignStatus();
        require(campaignStatus == CampaignStatus.Failed, "Refund is not available");
        uint256 amount = backers[msg.sender].totalContribution;
        require(amount > 0, "No contribution to refund");
        backers[msg.sender].totalContribution = 0;
        payable(msg.sender).transfer(amount);
    }

    function hasFundedTier(address _backer, uint256 _tierIndex) public view returns (bool) {
        return backers[_backer].fundedTiers[_tierIndex];
    }
    function getBackersTotalContribution(address _backer) public view returns (uint256) {
        return backers[_backer].totalContribution;
    }

    function getCampaignStatus() public view returns (CampaignStatus) {
        return campaignStatus;
    }

    function pauseCampaign() public onlyOwner {
        isCampaignPaused = true;
    }

    function resumeCampaign() public onlyOwner {
        isCampaignPaused = false;
    }
}
