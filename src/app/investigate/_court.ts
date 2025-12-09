"use server";

import { investigateWallet } from "@/agents/evidence/agent";
import { prosecuteWallet } from "@/agents/prosecutor/agent";
import { defendWallet } from "@/agents/defender/agent";
import { judgeWallet } from "@/agents/judge/agent";
import { getTelegramAgent } from "@/agents";

export interface CourtStep {
	step: "evidence" | "prosecutor" | "defender" | "judge" | "telegram";
	content: string;
	isComplete: boolean;
}

/**
 * Runs the full court system with streaming updates for each agent
 */
export async function* runCourtCase(walletAddress: string): AsyncGenerator<CourtStep> {
	// Step 1: Evidence Agent
	yield {
		step: "evidence",
		content: "🔍 EVIDENCE AGENT INVESTIGATING...\n\nAnalyzing blockchain transactions, detecting patterns, checking web reputation...",
		isComplete: false,
	};

	const evidenceJson = await investigateWallet(walletAddress);
	const evidence = JSON.parse(evidenceJson);

	let evidenceReport = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
	evidenceReport += `🔍 EVIDENCE AGENT - FINDINGS\n`;
	evidenceReport += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
	evidenceReport += `WALLET: ${evidence.wallet}\n`;
	evidenceReport += `CHAIN: ${evidence.chain}\n\n`;
	
	evidenceReport += `TRANSACTION SUMMARY:\n`;
	evidenceReport += `  Transactions: ${evidence.txCount}\n`;
	evidenceReport += `  Received: ${evidence.totalIn} ETH\n`;
	evidenceReport += `  Sent: ${evidence.totalOut} ETH\n`;
	evidenceReport += `  Counterparties: ${evidence.uniqueCounterparties}\n\n`;
	
	if (evidence.detailedAnalysis) {
		evidenceReport += `WALLET METRICS:\n`;
		evidenceReport += `  Age: ${evidence.detailedAnalysis.walletAge} days\n`;
		evidenceReport += `  Net Flow: ${evidence.detailedAnalysis.netFlow} ETH\n`;
		evidenceReport += `  Frequency: ${evidence.detailedAnalysis.transactionFrequency} txs/day\n\n`;
	}
	
	if (evidence.highRiskPatterns.length > 0) {
		evidenceReport += `DETECTED PATTERNS:\n`;
		evidence.highRiskPatterns.forEach((pattern: string) => {
			evidenceReport += `  🚨 ${pattern}\n`;
		});
		evidenceReport += `\n`;
	}
	
	if (evidence.webReputation) {
		evidenceReport += `WEB REPUTATION:\n`;
		evidenceReport += `  Scam Reports: ${evidence.webReputation.scamReports}\n`;
		evidenceReport += `  ${evidence.webReputation.summary}\n\n`;
	}

	evidenceReport += `EVIDENCE CONCLUSION:\n`;
	evidenceReport += `  Verdict: ${evidence.conclusion?.verdict || "INCONCLUSIVE"}\n`;
	evidenceReport += `  Risk Score: ${evidence.conclusion?.riskScore || 50}/100\n`;

	yield {
		step: "evidence",
		content: evidenceReport,
		isComplete: true,
	};

	// Step 2: Prosecutor Agent
	yield {
		step: "prosecutor",
		content: "⚖️ PROSECUTOR BUILDING CASE...\n\nAnalyzing evidence for fraud indicators...",
		isComplete: false,
	};

	const prosecutionCase = await prosecuteWallet(evidence);

	let prosecutorReport = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
	prosecutorReport += ` PROSECUTOR - CASE FOR FRAUD\n`;
	prosecutorReport += `Severity Score: ${prosecutionCase.severityScore}/100\n`;
	prosecutorReport += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
	prosecutorReport += prosecutionCase.narrative;

	yield {
		step: "prosecutor",
		content: prosecutorReport,
		isComplete: true,
	};

	// Step 3: Defender Agent
	yield {
		step: "defender",
		content: " DEFENDER PREPARING DEFENSE...\n\nChallenging prosecution claims, finding mitigating factors...",
		isComplete: false,
	};

	const defenseCase = await defendWallet(evidence, prosecutionCase);

	let defenderReport = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
	defenderReport += ` DEFENDER - CASE FOR LEGITIMACY\n`;
	defenderReport += `Plausibility Score: ${defenseCase.plausibilityScore}/100\n`;
	defenderReport += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
	defenderReport += defenseCase.narrative;

	yield {
		step: "defender",
		content: defenderReport,
		isComplete: true,
	};

	// Step 4: Judge Agent
	yield {
		step: "judge",
		content: " JUDGE DELIBERATING...\n\nSynthesizing evidence and arguments...",
		isComplete: false,
	};

	const verdict = await judgeWallet(evidence, prosecutionCase, defenseCase);

	let judgeReport = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
	judgeReport += ` JUDGE - FINAL VERDICT\n`;
	judgeReport += `Determination: ${verdict.verdict.toUpperCase()}\n`;
	judgeReport += `Risk Score: ${verdict.riskScore}/100\n`;
	judgeReport += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
	judgeReport += verdict.reasoning;
	judgeReport += `\n\n`;
	
	judgeReport += `RECOMMENDATIONS:\n`;
	verdict.recommendations.forEach((rec: string) => {
		judgeReport += `  • ${rec}\n`;
	});

	yield {
		step: "judge",
		content: judgeReport,
		isComplete: true,
	};

	// Step 5: Telegram Alert
	try {
		const { sendAlert } = await import("@/agents/telegram/agent");
		await sendAlert(walletAddress, verdict.verdict, verdict.riskScore);
		console.log("✅ Telegram alert sent");
	} catch (error) {
		console.error("❌ Failed to send Telegram alert:", error);
		// Don't fail the investigation if Telegram fails
	}
}
