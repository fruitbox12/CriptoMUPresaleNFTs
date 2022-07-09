import { ethers } from "ethers";
import { Notify } from 'notiflix/build/notiflix-notify-aio';

const options = {
    timeout: 6000,
    position: 'center-bottom',
    fontSize: '18px',
    borderRadius: '10px'
}

export default function MintNftContainer(props) {
    const { nftId, nft3d, nftImage, nftPrice, nftName, nftDesc, nftCurrentSupply, nftMaxSupply, maxNftPerWallet, wallet, userBalanceMatic, userBalanceNft, signer, contract, inputId, chainId } = props
    
    async function purchase() {

      if(!nftId || !nftCurrentSupply || !nftMaxSupply || !maxNftPerWallet || !wallet || !userBalanceMatic || !userBalanceNft || !signer || !contract) {
        Notify.failure('Conectar Billetera', options)
        return false
      }

      if(chainId != 137) {
        Notify.failure('Conectarse a Polygon Mainnet', options)
        return false
      }

      if(nftCurrentSupply >= nftMaxSupply) {
        Notify.failure('Suministro Total Alcanzado', options)
        return false
      }

      const input = document.querySelector('#'+inputId)

      if(!Number.isInteger(parseInt(input.value)) || parseInt(input.value) == 0 || input.value.length == 0) {
        Notify.failure('Ingrese Números Enteros', options);
        return false
      }
      
      const purchaseAmountMatic = ethers.utils.parseEther((input.value*nftPrice).toString()).toString()
      const purchaseAmountNFT = parseInt(input.value)+parseInt(userBalanceNft)
      const userBalance = userBalanceMatic.toString()
      
      if(purchaseAmountNFT >= maxNftPerWallet) {
        Notify.failure('Máximo Compra Alcanzado', options)
        return false
      }

      if(ethers.utils.formatEther(purchaseAmountMatic)*1 > ethers.utils.formatEther(userBalance)*1) {
        Notify.failure('Balance Insuficiente', options)
        return false
      }

      Notify.info('Confirmar Transacción', options)
      
      const signerTX = contract.connect(signer)
      const approveTX = await signerTX.purchase(nftId, input.value, {value: purchaseAmountMatic})
      
      await approveTX.wait()

      if(!approveTX) {
        Notify.failure('Error Transacción', options)
        return false
      }

      input.value = ''
      Notify.info('Transacción Realizada Exitosamente', options)
  }

    return (
      <>
        <div className="card w-96 bg-base-300 flex-grow shadow-xl">
          <figure><img src={nftImage} alt="Shoes" /></figure>
          
          <iframe src={nft3d} frameBorder="0" className="h-90" allowFullScreen></iframe>


          <div className="card-body">
            <h2 className="card-title">
             {nftName}
              <div className="badge badge-primary">{nftPrice} MATIC</div>
            </h2>
            <p>{nftDesc}</p>
            
            <hr className="mt-3 mb-3" />

            {maxNftPerWallet && nftMaxSupply && nftCurrentSupply && nftPrice ? (
              <>
                <li><strong>Compra Máxima:</strong> {maxNftPerWallet} NFT por billetera.</li>
                <li><strong>Suministro Máximo:</strong> {nftMaxSupply} NFTs.</li>
                <li><strong>Suministro Actual:</strong> {nftCurrentSupply} NFTs.</li>
                <li><strong>Precio:</strong> {nftPrice} Matic.</li>
                <li><strong>Red:</strong> Polygon mainnet.</li>

                <div className="form-control mt-3 mb-3">
                    <label className="label">
                        <span className="label-text">Ingresar cantidad NFTs: </span>
                    </label>
                    <label className="input-group">
                        <input type="text" placeholder="3" id={inputId} className="input input-bordered  w-full" />
                        <button className="btn" onClick={purchase}>
                        Comprar
                        </button>
                    </label>
                </div>
              </>
            ) : (
              <progress className="progress"></progress>
            )}
            
            <div className="card-actions justify-end">
              <div className="badge badge-outline"><a href="https://polygonscan.com/address/0x78C7b170d37Ddf69d728686bfcE7879AD08C5587" target="_blank" rel="noopener noreferrer">Ver Contrato</a></div> 
              <div className="badge badge-outline"><a href="https://opensea.io/collection/criptomuonline" target="_blank" rel="noopener noreferrer">Ver OpenSea</a></div>
            </div>
          </div>
        </div>

      </>
    )
  }
  