/**
 * Clean formatting utilities for ATP chat interface
 * These formatters produce simple, readable text without ASCII art borders
 */

interface EvidenceData {
	wallet: string;
	chain: string;
	txCount: number;
	totalIn: string;
	totalOut: string;
	uniqueCounterparties: number;
	detailedAnalysis?: {
		walletAge: number;
		netFlow: string;
		transactionFrequency: string;
	};
	highRiskPatterns: string[];
	webReputation?: {
		scamReports: number;
		summary: string;
	};
	conclusion?: {
		verdict: string;
		riskScore: number;
	};
}

interface ProsecutionCase {
	severityScore: number;
	narrative: string;
}

interface DefenseCase {
	plausibilityScore: number;
	narrative: string;
}

interface Verdict {
	verdict: string;
	riskScore: number;
	reasoning: string;
	recommendations: string[];
}

/**
 * Format evidence in clean chat style
 */
export function formatEvidence(evidence: EvidenceData): string {
	let report = `🔍 **Evidence Report**\n\n`;
	report += `**Wallet:** ${evidence.wallet}\n`;
	report += `**Chain:** ${evidence.chain}\n\n`;
	
	report += `**Transaction Summary:**\n`;
	report += `• Transactions: ${evidence.txCount}\n`;
	report += `• Received: ${evidence.totalIn} ETH\n`;
	report += `• Sent: ${evidence.totalOut} ETH\n`;
	report += `• Counterparties: ${evidence.uniqueCounterparties}\n\n`;
	
	if (evidence.detailedAnalysis) {
		report += `**Wallet Metrics:**\n`;
		report += `• Age: ${evidence.detailedAnalysis.walletAge} days\n`;
		report += `• Net Flow: ${evidence.detailedAnalysis.netFlow} ETH\n`;
		report += `• Activity: ${evidence.detailedAnalysis.transactionFrequency} txs/day\n\n`;
	}
	
	if (evidence.highRiskPatterns.length > 0) {
		report += `**⚠️ Detected Patterns:**\n`;
		evidence.highRiskPatterns.forEach((pattern: string) => {
			report += `• ${pattern}\n`;
		});
		report += `\n`;
	}
	
	if (evidence.webReputation) {
		report += `**Web Reputation:**\n`;
		report += `• Scam Reports: ${evidence.webReputation.scamReports}\n`;
		report += `• ${evidence.webReputation.summary}\n\n`;
	}

	report += `**Evidence Conclusion:**\n`;
	report += `• Verdict: ${evidence.conclusion?.verdict || "INCONCLUSIVE"}\n`;
	report += `• Risk Score: ${evidence.conclusion?.riskScore || 50}/100\n`;

	return report;
}

/**
 * Format prosecutor case in clean chat style
 */
export function formatProsecutor(prosecutionCase: ProsecutionCase): string {
	let report = `⚖️ **Prosecutor's Case**\n\n`;
	report += `**Severity Score:** ${prosecutionCase.severityScore}/100\n\n`;
	report += prosecutionCase.narrative;
	return report;
}

/**
 * Format defender case in clean chat style
 */
export function formatDefender(defenseCase: DefenseCase): string {
	let report = `🛡️ **Defense Case**\n\n`;
	report += `**Plausibility Score:** ${defenseCase.plausibilityScore}/100\n\n`;
	report += defenseCase.narrative;
	return report;
}

/**
 * Format judge verdict in clean chat style
 */
export function formatJudge(verdict: Verdict): string {
	let report = `⚖️ **Final Verdict**\n\n`;
	report += `**Determination:** ${verdict.verdict.toUpperCase()}\n`;
	report += `**Risk Score:** ${verdict.riskScore}/100\n\n`;
	report += verdict.reasoning;
	report += `\n\n`;
	
	report += `**Recommendations:**\n`;
	verdict.recommendations.forEach((rec: string) => {
		report += `• ${rec}\n`;
	});

	return report;
}
