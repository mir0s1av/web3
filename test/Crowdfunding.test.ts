import { expect } from "chai";
import { ethers } from "hardhat";

async function withSnapshot(fn: () => Promise<void>): Promise<void> {
  const snapshotId = await ethers.provider.send("evm_snapshot", []);
  try {
    await fn();
  } finally {
    await ethers.provider.send("evm_revert", [snapshotId]);
  }
}

describe("Crowdfunding Contract", function () {
  let Crowdfunding, crowdfunding, owner, addr1, addr2;
  const campaignName = "Test Campaign";
  const campaignDesc = "A test crowdfunding campaign";
  const goalAmount = ethers.parseEther("1"); // 1 ETH goal
  const durationInDays = 7;
  let totalFunding = ethers.parseEther("0");

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
    await crowdfunding
      .connect(owner)
      .addTier("Basic", ethers.parseEther("0.1"));
    await crowdfunding.connect(owner).addTier("Super", ethers.parseEther("1"));
  });

  it("Should deploy with correct initial values", async function () {
    expect(await crowdfunding.name()).to.equal(campaignName);
    expect(await crowdfunding.description()).to.equal(campaignDesc);
    expect(await crowdfunding.goal()).to.equal(goalAmount);
    expect(await crowdfunding.owner()).to.equal(owner.address);
  });

  it("Should accept valid funds", async function () {
    const amount = ethers.parseEther("0.1");
    await crowdfunding.connect(addr2).fund(0, { value: amount });
    expect(await crowdfunding.getContractBalance()).to.equal(amount);
    totalFunding += amount;
  });

  it("Should prevent funding after deadline", async function () {
    await withSnapshot(async () => {
      await ethers.provider.send("evm_increaseTime", [
        durationInDays * 24 * 60 * 60,
      ]);
      await ethers.provider.send("evm_mine");

      await expect(
        crowdfunding.connect(addr2).fund(0, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Campaign has ended");
    });
  });

  it("Should not allow withdrawal if goal is not met", async function () {
    await expect(crowdfunding.connect(owner).withdraw()).to.be.revertedWith(
      "Campaign is not successful"
    );
  });

  it("Should allow owner to withdraw funds after goal is met", async function () {
    await withSnapshot(async () => {
      await crowdfunding.connect(addr1).fund(1, { value: goalAmount });

      const ownerBalanceBefore = await ethers.provider.getBalance(
        owner.address
      );

      await crowdfunding.connect(owner).withdraw();

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.be.greaterThan(ownerBalanceBefore);
    });
  });

  it("Should not allow non-owners to withdraw funds", async function () {
    await expect(crowdfunding.connect(addr1).withdraw()).to.be.revertedWith(
      "Only owner can call this function"
    );
  });

  it("Should return the correct contract balance", async function () {
    expect(await crowdfunding.getContractBalance()).to.equal(totalFunding);
  });

  it("Should add a tier", async function () {
    await withSnapshot(async () => {
      const tierName = "Supreme";
      const tierAmount = ethers.parseEther("0.1");
      await crowdfunding.connect(owner).addTier(tierName, tierAmount);
      const tiers = await crowdfunding.getTiers();
      const newTier = tiers.find((tier) => tier.name === tierName);
      expect(tiers.length).to.equal(3);
      expect(newTier).to.be.not.undefined;
    });
  });

  it("Should not remove a tier with backers", async function () {
    const tiers = await crowdfunding.getTiers();
    const tierWithBackers = tiers.findIndex((tier) => tier.backers > 0);
    await expect(
      crowdfunding.connect(owner).removeTier(tierWithBackers)
    ).to.be.revertedWith("Cannot remove tier with backers");
  });

  it("Should remove a tier with no backers", async function () {
    await withSnapshot(async () => {
      const tierName = "Testing Delete";
      const tierAmount = ethers.parseEther("0.1");
      await crowdfunding.connect(owner).addTier(tierName, tierAmount);

      let tiers = await crowdfunding.getTiers();
      expect(tiers.length).to.equal(3);
      const tierIndexToDelete = tiers.findIndex(
        (tier) => tier.name === tierName
      );
      await expect(crowdfunding.connect(owner).removeTier(tierIndexToDelete)).to
        .not.be.reverted;

      tiers = await crowdfunding.getTiers();
      expect(tiers.length).to.equal(2);
    });
  });

  it("Should not fund an invalid tier", async function () {
    await expect(crowdfunding.connect(addr1).fund(5)).to.be.revertedWith(
      "Invalid tier index"
    );
  });

  it("Should not fund an invalid amount", async function () {
    await expect(
      crowdfunding.connect(addr1).fund(0, { value: ethers.parseEther("0.01") })
    ).to.be.revertedWith("Invalid amount");
  });
});
