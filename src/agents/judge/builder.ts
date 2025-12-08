import type { EvidenceSummary, ProsecutionCase, DefenseCase, JudgeVerdict } from "../types";

/**
 * Renders final verdict by synthesizing all evidence and arguments
 */
export async function renderVerdict(
	evidence: EvidenceSummary,
	prosecutionCase: ProsecutionCase,
	defenseCase: DefenseCase,
): Promise<JudgeVerdict> {
	// Start with evidence-based risk score (heavily weighted)
	let riskScore = evidence.conclusion?.riskScore || 50;

	// CRITICAL: If Etherscan flags or multiple scam reports exist, this is STRONG evidence
	if (evidence.webReputation && evidence.webReputation.scamReports > 0) {
		// Scam reports should heavily influence the score
		const scamReportBonus = Math.min(evidence.webReputation.scamReports * 20, 40);
		riskScore += scamReportBonus;
	}

	// Weight prosecution severity heavily (60% influence)
	const prosecutionWeight = prosecutionCase.severityScore * 0.6;
	riskScore = (riskScore * 0.4) + prosecutionWeight;

	// Defense plausibility should reduce score BUT NOT override hard evidence
	// Only give defense 20% weight maximum
	if (defenseCase.plausibilityScore > 50 && prosecutionCase.severityScore < 60) {
		// Defense only matters if prosecution is weak
		const defenseReduction = (defenseCase.plausibilityScore - 50) * 0.2;
		riskScore -= defenseReduction;
	}

	// HIGH RISK PATTERNS should add significant weight
	if (evidence.highRiskPatterns.length > 0) {
		// Each high-risk pattern adds to score
		riskScore += evidence.highRiskPatterns.length * 8;
	}

	// Mixer usage is serious
	if (evidence.riskIndicators.mixerUsage) {
		riskScore += 15;
	}

	// CEX interaction slightly reduces risk (but not much if other red flags exist)
	if (evidence.riskIndicators.cexInteraction && prosecutionCase.severityScore < 50) {
		riskScore -= 5;
	}

	// Cap risk score
	riskScore = Math.min(100, Math.max(0, riskScore));

	// Determine verdict based on risk score
	let verdict: "Likely Fraud" | "Likely Clean" | "Inconclusive";
	if (riskScore >= 70) {
		verdict = "Likely Fraud";
	} else if (riskScore <= 40) {
		verdict = "Likely Clean";
	} else {
		verdict = "Inconclusive";
	}

	// Build reasoning
	const reasoning = buildReasoning(evidence, prosecutionCase, defenseCase, riskScore, verdict);

	// Generate recommendations
	const recommendations = generateRecommendations(verdict, riskScore, evidence);

	return {
		verdict,
		riskScore,
		reasoning,
		recommendations,
	};
}

/**
 * Builds detailed reasoning for the verdict
 */
function buildReasoning(
	evidence: EvidenceSummary,
	prosecutionCase: ProsecutionCase,
	defenseCase: DefenseCase,
	riskScore: number,
	verdict: "Likely Fraud" | "Likely Clean" | "Inconclusive"
): string {
	let reasoning = "COURT'S VERDICT AND REASONING:\n\n";

	reasoning += `After careful review of the evidence, prosecution arguments, and defense counter-arguments, this Court renders a verdict of "${verdict.toUpperCase()}" with a final risk score of ${riskScore}/100.\n\n`;

	// Analyze prosecution case
	reasoning += "PROSECUTION'S CASE EVALUATION:\n\n";
	reasoning += `The Prosecutor presented a severity score of ${prosecutionCase.severityScore}/100. `;
	
	if (prosecutionCase.severityScore >= 80) {
		reasoning += "The Court finds the prosecution's evidence OVERWHELMING, with multiple verified indicators of fraudulent activity. ";
	} else if (prosecutionCase.severityScore >= 70) {
		reasoning += "The Court finds the prosecution's evidence compelling, with multiple corroborating red flags that create a strong case for fraudulent activity. ";
	} else if (prosecutionCase.severityScore >= 40) {
		reasoning += "The Court acknowledges the prosecution has raised legitimate concerns, though the evidence is not overwhelming. ";
	} else {
		reasoning += "The Court finds the prosecution's case weak, with insufficient evidence to support fraud allegations. ";
	}

	if (prosecutionCase.keyPoints.length > 0) {
		reasoning += `The prosecution identified ${prosecutionCase.keyPoints.length} key risk indicators. `;
	}
	reasoning += "\n\n";

	// Analyze defense case
	reasoning += "DEFENSE'S CASE EVALUATION:\n\n";
	reasoning += `The Defense presented a plausibility score of ${defenseCase.plausibilityScore}/100 for legitimate use. `;
	
	// If prosecution is very strong, defense arguments are weak regardless
	if (prosecutionCase.severityScore >= 80 && evidence.webReputation && evidence.webReputation.scamReports > 0) {
		reasoning += "However, the Court finds the defense's arguments INSUFFICIENT to overcome the weight of verified scam reports and Etherscan flagging. Alternative explanations are implausible when confronted with community-verified fraud incidents. ";
	} else if (defenseCase.plausibilityScore >= 70) {
		reasoning += "The Court finds the defense's alternative explanations credible and well-supported by evidence of legitimate blockchain activity patterns. ";
	} else if (defenseCase.plausibilityScore >= 40) {
		reasoning += "The Court acknowledges the defense has provided some reasonable alternative explanations, creating doubt about the prosecution's claims. ";
	} else {
		reasoning += "The Court finds the defense's alternative explanations unconvincing given the weight of suspicious patterns. ";
	}

	if (defenseCase.mitigatingFactors.length > 0) {
		reasoning += `The defense identified ${defenseCase.mitigatingFactors.length} mitigating factors. `;
	}
	reasoning += "\n\n";

	// Key evidence analysis
	reasoning += "CRITICAL EVIDENCE ANALYSIS:\n\n";

	if (evidence.webReputation && evidence.webReputation.scamReports > 0) {
		reasoning += `🚨 ETHERSCAN FLAGGING: ${evidence.webReputation.scamReports} verified scam report(s) found. `;
		if (evidence.webReputation.summary.includes("Etherscan")) {
			reasoning += "ETHERSCAN HAS OFFICIALLY FLAGGED THIS WALLET. This is authoritative evidence from a trusted blockchain explorer, not mere speculation. ";
		}
		if (evidence.webReputation.scamReports >= 2) {
			reasoning += "Multiple independent sources confirm fraudulent activity. ";
		}
		reasoning += "The Court gives MAXIMUM weight to official Etherscan flagging and verified scam databases. ";
	} else {
		reasoning += "Web Reputation: No scam reports found in public databases, which supports legitimacy. ";
	}

	if (evidence.riskIndicators.mixerUsage) {
		reasoning += "Mixer usage was detected - a serious indicator of fund obfuscation. ";
	}

	if (evidence.riskIndicators.cexInteraction && prosecutionCase.severityScore < 60) {
		reasoning += "CEX interaction suggests potential KYC compliance. ";
	}

	if (evidence.highRiskPatterns.length > 0) {
		reasoning += `${evidence.highRiskPatterns.length} HIGH-RISK PATTERN(S) DETECTED: ${evidence.highRiskPatterns.slice(0, 2).join(", ")}${evidence.highRiskPatterns.length > 2 ? ", and more" : ""}. `;
	}
	reasoning += "\n\n";

	// Final determination
	reasoning += "COURT'S DETERMINATION:\n\n";

	if (verdict === "Likely Fraud") {
		reasoning += "The preponderance of evidence OVERWHELMINGLY supports the prosecution's case. ";
		if (evidence.webReputation && evidence.webReputation.scamReports > 0) {
			reasoning += "ETHERSCAN FLAGGING and verified scam reports constitute authoritative proof of fraudulent activity. ";
		}
		reasoning += "The combination of official warnings, high-risk behavioral patterns, and prosecution evidence leaves no reasonable doubt. ";
		reasoning += "The defense's alternative explanations are REJECTED as implausible when confronted with verified fraud indicators. ";
		reasoning += "This Court classifies this wallet as EXTREMELY HIGH RISK and recommends COMPLETE AVOIDANCE.";
	} else if (verdict === "Likely Clean") {
		reasoning += "The defense has successfully challenged the prosecution's claims. The evidence shows ";
		if (evidence.riskIndicators.cexInteraction) {
			reasoning += "legitimate exchange interactions, ";
		}
		reasoning += "patterns consistent with normal blockchain operations, and insufficient corroboration of fraud allegations. ";
		reasoning += "The Court finds this wallet likely operates legitimately, though users should maintain standard security practices.";
	} else {
		reasoning += "The evidence is genuinely ambiguous. Both the prosecution and defense have presented reasonable arguments. ";
		reasoning += `With a risk score of ${riskScore}/100, this case falls in the uncertain zone where patterns could indicate either sophisticated fraud or legitimate complex operations. `;
		reasoning += "The Court cannot render a definitive determination and recommends users exercise heightened caution while monitoring for additional evidence.";
	}

	return reasoning;
}

/**
 * Generates actionable recommendations based on verdict
 */
function generateRecommendations(
	verdict: "Likely Fraud" | "Likely Clean" | "Inconclusive",
	riskScore: number,
	evidence: EvidenceSummary
): string[] {
	const recommendations: string[] = [];

	if (verdict === "Likely Fraud") {
		recommendations.push("AVOID ALL INTERACTION: Do not send funds to this wallet under any circumstances.");
		recommendations.push("WARNING TO OTHERS: Consider reporting this wallet to blockchain security databases if you have evidence of fraud.");
		
		if (evidence.graph.edges.length > 0) {
			recommendations.push("CHECK YOUR CONNECTIONS: If you have interacted with this wallet, review your transaction history for suspicious activity.");
		}
		
		recommendations.push("ENHANCED MONITORING: Add this wallet to your watchlist and monitor for any attempts to contact you from associated addresses.");
		
		if (evidence.riskIndicators.mixerUsage) {
			recommendations.push("TRACE OBFUSCATION: This wallet uses mixers. Funds may be difficult to trace or recover.");
		}
	} else if (verdict === "Likely Clean") {
		recommendations.push("STANDARD PRECAUTIONS: This wallet appears legitimate, but always verify addresses and use standard security practices.");
		recommendations.push("VERIFY CONTRACTS: If interacting with smart contracts from this wallet, review contract code independently.");
		recommendations.push("STAY VIGILANT: Even legitimate wallets can be compromised. Monitor transactions and revoke approvals periodically.");
		
		if (evidence.riskIndicators.cexInteraction) {
			recommendations.push("CEX VERIFICATION: This wallet interacts with exchanges, suggesting possible KYC compliance.");
		}
	} else {
		recommendations.push("EXERCISE EXTREME CAUTION: The evidence is insufficient for a clear determination. Proceed with heightened vigilance.");
		recommendations.push("LIMITED EXPOSURE: If you must interact, start with minimal amounts to test behavior.");
		recommendations.push("INDEPENDENT VERIFICATION: Conduct additional research through multiple blockchain explorers and community forums.");
		recommendations.push(`RISK THRESHOLD: With a risk score of ${riskScore}/100, this wallet requires careful monitoring before any significant interaction.`);
		recommendations.push("SEEK SECOND OPINION: Consider consulting additional blockchain forensics services for corroboration.");
	}

	// Universal recommendations
	recommendations.push("NEVER SHARE PRIVATE KEYS: Legitimate projects never ask for your private keys or seed phrases.");
	recommendations.push("USE HARDWARE WALLETS: For significant holdings, always use hardware wallet security.");

	return recommendations;
}
