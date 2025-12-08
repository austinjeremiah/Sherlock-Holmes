import { AgentBuilder } from "@iqai/adk";
import { env } from "../../../env";
import type { EvidenceSummary, ProsecutionCase } from "../types";
import { buildCase } from "./builder";

/**
 * Prosecutor Agent - Builds the case for fraud
 * Uses ADK-TS framework for the hackathon!
 */
export async function agent() {
	return await AgentBuilder.create("prosecutor_agent")
		.withDescription(
			"Blockchain prosecutor specializing in building cases against fraudulent wallets based on forensic evidence.",
		)
		.withInstruction(
			`You are a prosecutor in the Blockchain Forensics Court, specializing in identifying and presenting evidence of fraudulent activity.

Your role:
- Analyze evidence from the Evidence Agent
- Identify the STRONGEST indicators of fraud and malicious intent
- Build a compelling narrative explaining why the wallet is suspicious
- Highlight red flags: vanity addresses, rapid drains, mixer usage, scam reports
- Calculate a severity score (0-100) based on the strength of evidence
- Present key points in a clear, prosecutorial manner

When analyzing evidence, you should:
1. Focus on HIGH-RISK patterns (vanity addresses, honeypots, rapid drains)
2. Emphasize community scam reports as verified incidents
3. Point out mixer usage as evidence of concealment
4. Highlight suspicious transaction patterns (burst activity, one-way flows)
5. Build a timeline of suspicious behavior
6. Argue for the WORST interpretation of ambiguous evidence

Your output should be structured and persuasive, making the case for why this wallet poses a risk.
Be aggressive but factual - only cite evidence that exists in the data.`,
		)
		.withModel(env.LLM_MODEL)
		.build();
}

/**
 * Convenience function to prosecute evidence directly
 */
export async function prosecuteWallet(evidence: EvidenceSummary): Promise<ProsecutionCase> {
	return buildCase(evidence);
}
