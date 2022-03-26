import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, upgrades } from 'hardhat';
import { expect, use } from "chai";
import chai from "chai"
import { Contract } from "ethers";
import { deployContract, MockProvider, solidity } from "ethereum-waffle";

import { CPToken,MultiTransection } from "../typechain";

chai.use(solidity);

describe("CPTokenTest", function () {
  let cptoken: CPToken;
  let multiTrans: MultiTransection;
  let signers: SignerWithAddress[];
  let acc1: SignerWithAddress;
  let acc2: SignerWithAddress;
  let acc3: SignerWithAddress;

  before(async function () {
    this.CPToken = await ethers.getContractFactory('CPToken');
    this.multiTransection = await ethers.getContractFactory('MultiTransection');
    signers = await ethers.getSigners();
    acc1 = signers[0];
    acc2 = signers[1];
    acc3 = signers[2];
    
  });

  beforeEach(async function(){
    cptoken = await this.CPToken.deploy();
    multiTrans = await this.multiTransection.deploy();
    await multiTrans.deployed();
  
    
    // this.cptoken = await upgrades.deployProxy(await ethers.getContractFactory("CPToken"));
    await cptoken.deployed();
  });

  it('should have correct name and symbol and decimal', async function () {
    const name = await cptoken.name();
    const symbol = await cptoken.symbol();
    const decimals = await cptoken.decimals();
    expect(name).to.be.equal( 'CPToken');
    expect(symbol).to.be.equal( 'CPT');
    expect(decimals).to.be.equal( 18);
  });

  it("Only owner can mint test...", async function(){
    await cptoken.connect(acc1).mint(acc1.address,10000);
    await cptoken.mint(acc2.address, 1000);

    await expect( cptoken.connect(acc2).mint(acc2.address,1000)).to.be.revertedWith('Ownable: caller is not the owner');
    await expect( cptoken.connect(acc3).mint(acc3.address,100)).to.be.revertedWith('Ownable: caller is not the owner');
    const totalSupply = await cptoken.totalSupply();
    const acc1Bal = await cptoken.balanceOf(acc1.address);
    const acc2Bal = await cptoken.balanceOf(acc2.address);
    const acc3Bal = await cptoken.balanceOf(acc3.address);
    expect(totalSupply).to.equal('11000');
    expect(acc1Bal).to.equal('10000');
    expect(acc2Bal).to.equal('1000');
    expect(acc3Bal).to.equal('0');
  })
  it('should supply token transfers properly', async function () {
    await cptoken.mint(acc1.address, '100');
    await cptoken.mint(acc2.address, '1000');
    await cptoken.transfer(acc3.address, '10');
    await cptoken.connect(acc2).transfer(acc3.address, '100', {
      from: acc2.address,
    });
    const totalSupply = await cptoken.totalSupply();
    const acc1Bal = await cptoken.balanceOf(acc1.address);
    const acc2Bal = await cptoken.balanceOf(acc2.address);
    const acc3Bal = await cptoken.balanceOf(acc3.address);
    expect(totalSupply, '1100');
    expect(acc1Bal, '90');
    expect(acc2Bal, '900');
    expect(acc3Bal, '110');
  });

  it('should fail if you try to do bad transfers', async function () {
    await cptoken.mint(acc1.address, '100');
    await expect(cptoken.transfer(acc3.address, '110')).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    await expect(cptoken.connect(acc2).transfer(acc3.address, '1', { from: acc2.address })).to.be.revertedWith(
      'ERC20: transfer amount exceeds balance',
    );
  });

  it("multiTransfer() should work", async function(){
    await cptoken.mint(acc1.address, '10000000');


    const accArray = [acc2.address, acc3.address];
    const amountArray = [100,200]
    const totalSupply = await cptoken.totalSupply();
    let cptVal = await cptoken.balanceOf(cptoken.address);
    let acc1Val = await cptoken.balanceOf(acc1.address);
    let acc2Val = await cptoken.balanceOf(acc2.address);
    let acc3Val = await cptoken.balanceOf(acc3.address);
    expect(totalSupply, '10000000');
    expect(acc1Val, '10000000');
    expect(acc2Val, '0');
    expect(acc3Val, '0');

    console.log("THis : ", multiTrans.address);
    await cptoken.approve(multiTrans.address, 10000000);

    await multiTrans.multiTransfer(cptoken.address,accArray, amountArray);
    acc2Val = await cptoken.balanceOf(acc2.address);
    acc3Val = await cptoken.balanceOf(acc3.address);

    expect(acc2Val, '100');
    expect(acc3Val, '200');

  })
});
