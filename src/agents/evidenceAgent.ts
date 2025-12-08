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
import {
	searchWalletReputation,
	generateReputationSummary,
} from "./utils/webSearch";

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

			// SCAM PATTERN 1: Vanity address (lots of zeros or repeated patterns)
			const addressLower = walletAddress.toLowerCase();
			const zeroCount = (addressLower.match(/0/g) || []).length;
			if (zeroCount >= 8 || /(.)\1{5,}/.test(addressLower)) {
				highRiskPatterns.push(
					"⚠️ VANITY ADDRESS DETECTED: Address contains suspicious patterns (excessive zeros or repeated characters). Often used by scammers to impersonate legitimate contracts."
				);
				riskIndicators.exploitContractInteraction = true;
			}

			// SCAM PATTERN 2: New wallet high activity
			if (daysOld < 7 && transactions.length > 50) {
				riskIndicators.newWalletPattern = true;
				highRiskPatterns.push(
					"⚠️ NEW WALLET BURST ACTIVITY: High transaction volume within 7 days of creation. Common in pump-and-dump or rug pull schemes.",
				);
			}

			// SCAM PATTERN 3: Extreme volume spike
			if (totalIn > 100 || totalOut > 100) {
				riskIndicators.highVolumeSpike = true;
				highRiskPatterns.push(
					`⚠️ HIGH VOLUME SPIKE: ${totalIn.toFixed(2)} ETH received, ${totalOut.toFixed(2)} ETH sent. Potential money laundering or fraud operation.`,
				);
			}

			// SCAM PATTERN 4: Many small incoming transactions (possible airdrop scam)
			const smallIncoming = transactions.filter(tx => {
				const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
				const value = Number.parseInt(tx.value) / 1e18;
				return isIncoming && value > 0 && value < 0.001;
			});
			if (smallIncoming.length > 20) {
				highRiskPatterns.push(
					`⚠️ DUST ATTACK PATTERN: ${smallIncoming.length} tiny incoming transactions detected. Often used to track wallets or execute airdrop scams.`
				);
			}

			// SCAM PATTERN 5: Rapid drain pattern (funds in, immediately out)
			const rapidDrains = transactions.filter((tx, idx) => {
				if (idx === 0) return false;
				const prevTx = transactions[idx - 1];
				const timeDiff = Number.parseInt(tx.timeStamp) - Number.parseInt(prevTx.timeStamp);
				const isOutgoing = tx.from.toLowerCase() === walletAddress.toLowerCase();
				return isOutgoing && timeDiff < 300; // Within 5 minutes
			});
			if (rapidDrains.length > 5) {
				highRiskPatterns.push(
					`⚠️ RAPID DRAIN PATTERN: ${rapidDrains.length} transactions sent within minutes of receiving funds. Classic phishing/scam wallet behavior.`
				);
			}

			// SCAM PATTERN 6: One-way flow (only receiving or only sending)
			if (totalIn > 0.1 && totalOut === 0) {
				highRiskPatterns.push(
					"⚠️ HONEYPOT PATTERN: Wallet only receives funds, never sends. Possible scam accumulation address."
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

		// Perform web reputation search
		console.log("[Evidence Agent] Searching web for wallet reputation...");
		const webSearchResults = await searchWalletReputation(walletAddress);
		const reputationSummary = generateReputationSummary(webSearchResults);
		const scamReports = webSearchResults.filter(r => r.isScam).length;

		evidence.webReputation = {
			summary: reputationSummary,
			scamReports,
			sources: webSearchResults.map(r => r.source),
		};

		// Generate detailed conclusion with reasoning
		const conclusion = generateDetailedConclusion(evidence, scamReports);
		evidence.conclusion = conclusion;

		console.log(
			`[Evidence Agent] Analysis complete. Risk Score: ${conclusion.riskScore}/100, Verdict: ${conclusion.verdict}`,
		);

		return JSON.stringify(evidence, null, 2);
}

/**
 * Generate a detailed, multi-paragraph conclusion with clear reasoning
 */
function generateDetailedConclusion(
	evidence: EvidenceSummary,
	scamReports: number
): {
	verdict: "HIGH RISK - LIKELY SCAM" | "MODERATE RISK - SUSPICIOUS" | "LOW RISK - APPEARS LEGITIMATE" | "INCONCLUSIVE";
	riskScore: number;
	reasoning: string;
} {
	let riskScore = 0;
	const reasoningParts: string[] = [];

	// === SECTION 1: Transaction Pattern Analysis ===
	let patternAnalysis = "**TRANSACTION PATTERN ANALYSIS:**\n\n";
	
	if (evidence.txCount === 0) {
		patternAnalysis += "This wallet has no recorded transaction history, making it impossible to assess behavioral patterns. ";
		riskScore += 10;
	} else {
		const walletAge = evidence.detailedAnalysis?.walletAge || 0;
		const avgTxValue = Number.parseFloat(evidence.detailedAnalysis?.averageTxValue || "0");
		const netFlow = Number.parseFloat(evidence.detailedAnalysis?.netFlow || "0");
		const frequency = Number.parseFloat(evidence.detailedAnalysis?.transactionFrequency || "0");

		patternAnalysis += `The wallet has been active for ${walletAge} days with ${evidence.txCount} transactions across ${evidence.uniqueCounterparties} unique addresses. `;

		if (walletAge < 7 && evidence.txCount > 50) {
			patternAnalysis += "The account shows abnormally high burst activity for a new wallet, processing large transaction volumes within days of creation. This is a classic signature of automated scam operations or pump-and-dump schemes. ";
			riskScore += 30;
		} else if (walletAge < 30) {
			patternAnalysis += "As a relatively new wallet, its transaction history is limited for comprehensive analysis. ";
			riskScore += 10;
		} else {
			patternAnalysis += "The wallet age suggests established activity. ";
		}

		if (frequency > 10) {
			patternAnalysis += `With ${frequency.toFixed(1)} transactions per day, this represents high-frequency trading or automated bot behavior. `;
			riskScore += 15;
		}

		if (Math.abs(netFlow) > 50) {
			patternAnalysis += `The net flow of ${netFlow} ETH indicates significant fund movement through this address. `;
			if (netFlow > 0) {
				patternAnalysis += "Accumulation of funds without corresponding outflows is sometimes seen in honeypot scams. ";
				riskScore += 20;
			} else {
				patternAnalysis += "Large outflows could indicate fund drainage operations. ";
				riskScore += 15;
			}
		}
	}

	reasoningParts.push(patternAnalysis);

	// === SECTION 2: Risk Factor Assessment ===
	let riskFactorAnalysis = "\n**RISK FACTOR ASSESSMENT:**\n\n";
	const riskFactors = evidence.highRiskPatterns;

	if (riskFactors.length === 0) {
		riskFactorAnalysis += "No automated risk patterns were detected in the transaction analysis. ";
	} else {
		riskFactorAnalysis += `${riskFactors.length} high-risk behavioral patterns were identified:\n\n`;
		
		for (const pattern of riskFactors) {
			riskFactorAnalysis += `- ${pattern}\n`;
			
			// Score individual patterns
			if (pattern.includes("VANITY ADDRESS")) riskScore += 25;
			if (pattern.includes("RAPID DRAIN")) riskScore += 30;
			if (pattern.includes("DUST ATTACK")) riskScore += 20;
			if (pattern.includes("HONEYPOT")) riskScore += 35;
			if (pattern.includes("HIGH VOLUME SPIKE")) riskScore += 20;
			if (pattern.includes("NEW WALLET BURST")) riskScore += 25;
		}
	}

	if (evidence.riskIndicators.mixerUsage) {
		riskFactorAnalysis += "\nInteraction with cryptocurrency mixers detected. While mixers have legitimate privacy use cases, they are heavily associated with money laundering and concealing illicit fund sources. ";
		riskScore += 25;
	}

	if (evidence.riskIndicators.cexInteraction) {
		riskFactorAnalysis += "\nThe wallet has interacted with centralized exchanges (CEX), which typically require KYC verification. This can be a legitimacy indicator, though scammers sometimes use exchanges to cash out. ";
		riskScore -= 10; // Lower risk slightly
	}

	reasoningParts.push(riskFactorAnalysis);

	// === SECTION 3: Web Reputation & Community Intelligence ===
	let webReputationAnalysis = "\n**WEB REPUTATION & COMMUNITY INTELLIGENCE:**\n\n";

	if (scamReports > 0) {
		webReputationAnalysis += `🚨 CRITICAL: ${scamReports} independent scam report(s) found in public databases. `;
		webReputationAnalysis += evidence.webReputation?.summary || "";
		webReputationAnalysis += "\n\nCommunity-reported scams represent verified incidents where this wallet was involved in fraudulent activity. Multiple independent reports significantly increase confidence in malicious intent. ";
		riskScore += 40; // Heavy penalty for confirmed scam reports
	} else {
		webReputationAnalysis += "No public scam reports were found in community databases (Etherscan labels, ChainAbuse, pattern analysis). ";
		webReputationAnalysis += "However, absence of reports does not guarantee legitimacy - many scams go unreported, and new operations may not yet be documented. ";
	}

	reasoningParts.push(webReputationAnalysis);

	// === SECTION 4: Final Verdict & Confidence ===
	let finalVerdict = "\n**FINAL VERDICT:**\n\n";
	
	// Cap risk score at 100
	riskScore = Math.min(100, riskScore);

	let verdict: "HIGH RISK - LIKELY SCAM" | "MODERATE RISK - SUSPICIOUS" | "LOW RISK - APPEARS LEGITIMATE" | "INCONCLUSIVE";

	if (riskScore >= 70) {
		verdict = "HIGH RISK - LIKELY SCAM";
		finalVerdict += "Based on the cumulative evidence - behavioral anomalies, suspicious transaction patterns, and community reports - this wallet exhibits characteristics strongly associated with fraudulent operations. ";
		finalVerdict += "The risk score of " + riskScore + "/100 places it in the high-risk category. ";
		finalVerdict += "**RECOMMENDATION: Avoid all interactions with this address. Do not send funds or approve token transactions.**";
	} else if (riskScore >= 40) {
		verdict = "MODERATE RISK - SUSPICIOUS";
		finalVerdict += "The wallet demonstrates several concerning patterns that warrant caution. ";
		finalVerdict += "While not conclusively fraudulent, the risk score of " + riskScore + "/100 suggests suspicious activity that deviates from typical legitimate wallet behavior. ";
		finalVerdict += "**RECOMMENDATION: Exercise extreme caution. Conduct additional due diligence before any interactions.**";
	} else if (riskScore >= 20) {
		verdict = "LOW RISK - APPEARS LEGITIMATE";
		finalVerdict += "The analysis reveals minimal risk indicators. ";
		finalVerdict += "With a risk score of " + riskScore + "/100, the wallet's behavior aligns more closely with legitimate use patterns. ";
		finalVerdict += "**RECOMMENDATION: Standard caution advised. Always verify contract interactions and use small test transactions.**";
	} else {
		verdict = "INCONCLUSIVE";
		finalVerdict += "Insufficient data or ambiguous patterns prevent a definitive risk assessment. ";
		finalVerdict += "The risk score of " + riskScore + "/100 reflects limited observable indicators. ";
		finalVerdict += "**RECOMMENDATION: Gather additional information before making decisions. Monitor for emerging patterns.**";
	}

	reasoningParts.push(finalVerdict);

	return {
		verdict,
		riskScore,
		reasoning: reasoningParts.join("\n"),
	};
}
