"use server";

import { getRootAgent } from "@/agents";
import { analyzeWallet } from "@/agents/evidenceAgent";

export async function askSherlock(message: string): Promise<string> {
	try {
		// If message contains a wallet address, analyze it first
		const walletMatch = message.match(/0x[a-fA-F0-9]{40}/);
		
		if (walletMatch) {
			const walletAddress = walletMatch[0];
			const evidence = await analyzeWallet(walletAddress);
			
			// Return the evidence directly in a detective style
			return `Ah, most interesting. I have completed my investigation of wallet ${walletAddress}.

${evidence}

The evidence speaks for itself, Watson. What conclusions do you draw?`;
		}

		// For regular conversation, use the agent
		const { runner, session } = await getRootAgent();

		const response = await runner.ask(message, {
			stream: false,
			session,
		});

		return response.text || "I must contemplate this matter further.";
	} catch (error) {
		console.error("Error in askSherlock:", error);
		return "I apologize, but I encountered an obstacle in my investigation.";
	}
}
