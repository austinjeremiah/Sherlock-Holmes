"use server";

import { getRootAgent } from "@/agents";
import { analyzeWallet } from "@/agents/evidenceAgent";

export async function askSherlock(message: string): Promise<string> {
	try {
		// If message contains a wallet address, analyze it first
		const walletMatch = message.match(/0x[a-fA-F0-9]{40}/);
		
		if (walletMatch) {
			const walletAddress = walletMatch[0];
			const evidenceJson = await analyzeWallet(walletAddress);
			const evidence = JSON.parse(evidenceJson);
			
			// Format as a proper detective report
			let report = `**INVESTIGATION REPORT**\n\n`;
			report += `**Subject Wallet:** ${evidence.wallet}\n`;
			report += `**Chain:** ${evidence.chain}\n`;
			report += `**Active Period:** ${new Date(evidence.firstSeen).toLocaleDateString()} to ${new Date(evidence.lastSeen).toLocaleDateString()}\n\n`;
			
			report += `**TRANSACTION SUMMARY**\n`;
			report += `• Total Transactions: ${evidence.txCount}\n`;
			report += `• Funds Received: ${evidence.totalIn} ETH\n`;
			report += `• Funds Sent: ${evidence.totalOut} ETH\n`;
			report += `• Unique Counterparties: ${evidence.uniqueCounterparties}\n\n`;
			
			report += `**RISK ASSESSMENT**\n`;
			if (evidence.riskIndicators.cexInteraction) report += `✓ Exchange Interaction Detected\n`;
			if (evidence.riskIndicators.mixerUsage) report += `⚠️ MIXER USAGE DETECTED - HIGH RISK\n`;
			if (evidence.riskIndicators.highVolumeSpike) report += `⚠️ High Volume Spike Detected\n`;
			if (evidence.riskIndicators.newWalletPattern) report += `⚠️ New Wallet with High Activity\n`;
			if (!evidence.riskIndicators.mixerUsage && !evidence.riskIndicators.highVolumeSpike && !evidence.riskIndicators.newWalletPattern) {
				report += `✓ No major red flags detected\n`;
			}
			
			if (evidence.highRiskPatterns.length > 0) {
				report += `\n**SUSPICIOUS PATTERNS:**\n`;
				evidence.highRiskPatterns.forEach((pattern: string) => {
					report += `⚠️ ${pattern}\n`;
				});
			}
			
			report += `\n**COUNTERPARTIES:**\n`;
			evidence.graph.nodes.forEach((node: any) => {
				if (node.type !== 'target') {
					const edge = evidence.graph.edges.find((e: any) => e.target === node.id);
					const typeLabel = node.type === 'cex' ? ' Exchange' : 
									  node.type === 'mixer' ? ' Mixer' :
									  node.type === 'contract' ? ' Contract' : ' Wallet';
					report += `• ${typeLabel}: ${node.id}\n`;
					report += `  └─ ${edge?.txCount || 0} transactions, ${edge?.totalValue || 0} ETH total\n`;
				}
			});
			
			report += `\n**CONCLUSION:**\n`;
			report += evidence.riskIndicators.mixerUsage 
				? `The subject has engaged in suspicious activity through privacy mixers. Further investigation warranted.`
				: evidence.riskIndicators.cexInteraction
				? `The subject appears to be a legitimate user conducting standard exchange transactions.`
				: `The subject exhibits normal wallet behavior with no significant risk indicators.`;
			
			return report;
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
