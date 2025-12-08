import { agent as sherlockAgent } from "./sherlock/agent";
import { agent as evidenceAgent } from "./evidence/agent";
import { agent as prosecutorAgent } from "./prosecutor/agent";
import { agent as defenderAgent } from "./defender/agent";
import { agent as judgeAgent } from "./judge/agent";

/**
 * Gets the Sherlock Holmes agent instance.
 * Uses ADK-TS framework for the hackathon!
 */
export async function getRootAgent() {
	return await sherlockAgent();
}

/**
 * Gets the Evidence Agent instance.
 * Uses ADK-TS framework for the hackathon!
 */
export async function getEvidenceAgent() {
	return await evidenceAgent();
}

/**
 * Gets the Prosecutor Agent instance.
 * Uses ADK-TS framework for the hackathon!
 */
export async function getProsecutorAgent() {
	return await prosecutorAgent();
}

/**
 * Gets the Defender Agent instance.
 * Uses ADK-TS framework for the hackathon!
 */
export async function getDefenderAgent() {
	return await defenderAgent();
}

/**
 * Gets the Judge Agent instance.
 * Uses ADK-TS framework for the hackathon!
 */
export async function getJudgeAgent() {
	return await judgeAgent();
}
