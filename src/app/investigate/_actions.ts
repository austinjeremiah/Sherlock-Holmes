"use server";

import { getRootAgent } from "@/agents";
import { analyzeWallet } from "@/agents/evidenceAgent";

interface GraphNode {
	id: string;
	type: "target" | "wallet" | "cex" | "mixer" | "contract";
	label?: string;
	riskLevel?: "low" | "medium" | "high";
}

interface GraphEdge {
	source: string;
	target: string;
	txCount: number;
	totalValue: string;
	risk?: "low" | "medium" | "high";
}

export interface SherlockResponse {
	text: string;
	graph?: {
		nodes: (GraphNode & { 
			txCount?: number; 
			ethVolume?: string;
			connections?: number;
		})[];
		edges: GraphEdge[];
	};
}

export async function askSherlock(message: string): Promise<SherlockResponse> {
	try {
		// If message contains a wallet address, analyze it first
		const walletMatch = message.match(/0x[a-fA-F0-9]{40}/);
		
		if (walletMatch) {
			const walletAddress = walletMatch[0];
			const evidenceJson = await analyzeWallet(walletAddress);
			const evidence = JSON.parse(evidenceJson);
			
			// Format as a proper detective report
			let report = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			report += `        BLOCKCHAIN FORENSICS REPORT\n`;
			report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			
			report += `SUBJECT WALLET\n`;
			report += `  ${evidence.wallet}\n\n`;
			
			report += `NETWORK: ${evidence.chain}\n`;
			report += `ACTIVE: ${new Date(evidence.firstSeen).toLocaleDateString()} → ${new Date(evidence.lastSeen).toLocaleDateString()}\n\n`;
			
			report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			report += `TRANSACTION SUMMARY\n`;
			report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			report += `  Total Transactions: ${evidence.txCount}\n`;
			report += `  Funds Received:     ${evidence.totalIn} ETH\n`;
			report += `  Funds Sent:         ${evidence.totalOut} ETH\n`;
			report += `  Counterparties:     ${evidence.uniqueCounterparties}\n\n`;
			
			if (evidence.detailedAnalysis) {
				report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
				report += `DETAILED ANALYSIS\n`;
				report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
				report += `  Wallet Age:         ${evidence.detailedAnalysis.walletAge} days\n`;
				report += `  Net Flow:           ${evidence.detailedAnalysis.netFlow} ETH\n`;
				report += `  Average Tx Value:   ${evidence.detailedAnalysis.averageTxValue} ETH\n`;
				report += `  Tx Frequency:       ${evidence.detailedAnalysis.transactionFrequency} txs/day\n`;
				report += `  Largest Tx:         ${evidence.detailedAnalysis.largestTransaction} ETH\n`;
				report += `  Smallest Tx:        ${evidence.detailedAnalysis.smallestTransaction} ETH\n\n`;
			}
			
			report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			report += `RISK ASSESSMENT\n`;
			report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			if (evidence.riskIndicators.mixerUsage) report += `  ⚠️  MIXER USAGE - HIGH RISK\n`;
			if (evidence.riskIndicators.highVolumeSpike) report += `  ⚠️  High Volume Spike\n`;
			if (evidence.riskIndicators.newWalletPattern) report += `  ⚠️  New Wallet High Activity\n`;
			if (evidence.riskIndicators.cexInteraction) report += `  ✓  Exchange Interaction\n`;
			if (!evidence.riskIndicators.mixerUsage && !evidence.riskIndicators.highVolumeSpike && !evidence.riskIndicators.newWalletPattern) {
				report += `  ✓  No Major Red Flags\n`;
			}
			
			if (evidence.highRiskPatterns.length > 0) {
				report += `\nSUSPICIOUS PATTERNS:\n`;
				evidence.highRiskPatterns.forEach((pattern: string) => {
					report += `  ⚠️  ${pattern}\n`;
				});
			}
			report += `\n`;
			
			report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			report += `KNOWLEDGE GRAPH\n`;
			report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			
			// Build ASCII knowledge graph
			report += `                [TARGET WALLET]\n`;
			report += `                ${evidence.wallet}\n`;
			report += `                       |\n`;
			
			const nodes = evidence.graph.nodes.filter((n: any) => n.type !== 'target');
			nodes.forEach((node: any, index: number) => {
				const edge = evidence.graph.edges.find((e: any) => e.target === node.id);
				const isLast = index === nodes.length - 1;
				const branch = isLast ? '└──' : '├──';
				
				let typeIcon = '';
				let typeName = '';
				if (node.type === 'cex') {
					typeIcon = '🏦';
					typeName = 'EXCHANGE';
				} else if (node.type === 'mixer') {
					typeIcon = '⚠️';
					typeName = 'MIXER';
				} else if (node.type === 'contract') {
					typeIcon = '📄';
					typeName = 'CONTRACT';
				} else {
					typeIcon = '👤';
					typeName = 'WALLET';
				}
				
				report += `                       |\n`;
				report += `                ${branch}─[${typeIcon} ${typeName}]\n`;
				report += `                       ${node.id}\n`;
				report += `                       └─> ${edge?.txCount || 0} txs | ${edge?.totalValue || 0} ETH\n`;
			});
			
			report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			report += `WEB REPUTATION & COMMUNITY INTELLIGENCE\n`;
			report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			
			if (evidence.webReputation) {
				report += `Scam Reports Found: ${evidence.webReputation.scamReports}\n`;
				report += `Sources Checked: ${evidence.webReputation.sources.join(', ')}\n\n`;
				report += evidence.webReputation.summary + `\n`;
			} else {
				report += `No web reputation data available.\n`;
			}
			
			report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			report += `CONCLUSION\n`;
			report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			
			if (evidence.conclusion) {
				report += `\n${evidence.conclusion.verdict}\n`;
				report += `RISK SCORE: ${evidence.conclusion.riskScore}/100\n\n`;
				report += evidence.conclusion.reasoning + `\n`;
			} else {
				// Fallback to old logic if conclusion not generated
				if (evidence.riskIndicators.mixerUsage) {
					report += `⚠️  SUSPICIOUS ACTIVITY DETECTED\n`;
					report += `The subject has engaged with known privacy mixers.\n`;
					report += `Recommend: Further investigation and monitoring.\n`;
				} else if (evidence.riskIndicators.cexInteraction) {
					report += `✓  LEGITIMATE ACTIVITY\n`;
					report += `Standard exchange transactions detected.\n`;
					report += `Risk Level: LOW\n`;
				} else {
					report += `✓  NORMAL BEHAVIOR\n`;
					report += `No significant risk indicators found.\n`;
					report += `Risk Level: LOW\n`;
				}
			}
			
			report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			report += `End of Report - Evidence Agent\n`;
			report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
			
			return {
				text: report,
				graph: {
					nodes: evidence.graph.nodes,
					edges: evidence.graph.edges
				}
			};
		}

		// For regular conversation, use the agent
		const { runner, session } = await getRootAgent();

		const response = await runner.ask(message);
		
		// Ensure we have a valid string response
		const responseText = typeof response === 'string' ? response.trim() : '';

		return {
			text: responseText || "I must contemplate this matter further."
		};
	} catch (error) {
		console.error("Error in askSherlock:", error);
		return {
			text: "I apologize, but I encountered an obstacle in my investigation."
		};
	}
}