const { expect } = require("chai");

describe("Reward contract", function () {

  let Reward;
  let reward;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    Reward = await ethers.getContractFactory("Reward");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    reward = await Reward.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await reward.owner()).to.equal(owner.address);
    });
  });

  describe("Distribute rewards", function () {
    it("Should update user balances", async function () {
      let users = [addr1.address, addr2.address];
      let rewards = [1, 2];

      let tx = await reward.distribute(users, rewards, { value: 3 });
      let receipt = await ethers.provider.getTransactionReceipt(tx.hash);
      console.log(`Gas used for distribute reward (${users.length} users): ${receipt.gasUsed}`);

      const addr1Balance = await reward.balances(addr1.address);
      expect(addr1Balance).to.equal(1);

      const addr2Balance = await reward.balances(addr2.address);
      expect(addr2Balance).to.equal(2);
    });

    it("Should fail if the number of users and rewards are different", async function () {
      let users = [];
      let rewards = [1, 2];

      await expect(
        reward.distribute(users, rewards)
      ).to.be.revertedWith("Number of users and rewards is not match");
    });

    it("Should fail if the send value is not match the rewards", async function () {
      let users = [addr1.address];
      let rewards = [1];

      await expect(
        reward.distribute(users, rewards)
      ).to.be.revertedWith("Total rewards is not match with received eth value");
    });

    it("Should fail if the caller is not the owner", async function () {
      let users = [addr1.address];
      let rewards = [1];

      await expect(
        reward.connect(addr1).distribute(users, rewards)
      ).to.be.revertedWith("Only owner can call this function");
    })
  });

  describe("Claim reward", function () {
    it("Should send user's reward to user wallet", async function () {
      let users = [addr1.address];
      let rewards = [1];

      await reward.distribute(users, rewards, { value: 1 });

      let balanceBefore = await ethers.provider.getBalance(addr1.address);

      let tx = await reward.connect(addr1).claim();
      let receipt = await ethers.provider.getTransactionReceipt(tx.hash);
      console.log(`Gas used for claim reward: ${receipt.gasUsed}`);

      let balanceAfter = await ethers.provider.getBalance(addr1.address);
      expect(balanceAfter).to.eq(balanceBefore.sub(receipt.gasUsed.mul(tx.gasPrice)).add(1));

      const addr1Balance = await reward.balances(addr1.address);
      expect(addr1Balance).to.equal(0);
    })

    it("Should emit event RewardClaimed", async function () {
      let users = [addr1.address];
      let rewards = [1];

      await reward.distribute(users, rewards, { value: 1 });

      await expect(
        reward.connect(addr1).claim()
      ).to.emit(reward, 'RewardClaimed').withArgs(addr1.address, 1);
    })

    it("Should fail if user does not have reward", async function () {
      await expect(
        reward.connect(addr1).claim()
      ).to.be.revertedWith("No reward");
    })
  });
});