const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const web3 = require("web3");

const amountToCharge = 10;
const intervalPeriod = 1200;
const expirationPeriod = 200;

async function Fixture() {
  const [owner, otherAccount] = await ethers.getSigners();

  const RecurrContractFactory = await ethers.getContractFactory("Recurr");
  const RecurrContract = await RecurrContractFactory.deploy(owner);

  return { RecurrContractFactory, RecurrContract, owner, otherAccount };
}

describe("Deployment setup", function () {
  it("Should deploy witth corect owner", async function () {
    const { RecurrContract, owner } = await loadFixture(Fixture);

    expect(await RecurrContract.owner()).to.equal(owner.address);
  });
});

describe("Fan subcriptions", function () {
  it("should fail with invalid creator plan", async function () {
    const { RecurrContract, owner, otherAccount } = await loadFixture(Fixture);

    const invalidPlanId = web3.utils.soliditySha3({
      type: "address",
      value: otherAccount.address,
    });

    await expect(
      RecurrContract.createFanSubcription(invalidPlanId)
    ).to.be.rejectedWith("Recurring plan does not exist");
  });

  it("should add sub and emit event", async function () {
    const { RecurrContract, otherAccount } = await loadFixture(Fixture);

    await RecurrContract.createPlan(
      otherAccount.address,
      amountToCharge,
      intervalPeriod,
      expirationPeriod
    );

    const expectedPlanId = web3.utils.soliditySha3(
      { type: "address", value: otherAccount.address },
      { type: "uint256", value: amountToCharge },
      { type: "uint256", value: intervalPeriod },
      { type: "uint256", value: expirationPeriod }
    );

    const currentSubcriberCount = await RecurrContract.plansSubcribersCount(
      expectedPlanId
    );

    const subCreated = await RecurrContract.createFanSubcription(
      expectedPlanId
    );

    it("should increase subcriber count by 1", async function () {
      expect(currentSubcriberCount + 1).to.equal(
        await RecurrContract.plansSubcribersCount(expectedPlanId)
      );
    });

    it("should find subcription in mapping", async function () {
      const expectedSubcriptionHash = web3.utils.soliditySha3(
        { type: "bytes32", value: expectedPlanId },
        { type: "uint256", value: currentSubcriberCount + 1 }
      );

      const createdFanSub = await RecurrContract.fanSubscriptions(
        expectedSubcriptionHash
      );

      expect(createdFanSub).to.not.equal(null);
    });

    expect(subCreated).to.emit(RecurrContract, "FanSubcriptionCreated");
  });
});

describe("Creator Plans", function () {
  describe("Creator Recurring Payment Plan", function () {
    it("Should find created plan in mapping", async function () {
      const { RecurrContract, owner, otherAccount } = await loadFixture(
        Fixture
      );

      await RecurrContract.createPlan(
        otherAccount.address,
        amountToCharge,
        intervalPeriod,
        expirationPeriod
      );

      const planId = web3.utils.soliditySha3(
        { type: "address", value: otherAccount.address },
        { type: "uint256", value: amountToCharge },
        { type: "uint256", value: intervalPeriod },
        { type: "uint256", value: expirationPeriod }
      );

      const createdPlan = await RecurrContract.recurringPlans(planId);
      expect(createdPlan).to.not.equal(null);
    });

    it("Should receive plan created event", async function () {
      const { RecurrContract, owner, otherAccount } = await loadFixture(
        Fixture
      );

      const planCreated = await RecurrContract.createPlan(
        otherAccount.address,
        amountToCharge,
        intervalPeriod,
        expirationPeriod
      );

      expect(planCreated)
        .to.emit(RecurrContract, "PlanCreated")
        .withArgs(
          otherAccount.address,
          amountToCharge,
          intervalPeriod,
          expirationPeriod
        );
    });
  });
});
