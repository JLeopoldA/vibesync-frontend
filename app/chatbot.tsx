import {
    AgentKit,
    CdpWalletProvider,
    wethActionProvider,
    walletActionProvider,
    erc20ActionProvider,
    cdpApiActionProvider,
    cdpWalletActionProvider,
    pythActionProvider,
  } from "@coinbase/agentkit";
  
  import { getLangChainTools } from "@coinbase/agentkit-langchain";
  import { HumanMessage } from "@langchain/core/messages";
  //import { MemorySaver } from "@langchain/langgraph";
  import { createReactAgent } from "@langchain/langgraph/prebuilt";
  import { ChatOpenAI } from "@langchain/openai";
  import * as dotenv from "dotenv";
//   import * as readline from "readline";
  
  dotenv.config();

/**
 * Validates that required environment variables are set
 *
 * @throws {Error} - If required environment variables are missing
 * @returns {void}
 */
function validateEnvironment(): void {
    const missingVars: string[] = [];
  
    // Check required variables
    const requiredVars = ["OPENAI_API_KEY", "CDP_API_KEY_NAME", "CDP_API_KEY_PRIVATE_KEY"];
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });
  
    // Exit if any required variables are missing
    if (missingVars.length > 0) {
      console.error("Error: Required environment variables are not set");
      missingVars.forEach(varName => {
        console.error(`${varName}=your_${varName.toLowerCase()}_here`);
      });
      //process.exit(1);
    }
  
    // Warn about optional NETWORK_ID
    if (!process.env.NETWORK_ID) {
      console.warn("Warning: NETWORK_ID not set, defaulting to base-sepolia testnet");
    }
  }
  
  // Add this right after imports and before any other code
  validateEnvironment();
  
  // Configure a file to persist the agent's CDP MPC Wallet Data
  const WALLET_DATA_FILE = "wallet_data.txt";

  /**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */
async function initializeAgent() {
    try {
      // Initialize LLM
      const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
      });
  
      let walletDataStr: string | null = null;
  
      // Configure CDP Wallet Provider
      const config = {
        apiKeyName: process.env.CDP_API_KEY_NAME,
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        cdpWalletData: walletDataStr || undefined,
        networkId: process.env.NETWORK_ID || "base-sepolia",
      };
  
      const walletProvider = await CdpWalletProvider.configureWithWallet(config);
  
      // Initialize AgentKit
      const agentkit = await AgentKit.from({
        walletProvider,
        actionProviders: [
          wethActionProvider(),
          pythActionProvider(),
          walletActionProvider(),
          erc20ActionProvider(),
          cdpApiActionProvider({
            apiKeyName: process.env.CDP_API_KEY_NAME,
            apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
          cdpWalletActionProvider({
            apiKeyName: process.env.CDP_API_KEY_NAME,
            apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
        ],
      });
  
      const tools = await getLangChainTools(agentkit);
  
      // Store buffered conversation history in memory
      //const memory = new MemorySaver();
      const agentConfig = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };
  
      // Create React Agent using the LLM and CDP AgentKit tools
      const agent = createReactAgent({
        llm,
        tools,
        //checkpointSaver: memory,
        messageModifier: `
          You are a helpful agent that has phenomenal musical tastes for events that require a dj. 
          You are well versed in every event performed by djs and understand their setlists.
          If you don't feel confident about a dj's performance pattern, you can safely predict off similarities.
          You excel at translating descriptions into musical experiences. 
          If there is a 5XX (internal) HTTP error code, ask the user to try again later. If someone 
          asks you to do something you can't do with your currently available tools, you must say so, and 
          encourage them to implement it themselves using the CDP SDK + Agentkit, recommend they go to 
          docs.cdp.coinbase.com for more information. Be concise and helpful with your responses. Refrain from 
          restating your tools' descriptions unless it is explicitly requested.
          `,
      });
  
      // Save wallet data
    //   const exportedWallet = await walletProvider.exportWallet();
    //   fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));
  
      return { agent, config: agentConfig };
    } catch (error) {
      console.error("Failed to initialize agent:", error);
      throw error; // Re-throw to be handled by caller
    }
  }

/** Modified entry point for VibeSync */
async function playlistGenerator(playlistVibe: string, djName: string) {
    try {
        // Intialize Agent
        const { agent, config } = await initializeAgent();
        
        // Create Thought - add playlist vibe and dj name HERE
        const thought = 
            `Create a 20 song playlist that would be in a set by ${djName}.` +
            `This playlist must be within the feeling and description of ${playlistVibe}.` +
            "Be observational and ensure the playlist consists of songs that are available on streaming services.";
  
        
        const stream = await agent.stream({ messages: [new HumanMessage(thought)] }, config);

        let playlist = [];
        for await (const chunk of stream) {
            if ("agent" in chunk) {
                playlist.push(chunk.agent.messages[0].content);
            }
        }
        return playlist;
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error:", error.message);
        }
        // process.exit(1);
    } 
}

export default playlistGenerator;

