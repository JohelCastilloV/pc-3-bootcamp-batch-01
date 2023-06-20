// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract PublicSale is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Mi Primer Token
    // Crear su setter
    IERC20Upgradeable miPrimerToken;

    // 21 de diciembre del 2022 GMT
    uint256 constant startDate = 1671580800;

    // Maximo price NFT
    uint256 constant MAX_PRICE_NFT = 50000 * 10 ** 18;

    // Gnosis Safe
    // Crear su setter
    address gnosisSafeWallet;

    event DeliverNft(address winnerAccount, uint256 nftId);

    mapping (uint => bool) nftSold;
    mapping (uint => uint) nftIdToIndex;

    uint[] nftIdsAvailable;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function setTokenAddress(address _tokenAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        miPrimerToken = IERC20Upgradeable(_tokenAddress);
    }

    function setGnosisSafeWallet(address _gsWallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        gnosisSafeWallet = _gsWallet;
    }


    function initialize() public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _initializeNftIds();
    }
    function _initializeNftIds() internal{
        for(uint i=1;i<31;i++){
            nftIdToIndex[i]=i-1;
            nftIdsAvailable.push(i);
        }

    }

    function purchaseNftById(uint256 _id) external {
        require(_id>=1 && _id<=30, 'NFT: Token id out of range');
        require(!nftSold[_id],'Public Sale: id not available');
        uint256 priceNft = _getPriceById(_id);
        require(miPrimerToken.allowance(msg.sender, address(this))>=priceNft, 'Public Sale: Not enough allowance');
        require(miPrimerToken.balanceOf(msg.sender)>=priceNft, 'Public Sale: Not enough token balance');
        uint fee = priceNft/10;
        uint net = priceNft - fee;
        miPrimerToken.transferFrom(msg.sender, gnosisSafeWallet, fee);
        miPrimerToken.transferFrom(msg.sender, address(this), net);
        _updateIndex(_id);
        emit DeliverNft(msg.sender, _id);
    }

    function depositEthForARandomNft() public payable {
        require(msg.value >= 0.01 ether, "The amount should be greater than or equal 0.01 eth");
        uint256 nftId = _getRandomNftId();
        (bool success,) = payable(gnosisSafeWallet).call{value: 0.01 ether, gas: 5000000}("");
        require(success, "Transfer failed");
        uint256 change = msg.value -0.01 ether;
        if (change > 0) {
            payable(msg.sender).transfer(change);
        }
        _updateIndex(nftId);
        emit DeliverNft(msg.sender, nftId);
    }

    receive() external payable {
        depositEthForARandomNft();
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////

    // Devuelve un id random de NFT de una lista de ids disponibles
    function _getRandomNftId() internal view returns (uint256) {
        require(nftIdsAvailable.length>0, 'No NFTs available');
        uint8 random=  uint8(uint256(keccak256(abi.encodePacked(msg.sender, address(this), block.timestamp))) % nftIdsAvailable.length);
        return nftIdsAvailable[random];
    }

    // Según el id del NFT, devuelve el precio. Existen 3 grupos de precios
    function _getPriceById(uint256 _id) internal view returns (uint256) {
        if (_id > 0 && _id < 11) {
            return 500 * 10 ** 18;
        } else if (_id > 10 && _id < 21) {
            return _id * 1000 * 10 ** 18;
        } else {
            uint256 priceGroupThree = 10000 * 10 ** 18 + 1000*((block.timestamp-startDate)/(60*60)) * 10 ** 18;
            return priceGroupThree<MAX_PRICE_NFT ? priceGroupThree:MAX_PRICE_NFT;
        }
    }

    function _updateIndex(uint256 _nftId) internal {
        nftSold[_nftId] = true;
        uint index = nftIdToIndex[_nftId];
        uint lastId = nftIdsAvailable[nftIdsAvailable.length-1];
        nftIdsAvailable[index] = lastId;
        nftIdToIndex[lastId]=index;
        nftIdsAvailable.pop();
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}
}
