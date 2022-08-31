// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CriptoMuNFT.sol";

contract CriptoMuPresaleNFT is AccessControl, Pausable, ReentrancyGuard { 

    CriptoMuNFT public NFT;
    address treasury;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    mapping(uint256 => uint256) private _nftSalePrice;
    mapping(uint256 => uint256) private _nftSaleSupply;
    mapping(uint256 => uint256) private _nftMaxPuchase;

    event Purchased(address purchaser, uint256 nftID, uint256 nftAmount, uint256 totalSalePrice);

    constructor(address _treasuryWallet, address _CriptoMuNFTContract) {
        treasury = _treasuryWallet;
        NFT = CriptoMuNFT(_CriptoMuNFTContract);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function purchase(uint256 _nftID, uint256 _nftAmount) public nonReentrant whenNotPaused payable {
        uint256 nftPrice = _nftSalePrice[_nftID];
        uint256 nftTotalSalePrice = nftPrice*_nftAmount;
        uint256 nftMaxSupply = _nftSaleSupply[_nftID];
        uint256 nftMaxPurchase = _nftMaxPuchase[_nftID];
        uint256 nftTotalSupply = NFT.totalSupply(_nftID)+_nftAmount;
        uint256 nftUserTotalBalance = NFT.balanceOf(msg.sender, _nftID)+_nftAmount;

        require(nftPrice > 0, "the required nft is not for sale");
        require(nftTotalSalePrice == msg.value, "not enough funds");
        require(nftTotalSupply <= nftMaxSupply, "max supply already minted");
        require(nftUserTotalBalance <= nftMaxPurchase, "reached the nft limit per account");
        
        (bool sent, ) = treasury.call{ value: msg.value }("");

        require(sent, "error sending the funds to treasury");

        NFT.mint(msg.sender, _nftID, _nftAmount, "0x0000");

        emit Purchased(msg.sender, _nftID, _nftAmount, nftTotalSalePrice);
    }

    function getMaxPurchaseNFT(uint256 _nftID) public view returns (uint256) {
        return _nftMaxPuchase[_nftID];
    }

    function getPriceNFT(uint256 _nftID) public view returns (uint256) {
        return _nftSalePrice[_nftID];
    }

     function getSupplyNFT(uint256 _nftID) public view returns (uint256) {
        return _nftSaleSupply[_nftID];
    }

    function setMaxPurchaseNFT(uint256 _nftID, uint256 _nftMaxPurchase) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _nftMaxPuchase[_nftID] = _nftMaxPurchase;
    }

    function setPriceNFT(uint256 _nftID, uint256 _nftPrice) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _nftSalePrice[_nftID] = _nftPrice;
    }

    function setSupplyNFT(uint256 _nftID, uint256 _nftSupply) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _nftSaleSupply[_nftID] = _nftSupply;
    }

    function setTreasuryWallet(address _newAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        treasury = _newAddress;
    }

    function pause() public virtual onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public virtual onlyRole(PAUSER_ROLE) {
        _unpause();
    }

}