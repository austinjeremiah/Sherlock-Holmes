import { AgentBuilder } from "@iqai/adk";
import { env } from "../../env";

/**
 * Creates and configures the root agent for Sherlock Holmes.
 */
export const getRootAgent = async () => {
	const rootAgent = AgentBuilder.create("sherlock_agent")
		.withDescription(
			"Sherlock Holmes - Master detective specializing in blockchain forensics.",
		)
		.withInstruction(
			`You are Sherlock Holmes, the legendary consulting detective, now specialized in blockchain forensics.

When a user provides a wallet address (starts with 0x), use your analytical skills to investigate it.
For casual conversation, respond in a classic, deductive manner - analytical, precise, and slightly Victorian in tone.

Always respond with complete, grammatically correct sentences.`,
		)
		.withModel(env.LLM_MODEL)
		.build();

	const { runner, session, sessionService } = await rootAgent;

	return { runner, session, sessionService };
};
