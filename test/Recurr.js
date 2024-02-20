const {
 loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Creator Plans", function () {


 async function Fixture() {

   const [owner , otherAccount] = await ethers.getSigners();

   const RecurrContractFactory = await ethers.getContractFactory("Recurr");
   const RecurrContract = await RecurrContractFactory.deploy( owner );

   return {  RecurrContractFactory , RecurrContract , owner, otherAccount };
 }


 describe("Deployment setup", function () {
  it("Should deploy witth correct owner", async function () {
    const { RecurrContract , owner, } = await loadFixture(Fixture);

    expect(await RecurrContract.owner()).to.equal(owner.address);
  });
 });




});
