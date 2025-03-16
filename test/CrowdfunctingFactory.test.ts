import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { expect } from "chai";
import { CrowdFundingFactory } from '../typechain-types/CrowdFundingFactory'; 


describe("Testing factory crowdfunding",async ()=>{
    let factory: CrowdFundingFactory,
    owner: HardhatEthersSigner
   

  before(async function () {
    [owner] = await ethers.getSigners();
    const crowdfundingFactory = await ethers.getContractFactory("CrowdFundingFactory");
    factory = await crowdfundingFactory.deploy() as unknown as CrowdFundingFactory;
    await factory.waitForDeployment();
  });

  it("should create a new campaign", async () => {
    const campaignName = "Test Campaign";
    const campaignDesc = "A test crowdfunding campaign";
    const goalAmount = ethers.parseEther("1");
    const durationInDays = 7;

    await factory.createCampaign(campaignName, durationInDays, goalAmount, campaignDesc);
    const existingCampaigns = await factory.getCampaignsOfUser(owner.address)
    expect(existingCampaigns.length).to.equal(1);
    expect(existingCampaigns[0].name).to.include(campaignName)
    
  });
});
