import type {
	EvidenceSummary,
	GraphEdge,
	GraphNode,
} from "./types";
import {
	fetchTokenTransfers,
	fetchWalletBalance,
	fetchWalletTransactions,
	isKnownExchange,
	isKnownMixer,
} from "./utils/etherscan";

/**
 * Simple function to analyze a wallet and return evidence
 */
export async function analyzeWallet(walletAddress: string): Promise<string> {
		console.log(`[Evidence Agent] Starting investigation of ${walletAddress}`);

		// Fetch data from Etherscan
		const [transactions, tokenTransfers, balance] = await Promise.all([
			fetchWalletTransactions(walletAddress),
			fetchTokenTransfers(walletAddress),
			fetchWalletBalance(walletAddress),
		]);

		console.log(
			`[Evidence Agent] Found ${transactions.length} transactions, ${tokenTransfers.length} token transfers`,
		);

		// Build graph nodes and edges
		const nodes: GraphNode[] = [];
		const edges: GraphEdge[] = [];
		const counterpartyMap = new Map<
			string,
			{ txCount: number; totalValue: number }
		>();

		// Add target wallet node
		nodes.push({
			id: walletAddress.toLowerCase(),
			type: "target",
			label: "Target Wallet",
			riskLevel: "low",
		});

		// Analyze transactions
		let totalIn = 0;
		let totalOut = 0;
		const highRiskPatterns: string[] = [];
		const riskIndicators = {
			mixerUsage: false,
			newWalletPattern: false,
			highVolumeSpike: false,
			cexInteraction: false,
			exploitContractInteraction: false,
		};

		// Process normal transactions
		for (const tx of transactions) {
			const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
			const counterparty = isIncoming ? tx.from : tx.to;
			const value = Number.parseInt(tx.value) / 1e18;

			if (isIncoming) {
				totalIn += value;
			} else {
				totalOut += value;
			}

			// Track counterparties
			if (!counterpartyMap.has(counterparty)) {
				counterpartyMap.set(counterparty, { txCount: 0, totalValue: 0 });

				// Determine node type
				let nodeType: GraphNode["type"] = "wallet";
				let riskLevel: GraphNode["riskLevel"] = "low";

				if (isKnownMixer(counterparty)) {
					nodeType = "mixer";
					riskLevel = "high";
					riskIndicators.mixerUsage = true;
					highRiskPatterns.push(
						`Interaction detected with known mixer: ${counterparty}`,
					);
				} else if (isKnownExchange(counterparty)) {
					nodeType = "cex";
					riskLevel = "low";
					riskIndicators.cexInteraction = true;
				} else if (tx.input !== "0x" && tx.input.length > 10) {
					nodeType = "contract";
				}

				nodes.push({
					id: counterparty.toLowerCase(),
					type: nodeType,
					label: `${nodeType.toUpperCase()} ${counterparty.substring(0, 8)}...`,
					riskLevel,
				});
			}

			const cpData = counterpartyMap.get(counterparty);
			if (cpData) {
				cpData.txCount++;
				cpData.totalValue += value;
			}
		}

		// Create edges from counterparty data
		for (const [counterparty, data] of counterpartyMap.entries()) {
			const node = nodes.find((n) => n.id === counterparty.toLowerCase());
			const riskLevel = node?.riskLevel === "high" ? "high" : "low";

			edges.push({
				source: walletAddress.toLowerCase(),
				target: counterparty.toLowerCase(),
				txCount: data.txCount,
				totalValue: data.totalValue.toFixed(4),
				risk: riskLevel,
			});
		}
		
		// Add transaction metadata directly to each node
		for (const node of nodes) {
			if (node.type === 'target') {
				// Target wallet has all outgoing edges
				(node as any).txCount = transactions.length;
				(node as any).ethVolume = (totalIn + totalOut).toFixed(4);
				(node as any).connections = counterpartyMap.size;
			} else {
				// Find the edge for this counterparty node
				const edge = edges.find(e => e.target === node.id);
				if (edge) {
					(node as any).txCount = edge.txCount;
					(node as any).ethVolume = edge.totalValue;
					(node as any).connections = 1;
				}
			}
		}

		// Detect patterns
		if (transactions.length > 0) {
			const firstTx = transactions[0];
			const lastTx = transactions[transactions.length - 1];
			const walletAge =
				Number.parseInt(lastTx.timeStamp) - Number.parseInt(firstTx.timeStamp);
			const daysOld = walletAge / (60 * 60 * 24);

			if (daysOld < 7 && transactions.length > 50) {
				riskIndicators.newWalletPattern = true;
				highRiskPatterns.push(
					"High activity on newly created wallet (< 7 days old)",
				);
			}

			// Check for volume spikes
			if (totalIn > 100 || totalOut > 100) {
				riskIndicators.highVolumeSpike = true;
				highRiskPatterns.push(
					`High volume detected: ${totalIn.toFixed(2)} ETH in, ${totalOut.toFixed(2)} ETH out`,
				);
			}
		}

		// Build evidence summary
		const evidence: EvidenceSummary = {
			wallet: walletAddress,
			chain: "Ethereum Mainnet",
			firstSeen:
				transactions.length > 0
					? new Date(
							Number.parseInt(transactions[0].timeStamp) * 1000,
						).toISOString()
					: "Unknown",
			lastSeen:
				transactions.length > 0
					? new Date(
							Number.parseInt(
								transactions[transactions.length - 1].timeStamp,
							) * 1000,
						).toISOString()
					: "Unknown",
			totalIn: totalIn.toFixed(4),
			totalOut: totalOut.toFixed(4),
			txCount: transactions.length,
			uniqueCounterparties: counterpartyMap.size,
			highRiskPatterns,
			graph: { nodes, edges },
			riskIndicators,
			// Add detailed analysis
			detailedAnalysis: {
				walletAge: transactions.length > 0 
					? Math.floor((Number.parseInt(transactions[transactions.length - 1].timeStamp) - Number.parseInt(transactions[0].timeStamp)) / (60 * 60 * 24))
					: 0,
				averageTxValue: transactions.length > 0 ? ((totalIn + totalOut) / transactions.length).toFixed(4) : "0",
				netFlow: (totalIn - totalOut).toFixed(4),
				transactionFrequency: transactions.length > 0
					? (transactions.length / Math.max(1, Math.floor((Number.parseInt(transactions[transactions.length - 1].timeStamp) - Number.parseInt(transactions[0].timeStamp)) / (60 * 60 * 24)))).toFixed(2)
					: "0",
				largestTransaction: transactions.length > 0
					? Math.max(...transactions.map(tx => Number.parseInt(tx.value) / 1e18)).toFixed(4)
					: "0",
				smallestTransaction: transactions.length > 0
					? Math.min(...transactions.map(tx => Number.parseInt(tx.value) / 1e18).filter(v => v > 0)).toFixed(4)
					: "0",
			}
		};

		console.log(
			`[Evidence Agent] Analysis complete. Risk patterns found: ${highRiskPatterns.length}`,
		);

		return JSON.stringify(evidence, null, 2);
}
