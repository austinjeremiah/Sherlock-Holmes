import type { EvidenceSummary, ProsecutionCase, DefenseCase } from "../types";

/**
 * Builds a defense case challenging prosecution claims
 */
export async function buildDefense(
	evidence: EvidenceSummary,
	prosecutionCase: ProsecutionCase,
): Promise<DefenseCase> {
	const keyPoints: string[] = [];
	const mitigatingFactors: string[] = [];
	let plausibilityScore = 50; // Start neutral

	// Challenge high-risk pattern interpretations
	if (evidence.highRiskPatterns.length > 0) {
		for (const pattern of evidence.highRiskPatterns) {
			if (pattern.includes("VANITY ADDRESS")) {
				keyPoints.push("LEGITIMATE BRANDING: Vanity addresses are commonly used by legitimate projects for brand recognition and user trust. Many reputable DeFi protocols use vanity addresses.");
				mitigatingFactors.push("Vanity address could indicate professional project branding");
				plausibilityScore += 10;
			}
			if (pattern.includes("RAPID DRAIN")) {
				keyPoints.push("AUTOMATED TRADING: Rapid fund movements are characteristic of trading bots, arbitrage operations, and DeFi protocols. Speed does not imply malicious intent.");
				mitigatingFactors.push("Fast transactions consistent with automated trading systems");
				plausibilityScore += 15;
			}
			if (pattern.includes("HONEYPOT")) {
				keyPoints.push("ACCUMULATION WALLET: One-way fund flows are normal for treasury wallets, cold storage, and long-term holding strategies. Not all accumulation is malicious.");
				mitigatingFactors.push("Receive-only pattern matches cold storage behavior");
				plausibilityScore += 10;
			}
			if (pattern.includes("DUST ATTACK")) {
				keyPoints.push("AIRDROP DISTRIBUTION: Small transactions could be legitimate airdrops, token distributions, or gas refunds. The wallet may be a recipient, not initiator.");
				mitigatingFactors.push("Dust transactions may be received airdrops, not attacks");
				plausibilityScore += 15;
			}
			if (pattern.includes("NEW WALLET BURST")) {
				keyPoints.push("TOKEN LAUNCH ACTIVITY: High volume from new wallets is expected during token launches, NFT mints, and DeFi protocol deployments. This is standard blockchain behavior.");
				mitigatingFactors.push("Burst activity consistent with legitimate launch events");
				plausibilityScore += 10;
			}
			if (pattern.includes("HIGH VOLUME SPIKE")) {
				keyPoints.push("EXCHANGE OR WHALE ACTIVITY: Large transaction volumes are normal for exchanges, market makers, and institutional investors. Volume alone is not evidence of fraud.");
				mitigatingFactors.push("High volume matches exchange or institutional operations");
				plausibilityScore += 10;
			}
		}
	}

	// Address mixer usage
	if (evidence.riskIndicators.mixerUsage) {
		keyPoints.push("PRIVACY PROTECTION: Mixer usage is a legitimate privacy tool used by individuals concerned about surveillance. Privacy is not a crime. Many law-abiding users protect their financial privacy.");
		mitigatingFactors.push("Mixer usage indicates privacy awareness, not necessarily criminal intent");
		plausibilityScore += 5;
	} else {
		// No mixer usage is positive
		mitigatingFactors.push("No mixer usage detected - transparent operations");
		plausibilityScore += 15;
	}

	// CEX interaction is positive
	if (evidence.riskIndicators.cexInteraction) {
		keyPoints.push("EXCHANGE VERIFICATION: Interaction with centralized exchanges suggests KYC compliance and legitimate operations. Scammers typically avoid KYC-required platforms.");
		mitigatingFactors.push("CEX interaction indicates potential KYC verification");
		plausibilityScore += 20;
	}

	// Challenge scam reports
	if (evidence.webReputation && evidence.webReputation.scamReports > 0) {
		keyPoints.push(`UNVERIFIED REPORTS: The ${evidence.webReputation.scamReports} scam report(s) are from public databases where anyone can submit claims without verification. These could be false reports from competitors, mistakes, or misunderstandings.`);
		mitigatingFactors.push("Scam reports are unverified and may be false positives");
		plausibilityScore -= 10;
	} else {
		// No scam reports is very positive
		keyPoints.push("CLEAN REPUTATION: No scam reports found in public databases. This wallet has not been flagged by the community.");
		mitigatingFactors.push("Zero scam reports in public databases");
		plausibilityScore += 25;
	}

	// Analyze transaction patterns for legitimacy
	if (evidence.detailedAnalysis) {
		const walletAge = evidence.detailedAnalysis.walletAge;
		if (walletAge > 180) {
			keyPoints.push(`ESTABLISHED WALLET: This wallet has been active for ${walletAge} days (over 6 months). Scam wallets are typically short-lived. Longevity suggests legitimate operations.`);
			mitigatingFactors.push("Long operational history reduces fraud likelihood");
			plausibilityScore += 20;
		} else if (walletAge > 30) {
			mitigatingFactors.push("Wallet has sustained activity beyond typical scam timeframe");
			plausibilityScore += 10;
		}

		const netFlow = Number.parseFloat(evidence.detailedAnalysis.netFlow);
		if (Math.abs(netFlow) < 10) {
			keyPoints.push("BALANCED OPERATIONS: Net flow is relatively balanced, suggesting ongoing operations rather than one-time scam extraction.");
			mitigatingFactors.push("Balanced net flow indicates sustainable operations");
			plausibilityScore += 15;
		}
	}

	// Challenge prosecutor's severity score
	if (prosecutionCase.severityScore < 40) {
		keyPoints.push(`WEAK PROSECUTION CASE: The Prosecutor's severity score of ${prosecutionCase.severityScore}/100 indicates limited evidence of fraud. The defense maintains this wallet is likely legitimate.`);
		plausibilityScore += 20;
	} else if (prosecutionCase.severityScore < 70) {
		keyPoints.push(`AMBIGUOUS EVIDENCE: The Prosecutor's severity score of ${prosecutionCase.severityScore}/100 shows the evidence is not conclusive. Ambiguity should favor the presumption of innocence.`);
		plausibilityScore += 10;
	}

	// Build narrative
	const narrative = buildDefenseNarrative(evidence, prosecutionCase, keyPoints, mitigatingFactors, plausibilityScore);

	// Cap plausibility score
	plausibilityScore = Math.min(100, Math.max(0, plausibilityScore));

	return {
		keyPoints,
		narrative,
		mitigatingFactors,
		plausibilityScore,
	};
}

/**
 * Builds a compelling defense narrative
 */
function buildDefenseNarrative(
	evidence: EvidenceSummary,
	prosecutionCase: ProsecutionCase,
	keyPoints: string[],
	mitigatingFactors: string[],
	plausibilityScore: number
): string {
	let narrative = "THE DEFENSE'S CASE:\n\n";

	narrative += `The defense challenges the Prosecutor's characterization of wallet ${evidence.wallet}. `;
	
	if (prosecutionCase.severityScore >= 70) {
		narrative += "While the Prosecutor has presented concerning patterns, the defense will demonstrate that alternative explanations exist for this behavior.\n\n";
	} else {
		narrative += `The Prosecutor's case, with a severity score of only ${prosecutionCase.severityScore}/100, fails to meet the threshold for fraud determination. The defense will show this wallet is likely legitimate.\n\n`;
	}

	// Present counter-arguments
	if (keyPoints.length > 0) {
		narrative += "COUNTER-ARGUMENTS:\n\n";
		keyPoints.forEach((point, index) => {
			narrative += `${index + 1}. ${point}\n\n`;
		});
	}

	// Emphasize mitigating factors
	if (mitigatingFactors.length > 0) {
		narrative += "MITIGATING FACTORS:\n\n";
		narrative += "The defense identifies the following factors that support legitimate use:\n";
		mitigatingFactors.forEach((factor) => {
			narrative += `• ${factor}\n`;
		});
		narrative += "\n";
	}

	// Address the presumption of innocence
	narrative += "PRESUMPTION OF INNOCENCE:\n\n";
	narrative += "Blockchain forensics must adhere to the principle that suspicious patterns are not proof of fraud. ";
	narrative += "The burden of proof lies with the Prosecutor to demonstrate malicious intent beyond reasonable doubt. ";
	narrative += "Ambiguous evidence should not be weaponized against users who value privacy or employ common DeFi strategies.\n\n";

	// Final argument
	narrative += "CONCLUSION OF DEFENSE:\n\n";
	
	if (plausibilityScore >= 70) {
		narrative += `With a plausibility score of ${plausibilityScore}/100, the defense has demonstrated strong likelihood of legitimate operations. `;
		narrative += "The patterns identified by the Prosecutor have innocent explanations. ";
		narrative += "The defense requests that this wallet be classified as LOW RISK and treated with the presumption of innocence.";
	} else if (plausibilityScore >= 40) {
		narrative += `The plausibility score of ${plausibilityScore}/100 indicates reasonable doubt regarding the Prosecutor's fraud claims. `;
		narrative += "While some patterns warrant caution, they do not constitute proof of malicious activity. ";
		narrative += "The defense recommends a MODERATE RISK classification pending further evidence.";
	} else {
		narrative += `The defense acknowledges the plausibility score of ${plausibilityScore}/100 suggests limited legitimate explanations. `;
		narrative += "However, the defense maintains that even suspicious patterns deserve fair evaluation. ";
		narrative += "Users should exercise caution but avoid premature conclusions without definitive proof of fraud.";
	}

	return narrative;
}
