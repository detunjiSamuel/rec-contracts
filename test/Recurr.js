const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const web3 = require("web3");

const amountToCharge = 10;
const intervalPeriod = 1200;
const expirationPeriod = 200;
const tokenAddress = "0x1234567890123456789012345678901234567890";
const freeTrailPeriod = 0;

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
      expirationPeriod,
      tokenAddress,
      freeTrailPeriod
    );

    const expectedPlanId = web3.utils.soliditySha3(
      { type: "address", value: otherAccount.address },
      { type: "uint256", value: amountToCharge },
      { type: "uint256", value: intervalPeriod },
      { type: "uint256", value: expirationPeriod }
    );

    const currentSubcriberCount = Number( await RecurrContract.plansSubcribersCount(
      expectedPlanId
    ));

    const subCreated = await RecurrContract.createFanSubcription(
      expectedPlanId
    );

    expect(Number(currentSubcriberCount) + 1).to.equal(
      Number(await RecurrContract.plansSubcribersCount(expectedPlanId))
    );

    // console.log(  expectedPlanId , currentSubcriberCount )

    // const createdFanSub = await RecurrContract.fanSubscriptions(
    //  subCreated
    // );

    // expect(createdFanSub).to.not.equal(null);

    // expect(subCreated).to.emit(RecurrContract, "FanSubcriptionCreated");
  });
});

describe("Fan subcription Termination", function () {
  it("should fail with invalid subscription", async function () {
    const { RecurrContract, owner, otherAccount } = await loadFixture(Fixture);

    const invalidHash = web3.utils.soliditySha3({
      type: "address",
      value: otherAccount.address,
    });

    await expect(
      RecurrContract.stopFanSubcription(invalidHash)
    ).to.be.rejectedWith("Subcription does not exist");
  });

  it("should emit and update as ended", async function () {
    const { RecurrContract, owner, otherAccount } = await loadFixture(Fixture);

    await RecurrContract.createPlan(
      otherAccount.address,
      amountToCharge,
      intervalPeriod,
      expirationPeriod,
      tokenAddress,
      freeTrailPeriod
    );

    const expectedPlanId = web3.utils.soliditySha3(
      { type: "address", value: otherAccount.address },
      { type: "uint256", value: amountToCharge },
      { type: "uint256", value: intervalPeriod },
      { type: "uint256", value: expirationPeriod }
    );

    // const subCreated = await RecurrContract.createFanSubcription(
    //   expectedPlanId
    // );

    // const stoppedSub = await RecurrContract.stopFanSubcription(subCreated);

    // expect(stoppedSub)
    //   .to.emit(RecurrContract, "FanSubcriptionEnded")
    //   .withArgs(owner.address);
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
        expirationPeriod,
        tokenAddress,
        freeTrailPeriod
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
        expirationPeriod,
        tokenAddress,
        freeTrailPeriod
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
