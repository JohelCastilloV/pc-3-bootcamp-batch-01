require("dotenv").config();

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
} = require("../utils");

var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");

async function deployMumbai() {
  var relayerAddress = process.env.RELAYER_ADDRESS;
  var name = "MiPrimerNFT";
  var symbol = "MPRNFT";
  var nftContract = await deploySC("MiPrimerNft", [name, symbol]);
  var implementation = await printAddress(name, nftContract.address);

  // set up
  await ex(nftContract, "grantRole", [MINTER_ROLE, relayerAddress], "GR");

  await verify(implementation, "MiPrimerNft", []);
}

async function deployGoerli() {
  // gnosis safe
  // Crear un gnosis safe en https://gnosis-safe.io/app/
  // Extraer el address del gnosis safe y pasarlo al contrato con un setter
  var gnosis = { address:  process.env.GNOSIS_ADDRESS};
  var usdContract = await deploySCNoUp("USDCoin",[]);
  await verify(usdContract.address, 'USDCoin',[]);
  var name = 'MiPrimerToken';
  var symbol = 'MPRTKN';
  var miPrimerToken = await deploySC("MiPrimerToken",[name, symbol]);
  var implementationMiPrimerToken = await printAddress("MiPrimerToken", miPrimerToken.address);
  await verify(implementationMiPrimerToken, "MiPrimerToken", []);

  var publicSale = await deploySC("PublicSale");
  var implementation = await printAddress("PublicSale", publicSale.address);
  await verify(implementation, "PublicSale", []);
  await ex(publicSale, "setGnosisSafeWallet", [gnosis.address], "GR");
  await ex(publicSale, "setTokenAddress", [miPrimerToken.address], "GR");
  console.log("finish");

}
deployMumbai()
//deployGoerli()
    //
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });

