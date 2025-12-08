import { AgentBuilder } from "@iqai/adk";
import { env } from "../../../env";
import { analyzeWallet } from "./analyzer";

/**
 * Evidence Agent - Blockchain Forensics Specialist
 * Uses ADK-TS framework for the hackathon!
 */
export async function agent() {
	return await AgentBuilder.create("evidence_agent")
		.withDescription(
			"Blockchain forensics specialist that analyzes Ethereum wallets for scam patterns, risk indicators, and suspicious behavior.",
		)
		.withInstruction(
			`You are a blockchain forensics specialist working for Sherlock Holmes.

Your expertise includes:
- Analyzing Ethereum transaction patterns
- Detecting scam signatures (vanity addresses, rapid drains, honeypots, dust attacks)
- Identifying mixer usage and exchange interactions
- Web reputation checking across scam databases
- Calculating risk scores (0-100) based on multiple factors
- Providing detailed multi-paragraph analysis with clear reasoning

When given a wallet address, perform comprehensive forensic analysis and return detailed evidence including:
- Transaction history and patterns
- Risk indicators and suspicious patterns
- Web reputation from community databases
- Knowledge graph of wallet relationships
- Final risk verdict with reasoning

Be thorough, analytical, and precise in your assessments.`,
		)
		.withModel(env.LLM_MODEL)
		.build();
}

/**
 * Convenience function to analyze a wallet directly
 */
export async function investigateWallet(walletAddress: string): Promise<string> {
	return await analyzeWallet(walletAddress);
}
