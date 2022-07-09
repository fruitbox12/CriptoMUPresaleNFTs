import Head from 'next/head'

import { ethers } from "ethers";
import Web3Modal from "web3modal"
import WalletConnectProvider from "@walletconnect/web3-provider";
import Fortmatic from "fortmatic";

import React, { useCallback, useEffect, useState } from 'react'
import { Notify } from 'notiflix/build/notiflix-notify-aio';

import { NFT, NFT_PRESALE } from '../helpers/contracts'
import Footer from '../components/Footer';
import MintNftContainer from '../components/MintNftContainer';

const idIniciadoNFT = "0000000000000000000000000000000000000000000000000000000000000002"
const idAvanzadoNFT = "0000000000000000000000000000000000000000000000000000000000000003"
const treasuryAddress = "0x2387A9Ef973eE968d009091CF8F09A60122373B3"

const providerDefault = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/polygon")
const signerDefault = providerDefault.getSigner()
const chainIdDefault = 137

let web3Modal

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      // Mikko's test key - don't copy as your mileage may vary
      infuraId: process.env.infuraKey,
    }
  },
  fortmatic: {
    package: Fortmatic, // required
    options: {
      key: process.env.alchemyKey, // required
    }
  }
};

if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
      cacheProvider: false,
      providerOptions,
  })
}

const options = {
  timeout: 6000,
  position: 'center-bottom',
  fontSize: '18px',
  borderRadius: '10px'
}

export default function Home() {
  const [injectedProvider, setInjectedProvider] = useState(providerDefault)
  const [injectedSigner, setInjectedSigner] = useState(signerDefault)
  const [injectedChainId, setInjectedChainId] = useState(chainIdDefault)
  const [address, setAddress] = useState()

  const [nftContract, setNftContract] = useState()
  const [nftPresaleContract, setNftPresaleContract] = useState()

  const [totalSupplyIniciado, setTotalSupplyIniciado] = useState()
  const [totalSupplyAvanzado, setTotalSupplyAvanzado] = useState()

  const [maxPurchaseIniciado, setMaxPurchaseIniciado] = useState()
  const [maxPurchaseAvanzado, setMaxPurchaseAvanzado] = useState()
  
  const [priceIniciado, setPriceIniciado] = useState()
  const [priceAvanzado, setPriceAvanzado] = useState()
  
  const [supplyIniciado, setSupplyIniciado] = useState()
  const [supplyAvanzado, setSupplyAvanzado] = useState()
  
  const [totalTreasuryBalance, setTotalTreasuryBalance] = useState()

  const [userMaticBalance, setUserMaticBalance] = useState()
  const [userNftIniciadoBalance, setUserNftIniciadoBalance] = useState()
  const [userNftAvanzadoBalance, setUserNftAvanzadoBalance] = useState()

  const formatNumber = (number) => {
    const amount = ethers.utils.formatEther(number)
    const calcDec = Math.pow(10, 0);

    return Math.trunc(amount * calcDec) / calcDec;
  }

  const loadContracts = async () => {
    const nftContractInstance = new ethers.Contract(NFT.address, NFT.abi, injectedProvider)
    const nftPresaleContractInstance = new ethers.Contract(NFT_PRESALE.address, NFT_PRESALE.abi, injectedProvider)
    
    setNftContract(nftContractInstance)
    setNftPresaleContract(nftPresaleContractInstance)
  }

  const loadBalances = async () => {
    if(nftContract && nftPresaleContract) {
      const totalSupplyIniciadoNFT = await nftContract.totalSupply(idIniciadoNFT)
      const totalSupplyAvanzadoNFT = await nftContract.totalSupply(idAvanzadoNFT)

      const maxPurchaseIniciadoNFT = await nftPresaleContract.getMaxPurchaseNFT(idIniciadoNFT)
      const maxPurchaseAvanzadoNFT = await nftPresaleContract.getMaxPurchaseNFT(idAvanzadoNFT)

      const priceIniciadoNFT = await nftPresaleContract.getPriceNFT(idIniciadoNFT)
      const priceAvanzadoNFT = await nftPresaleContract.getPriceNFT(idAvanzadoNFT)

      const supplyIniciadoNFT = await nftPresaleContract.getSupplyNFT(idIniciadoNFT)
      const supplyAvanzadoNFT = await nftPresaleContract.getSupplyNFT(idAvanzadoNFT)

      const treasuryBalance = await injectedProvider.getBalance(treasuryAddress)
      
      setTotalTreasuryBalance(formatNumber(treasuryBalance))
      setTotalSupplyIniciado(totalSupplyIniciadoNFT.toString())
      setTotalSupplyAvanzado(totalSupplyAvanzadoNFT.toString())
      setMaxPurchaseIniciado(maxPurchaseIniciadoNFT.toString())
      setMaxPurchaseAvanzado(maxPurchaseAvanzadoNFT.toString())
      setPriceIniciado(formatNumber(priceIniciadoNFT))
      setPriceAvanzado(formatNumber(priceAvanzadoNFT))
      setSupplyIniciado(supplyIniciadoNFT.toString())
      setSupplyAvanzado(supplyAvanzadoNFT.toString())
    }
  }

  const updateUserBalances = async () => {
    if(address && nftContract && nftPresaleContract) {
      const balanceMatic = await injectedProvider.getBalance(address)
      const balanceNftIniciado = await nftContract.balanceOf(address, idIniciadoNFT)
      const balanceNftAvanzado = await nftContract.balanceOf(address, idAvanzadoNFT)

      setUserMaticBalance(balanceMatic)
      setUserNftIniciadoBalance(balanceNftIniciado.toString())
      setUserNftAvanzadoBalance(balanceNftAvanzado.toString())
    }

  }

  const connect = async () => {
    try {
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        const address = await signer.getAddress()
        const net = await provider.getNetwork()

        connection.on("chainChanged", chainId => {
            if(chainId != 137) {
              Notify.failure('Conectarse a Polygon Mainnet', options)
            }
        })
      
        connection.on("accountsChanged", (accounts) => {
            setAddress(accounts[0])
        });
      
        connection.on("disconnect", (code, reason) => {
            disconnect()
        });

        if(net.chainId != 137) {
          Notify.failure('Conectarse a Polygon Mainnet', options)
        }

        setInjectedChainId(net.chainId)
        setInjectedProvider(provider)
        setInjectedSigner(signer)

        setAddress(address)
    } catch (error) {
  
    }
  }

  const disconnect = useCallback(async function () {
    setAddress('')
    setInjectedProvider('')
    setInjectedSigner('')
    await web3Modal.clearCachedProvider()
    location.reload()
  }, [injectedProvider])


  useEffect(() => {
    if(injectedProvider) {
      loadContracts()
    }
  }, [injectedProvider, injectedSigner])

  useEffect(() => {
    if(nftContract && nftPresaleContract) {
      loadBalances()
    }
  }, [nftContract, nftPresaleContract])
  
  useEffect(() => {
    if(address && nftContract && nftPresaleContract) {
      updateUserBalances()
    }
  }, [address, nftContract, nftPresaleContract])

  useEffect(() => {
    const interval = setInterval(async () => {
      loadBalances()
      if(address) {
        updateUserBalances()
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [address])

  return (
    <>
      <Head>
        <title>CriptoMU Online</title>
        <meta property="og:title" content="CriptoMU Online" />
        <meta name="description" content="Los NFT de pases de juego son necesarios para poder registrar sus cuentas dentro de nuestro servidor de MU Online." />
        <meta name="og:description" content="Los NFT de pases de juego son necesarios para poder registrar sus cuentas dentro de nuestro servidor de MU Online." />
        <meta property="og:url" content="https://nft.criptomu.online" />
        <meta property="og:image" content="https://nft.criptomu.online/banner_image.png" />

        <meta name="author" content="CriptoMu Online" />
        <meta name="copyright" content="CriptoMu Online" />


      </Head>

      <div className="container mt-3">
        <div className="navbar bg-base-100">
          <div className="navbar-start">
            <a className="btn btn-ghost normal-case text-xl p-0">CriptoMU NFT</a>
          </div>

          <div className="navbar-end">
            {address ? (
              <a className="btn btn-active btn-ghost" onClick={disconnect}>Desconectar</a>
            ) : (
              <a className="btn btn-secondary" onClick={connect}>Conectar Billetera</a>
            )}
          </div>
        </div>
      </div>


      <div className='container mt-4 mb-6'>
          <div className="hero bg-base-300 rounded-box ">
            <div className="hero-content text-center">
              <div className="">
                <h1 className="text-5xl font-bold">Gamepass Mint</h1>
                <p className="py-6">Los NFT de pases de juego son necesarios para poder registrar sus cuentas dentro de nuestro servidor de MU Online, los dueños de pases avanzados además de poder jugar recibirán intereses pasivos periódicos.</p>
              </div>
            </div>
          </div>
        </div>

        <div className='container mb-6'>

          {supplyAvanzado && supplyIniciado && totalSupplyAvanzado && totalSupplyIniciado ? (
              <div className="flex items-center justify-center">
              <div className="stats bg-primary text-primary-content stats-vertical lg:stats-horizontal">
    
              <div className="stat">
                  <div className="stat-title">NFTs Avanzado</div>
                  <div className="stat-value">{totalSupplyAvanzado}/{supplyAvanzado}</div>
                  <div className="stat-desc">Vendidos / Disponibles</div>
                </div>
    
                <div className="stat">
                  <div className="stat-title">NFTs Iniciado</div>
                  <div className="stat-value">{totalSupplyIniciado}/{supplyIniciado}</div>
                  <div className="stat-desc">Vendidos / Disponibles</div>
                </div>
                
                <div className="stat">
                  <div className="stat-title">Total Recaudado</div>
                  <div className="stat-value">{totalTreasuryBalance}</div>
                  <div className="stat-desc">MATIC</div>
                </div>
                
              </div>
            </div>
            ) : (
              <progress className="progress"></progress>
            )}

        </div>

      <div className='container mb-6'>
        

        <div className="flex flex-col w-full lg:flex-row">

          <MintNftContainer
            nftId={idAvanzadoNFT}
            nftPrice={priceAvanzado}
            nftName="Gamepass Avanzado"
            nftDesc="El NFT de acceso avanzado permite acceder al juego y además recibir interés pasivo en el tiempo."
            nft3d="https://spore.engineering/nft/muspore/gamepass_avanzado"
            nftImage="./gamepass_avanzado_nft_cover.png"
            inputId="inputPurchaseAvanzado"
            nftCurrentSupply={totalSupplyAvanzado}
            nftMaxSupply={supplyAvanzado}
            maxNftPerWallet={maxPurchaseAvanzado}
            wallet={address}
            userBalanceMatic={userMaticBalance}
            userBalanceNft={userNftAvanzadoBalance}
            signer={injectedSigner}
            chainId={injectedChainId}
            contract={nftPresaleContract}
          />
          <div className="divider lg:divider-horizontal"></div>
          <MintNftContainer
            nftId={idIniciadoNFT}
            nftPrice={priceIniciado}
            nftName="Gamepass Iniciado"
            nftDesc="El NFT de acceso iniciado solamente permite acceder al juego para jugar."
            nft3d="https://spore.engineering/nft/muspore/gamepass_iniciado"
            nftImage="./gamepass_basico_nft_cover.png"
            inputId="inputPurchaseIniciado"
            nftCurrentSupply={totalSupplyIniciado}
            nftMaxSupply={supplyIniciado}
            maxNftPerWallet={maxPurchaseIniciado}
            wallet={address}
            userBalanceMatic={userMaticBalance}
            userBalanceNft={userNftIniciadoBalance}
            signer={injectedSigner}
            chainId={injectedChainId}
            contract={nftPresaleContract}
          />
        </div>
      </div>

      <Footer />
    </>
  )
}
