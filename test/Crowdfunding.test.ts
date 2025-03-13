import { expect }from "chai";
import {ethers}  from "hardhat";

describe("Crowdfunding Contract", function () {
  let Crowdfunding, crowdfunding, owner, addr1, addr2;
  const campaignName = "Test Campaign";
  const campaignDesc = "A test crowdfunding campaign";
  const goalAmount = ethers.parseEther("1"); // 1 ETH goal
  const durationInDays = 7;

  before(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    crowdfunding = await Crowdfunding.deploy(
      campaignName,
      campaignDesc,
      goalAmount,
      durationInDays
    );
    await crowdfunding.waitForDeployment();
  });

  it("Should deploy with correct initial values", async function () {
    expect(await crowdfunding.name()).to.equal(campaignName);
    expect(await crowdfunding.description()).to.equal(campaignDesc);
    expect(await crowdfunding.goal()).to.equal(goalAmount);
    expect(await crowdfunding.owner()).to.equal(owner.address);
  });

  it("Should accept valid funds", async function () {

    const amount = ethers.parseEther("0.1")
    await crowdfunding.connect(addr2).fund({ value: amount });
    expect(await crowdfunding.getContractBalance()).to.equal(
      amount
    );
  });

  it("Should prevent funding after deadline", async function () {
    // Take a snapshot before time manipulation
    const snapshotId = await ethers.provider.send("evm_snapshot", []);
    
    // Fast-forward time past deadline
    await ethers.provider.send("evm_increaseTime", [durationInDays * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    await expect(
      crowdfunding.connect(addr2).fund({ value: ethers.parseEther("0.5") })
    ).to.be.revertedWith("Campaign has ended");

    // Revert time back
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  it("Should not allow withdrawal if goal is not met", async function () {
    await expect(crowdfunding.connect(owner).withdraw()).to.be.revertedWith(
      "Goal has not been reached"
    );
  });

  it("Should allow owner to withdraw funds after goal is met", async function () {

    
    await crowdfunding.connect(addr1).fund({ value: goalAmount });

    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

    await crowdfunding.connect(owner).withdraw();


    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerBalanceAfter).to.be.greaterThan(ownerBalanceBefore);


  });

  it("Should not allow non-owners to withdraw funds", async function () {
    await expect(crowdfunding.connect(addr1).withdraw()).to.be.revertedWith(
      "Only owner can withdraw"
    );
  });

  it("Should return the correct contract balance", async function () {

    expect(await crowdfunding.getContractBalance()).to.equal(0);
  });
});
