'use client';

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Wallet, ConnectWallet, ConnectWalletText } from "@coinbase/onchainkit/wallet";
import { TransactionDefault } from "@coinbase/onchainkit/transaction";
import PlaylistGenerator from '../../chatbot';

const BASE_SEPOLIA_CHAIN_ID = 84532;

const NFT_MINT_ABI = [
  {
    "type": "function",
    "name": "mint",
    "inputs": [
      {
        "name": "data",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_tokenURI",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
];

const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/95666/vibesync-subgraph/version/latest";
const METADATA_URI = "https://devnet.irys.xyz/tx/94TNg3UUKyZ96Dj8eSo9DVkBiivAz9jT39jjMFeTFvm3/data";

export default function ShowDetailsPage() {
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingDetails, setViewingDetails] = useState(true);
  const [inputVibe, setInputVibe] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [vibeText, setVibeText] = useState("");
  const router = useRouter();
  const { id } = useParams();
 
  function createPlaylist(playlistVibe: string, dj: string) {
      // let playlist = PlaylistGenerator(playlistVibe, dj);
      // console.log(playlist);
      console.log(playlistVibe, dj);
      // Vibe is Nostalgic
      let playlist = [
        ["Avicii", "Levels"],
        ["Swedish House Mafia", "Don't Worry Child"],
        ["Martin Garrix", "Animals"],
        ["Calvin Harris", "Feel So Close"],
        ["Zedd", "Clarity (ft. Foxes)"],
        ["David Guetta", "Titanium (ft. Sia)"],
        ["Hardwell", "Spaceman"],
        ["DVBBS & Borgeous", "Tsunami"],
        ["R3HAB", "Samurai (Go Hard)"],
        ["KSHMR", "Secrets (ft. Vassy)"],
        ["W&W", "Bigfoot"],
        ["Nicky Romero", "Toulouse"],
        ["Alesso", "Heroes (We Could Be)[ft. Tove Lo]"],
        ["Showtek", "Booyah"],
        ["Blasterjaxx", "Faith"],
        ["Tiesto", "Red Lights"],
        ["Dada Life", "Kick Out the Epic Motherf****r"],
        ["Axwell /\ Ingrosso", "More Than You Know"],
        ["Steve Aoki & Chris Lake", "Boneless"],
        ["DJ KURA", "Rave"]
      ];
      console.log(playlist);
  }

  useEffect(() => {
    async function fetchShowDetails() {
      const SHOW_DETAILS_QUERY = `{
        collection(id: "${id}") {
          date
          djName
          genre
          location
          showTitle
          startTime
          collectionAddress
        }
      }`;
      try {
        const response = await fetch(SUBGRAPH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: SHOW_DETAILS_QUERY }),
        });
        const { data } = await response.json();
        setShow(data.collection);
      } catch (error) {
        console.error("Error fetching show details:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchShowDetails();
    }
  }, [id]);

  if (loading) {
    return <p className="mt-6 text-white">Loading show details...</p>;
  }

  if (!show) {
    return <p className="mt-6 text-white">Show not found.</p>;
  }

  return (
    <div className="bg-black min-h-screen text-white flex flex-col items-center justify-center p-6">
      {viewingDetails ? (
        <div className="p-6 bg-gray-800 rounded-lg text-center w-full max-w-2xl">
          <h1 className="text-3xl font-bold mb-4">{show.showTitle}</h1>
          <p className="text-lg text-gray-400">Date: {show.date}</p>
          <p className="text-lg text-gray-400">Start Time: {show.startTime}</p>
          <p className="text-lg text-gray-400">DJ: {show.djName}</p>
          <p className="text-lg text-gray-400">Genre: {show.genre}</p>
          <p className="text-lg text-gray-400">Location: {show.location}</p>
          <p className="text-lg text-gray-400">Collection Address: {show.collectionAddress}</p>
          
          <button 
            onClick={() => { setViewingDetails(false); setInputVibe(true); }}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full text-white text-lg font-medium hover:shadow-lg hover:opacity-90 transition ease-in-out duration-300"
          >
            Get Your (NFT) Ticket
          </button>
          <button 
            onClick={() => router.push("/shows")}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full text-white text-lg font-medium hover:shadow-lg hover:opacity-90 transition ease-in-out duration-300"
          >
            Back to Shows
          </button>
        </div>
      ) : inputVibe ? (
        <div className="p-6 bg-gray-800 rounded-lg text-center w-full max-w-2xl">
          <h1 className="text-3xl font-bold mb-4">How it Works</h1>
          <p className="text-lg text-gray-400 mb-2">1. Connect your wallet</p>
          <p className="text-lg text-gray-400 mb-2">2. Share your vibe</p>
          <p className="text-lg text-gray-400 mb-2">3. Mint your NFT ticket</p>
          <p className="text-lg text-gray-400 mb-2">4. Enjoy the music!</p>
          <div className="flex justify-center mt-4">
            <Wallet>
              <ConnectWallet className="mt-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full text-white hover:shadow-lg hover:opacity-90 transition ease-in-out duration-300" />
              <ConnectWalletText>Connect Wallet</ConnectWalletText>
            </Wallet>
          </div>
          <input
            type="text"
            className="w-full p-3 mt-3 text-black rounded-md"
            placeholder="Enter your vibe..."
            value={vibeText}
            onChange={(e) => setVibeText(e.target.value)}
          />
          <TransactionDefault
            chainId={BASE_SEPOLIA_CHAIN_ID}
            calls={[{
              address: show.collectionAddress,
              abi: NFT_MINT_ABI,
              functionName: "mint",
              args: [vibeText, METADATA_URI]
            }]}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full text-white text-lg font-medium hover:shadow-lg hover:opacity-90 transition ease-in-out duration-300"
            onSuccess={() => { setMintSuccess(true); setInputVibe(false); createPlaylist(vibeText, show.djName); }}
          >
            Submit
          </TransactionDefault>
          <button
            onClick={() => { setInputVibe(false); setViewingDetails(true); createPlaylist(vibeText, show.djName)}}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full text-white text-lg font-medium hover:shadow-lg hover:opacity-90 transition ease-in-out duration-300"
          >
            Back to Show Details
          </button>
        </div>
      ) : mintSuccess ? (
        <div className="p-6 bg-gray-800 rounded-lg text-center w-full max-w-2xl">
          <h1 className="text-3xl font-bold mb-4">Mint Successful!</h1>
          <p className="text-lg text-gray-400 mb-2">Your NFT has been successfully minted!</p>
          <p className="text-lg text-gray-400 mb-4">You can view it on your wallet or on the blockchain explorer.</p>
          <button 
            onClick={() => router.push("/shows")}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full text-white text-lg font-medium hover:shadow-lg hover:opacity-90 transition ease-in-out duration-300"
          >
            Back to Shows
          </button>
          <button 
            onClick={() => router.push("/tickets")}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full text-white text-lg font-medium hover:shadow-lg hover:opacity-90 transition ease-in-out duration-300"
          >
            View Your Tickets
          </button>
        </div>
      ) : null}
    </div>
  );
}
