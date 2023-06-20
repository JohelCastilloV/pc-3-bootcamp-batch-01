import { Contract, providers, ethers, utils } from "ethers";

var usdcTknAbi = require("../artifacts/contracts/USDCoin.sol/USDCoin.json").abi;
var miPrimerTknAbi = require("../artifacts/contracts/MiPrimerToken.sol/MiPrimerToken.json").abi;
var publicSaleAbi= require("../artifacts/contracts/PublicSale.sol/PublicSale.json").abi;
var nftTknAbi =  require("../artifacts/contracts/NFT.sol/MiPrimerNft.json").abi

window.ethers = ethers;

var provider, signer, account;
var usdcTkContract, miPrTokenContract, nftTknContract, pubSContract;


// REQUIRED
// Conectar con metamask
function initSCsGoerli() {
  provider = new providers.Web3Provider(window.ethereum);

  var usdcAddress = '0x4A7C719f2498D90Cc126FECe0d8f63F27261e3F7' ;
  var miPrTknAdd = '0xc8E04f376bd721B70A070c61a1e9388a1fa89a6d';
  var pubSContractAdd = '0xE4A1a9784d81aA53180e6AE9D4b1d222123b5234';

  usdcTkContract = new Contract(usdcAddress, usdcTknAbi, provider);
  miPrTokenContract = new Contract(miPrTknAdd, miPrimerTknAbi, provider);
  pubSContract = new Contract(pubSContractAdd, publicSaleAbi, provider);
}

// OPTIONAL
// No require conexion con Metamask
// Usar JSON-RPC
// Se pueden escuchar eventos de los contratos usando el provider con RPC
function initSCsMumbai() {
  var rpcProvider= new providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
  var nftAddress = '0xF4147eEe4228A38F9d2904437182c9B790bc1c2c';
  nftTknContract = new Contract(nftAddress, nftTknAbi, rpcProvider);
}

function setUpListeners() {
  var bttn = document.getElementById("connect");
  bttn.addEventListener("click", async function () {
    if (window.ethereum) {
      [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Billetera metamask", account);

      provider = new providers.Web3Provider(window.ethereum);
      signer = provider.getSigner(account);
      window.signer = signer;
    }
  });
  var btnUsdcRefresh = document.getElementById("usdcUpdate");
  var usdcBalance = document.getElementById("usdcBalance");
  btnUsdcRefresh.addEventListener("click", async function () {
    const amount = await usdcTkContract.balanceOf(account);
    usdcBalance.innerText=amount;
  });
  var btnMiPrimerTknUpdate = document.getElementById("miPrimerTknUpdate");
  var miPrimerTknBalance = document.getElementById("miPrimerTknBalance");
  btnMiPrimerTknUpdate.addEventListener("click", async function () {
    const amount = await miPrTokenContract.balanceOf(account);
    miPrimerTknBalance.innerText=amount;
  });
  var approveButton = document.getElementById("approveButton");
  var approveError = document.getElementById("approveError");
  approveButton.addEventListener("click", async function () {
    approveError.innerText="";
    var amount = document.getElementById("approveInput").value;
    try {
      var tx = await miPrTokenContract.connect(signer).approve(pubSContract.address, amount);
    }catch (e) {
      approveError.innerText=e.reason;
    }
  });
  var purchaseButton = document.getElementById("purchaseButton");
  var purchaseError = document.getElementById("purchaseError");
  purchaseButton.addEventListener("click", async function () {
    purchaseError.innerText="";
    var nftId = document.getElementById("purchaseInput").value;
    try {
      var tx = await pubSContract.connect(signer).purchaseNftById(nftId);
    }catch (e) {
      purchaseError.innerText=e.reason;
    }
  });
  var purchaseEthButton = document.getElementById("purchaseEthButton");
  var purchaseEthError = document.getElementById("purchaseEthError");
  purchaseEthButton.addEventListener("click", async function () {
    purchaseEthError.innerText="";
    try {
      var tx = await pubSContract.connect(signer).depositEthForARandomNft({
        value: utils.parseUnits("0.01","ether")
      });
    }catch (e) {
      purchaseEthError.innerText=e.reason;
    }
  });
  var sendEtherButton = document.getElementById("sendEtherButton");
  var sendEtherError = document.getElementById("sendEtherError");
  sendEtherButton.addEventListener("click", async function () {
    sendEtherError.innerText="";
    try {
      var tx = await pubSContract.connect(signer).sendTransaction({
        value: utils.parseUnits("0.01","ether")
      });
    }catch (e) {
      sendEtherError.innerText=e.reason;
    }
  });




}

async function setUpEventsContracts() {
  let nftList = document.getElementById('nftList');
  nftTknContract.on("Transfer", (from, to, tokenId) => {
    var child = document.createElement("li");
    child.innerText = `Transfer from  ${from} to  ${to} tokenId: ${tokenId}`;
    nftList.appendChild(child);
  });
}

async function setUp() {
  initSCsGoerli();
  initSCsMumbai();
  await setUpListeners();
  await setUpEventsContracts();
}

setUp()
  .then()
  .catch((e) => console.log(e));
