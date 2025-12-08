import type { EvidenceSummary, ProsecutionCase } from "../types";

/**
 * Builds a prosecution case from evidence
 */
export async function buildCase(evidence: EvidenceSummary): Promise<ProsecutionCase> {
	const keyPoints: string[] = [];
	const highlightedNodes: string[] = [];
	let severityScore = 0;

	// Analyze high-risk patterns
	if (evidence.highRiskPatterns.length > 0) {
		for (const pattern of evidence.highRiskPatterns) {
			if (pattern.includes("VANITY ADDRESS")) {
				keyPoints.push("VANITY ADDRESS DECEPTION: The wallet uses a suspicious vanity address pattern, commonly employed by scammers to impersonate legitimate contracts and deceive victims.");
				highlightedNodes.push(evidence.wallet.toLowerCase());
				severityScore += 25;
			}
			if (pattern.includes("RAPID DRAIN")) {
				keyPoints.push("RAPID FUND DRAINAGE: Evidence shows funds being moved within minutes of receipt - a hallmark of phishing operations and wallet drainer exploits.");
				severityScore += 30;
			}
			if (pattern.includes("HONEYPOT")) {
				keyPoints.push("HONEYPOT ACCUMULATION: Wallet only receives funds without any outgoing transactions, consistent with scam accumulation addresses.");
				severityScore += 35;
			}
			if (pattern.includes("DUST ATTACK")) {
				keyPoints.push("DUST ATTACK PATTERN: Multiple tiny transactions detected, used for wallet tracking and potential airdrop scam setups.");
				severityScore += 20;
			}
			if (pattern.includes("NEW WALLET BURST")) {
				keyPoints.push("SUSPICIOUS BURST ACTIVITY: High transaction volume immediately after wallet creation indicates automated bot operations typical of pump-and-dump schemes.");
				severityScore += 25;
			}
			if (pattern.includes("HIGH VOLUME SPIKE")) {
				keyPoints.push(`EXTREME VOLUME MOVEMENT: ${evidence.totalIn} ETH received, ${evidence.totalOut} ETH sent - volume patterns consistent with money laundering operations.`);
				severityScore += 20;
			}
		}
	}

	// Mixer usage
	if (evidence.riskIndicators.mixerUsage) {
		keyPoints.push("MIXER CONCEALMENT: Wallet has interacted with known cryptocurrency mixers, demonstrating intent to obscure fund origins and destinations.");
		// Find mixer nodes
		const mixerNodes = evidence.graph.nodes.filter(n => n.type === "mixer");
		mixerNodes.forEach(node => highlightedNodes.push(node.id));
		severityScore += 25;
	}

	// Web reputation
	if (evidence.webReputation && evidence.webReputation.scamReports > 0) {
		keyPoints.push(`COMMUNITY-VERIFIED FRAUD: ${evidence.webReputation.scamReports} independent scam report(s) filed against this wallet in public databases. This represents verified incidents of fraudulent activity.`);
		severityScore += 40;
	}

	// Transaction pattern analysis
	if (evidence.detailedAnalysis) {
		const netFlow = Number.parseFloat(evidence.detailedAnalysis.netFlow);
		if (Math.abs(netFlow) > 50) {
			keyPoints.push(`SIGNIFICANT FUND FLOW: Net flow of ${netFlow.toFixed(2)} ETH indicates substantial financial operations through this address.`);
			severityScore += 15;
		}

		const frequency = Number.parseFloat(evidence.detailedAnalysis.transactionFrequency);
		if (frequency > 10) {
			keyPoints.push(`AUTOMATED OPERATIONS: ${frequency.toFixed(1)} transactions per day suggests bot-driven activity rather than organic human usage.`);
			severityScore += 15;
		}
	}

	// Build narrative
	const narrative = buildProsecutionNarrative(evidence, keyPoints, severityScore);

	// Cap severity score
	severityScore = Math.min(100, severityScore);

	return {
		keyPoints,
		narrative,
		highlightedNodes,
		severityScore,
	};
}

/**
 * Builds a compelling prosecution narrative
 */
function buildProsecutionNarrative(
	evidence: EvidenceSummary,
	keyPoints: string[],
	severityScore: number
): string {
	let narrative = "THE PROSECUTION'S CASE:\n\n";

	narrative += `The evidence against wallet ${evidence.wallet} is compelling and multifaceted. `;
	
	if (keyPoints.length === 0) {
		narrative += "While direct high-risk patterns are limited, the cumulative behavioral profile warrants scrutiny. ";
		narrative += "The lack of obvious red flags does not eliminate the possibility of sophisticated concealment tactics. ";
	} else {
		narrative += `This investigation has uncovered ${keyPoints.length} distinct indicators of fraudulent intent:\n\n`;
		
		keyPoints.forEach((point, index) => {
			narrative += `${index + 1}. ${point}\n\n`;
		});
	}

	// Add temporal analysis
	if (evidence.detailedAnalysis && evidence.detailedAnalysis.walletAge < 30) {
		narrative += "TEMPORAL ANALYSIS: ";
		narrative += `This wallet has been active for only ${evidence.detailedAnalysis.walletAge} days. `;
		narrative += "The brief operational window combined with suspicious activity patterns suggests a deliberate, time-limited fraudulent operation. ";
		narrative += "Scammers often create wallets for specific campaigns and abandon them after achieving their objectives.\n\n";
	}

	// Add web reputation evidence
	if (evidence.webReputation && evidence.webReputation.scamReports > 0) {
		narrative += "COMMUNITY INTELLIGENCE: ";
		narrative += evidence.webReputation.summary;
		narrative += "\n\nThese reports represent real victims and verified incidents. The prosecution emphasizes that community reports are not speculative - they document actual harm inflicted by this wallet.\n\n";
	}

	// Final argument
	narrative += "CONCLUSION OF PROSECUTION:\n\n";
	
	if (severityScore >= 70) {
		narrative += `With a severity score of ${severityScore}/100, the evidence overwhelmingly demonstrates fraudulent intent and malicious activity. `;
		narrative += "The prosecution recommends classifying this wallet as HIGH RISK and advises complete avoidance. ";
		narrative += "Any interaction with this address poses significant financial danger to users.";
	} else if (severityScore >= 40) {
		narrative += `The severity score of ${severityScore}/100 indicates substantial suspicious behavior warranting serious concern. `;
		narrative += "While some patterns may have alternative explanations, the cumulative evidence points toward likely fraudulent operations. ";
		narrative += "The prosecution urges extreme caution when considering any interaction with this wallet.";
	} else {
		narrative += `With a severity score of ${severityScore}/100, the prosecution acknowledges limited direct evidence of fraud. `;
		narrative += "However, the absence of strong indicators does not guarantee legitimacy. ";
		narrative += "The prosecution recommends maintaining standard security precautions and continued monitoring.";
	}

	return narrative;
}
