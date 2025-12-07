import { AgentBuilder } from "@iqai/adk";
import { env } from "../../env";

/**
 * Creates and configures the root agent for Sherlock Holmes.
 *
 * This is a clean starting point for building your AI agent application.
 * You can add sub-agents, tools, and custom logic as needed.
 *
 * @returns The fully constructed root agent instance ready to process requests
 */
export const getRootAgent = async () => {
	const rootAgent = AgentBuilder.create("sherlock_agent")
		.withDescription(
			"Sherlock Holmes AI agent - ready to be customized for your needs.",
		)
		.withInstruction(
			"You are a helpful AI assistant. Respond to user queries in a clear and concise manner.",
		)
		.withModel(env.LLM_MODEL)
		.build();

	const { runner, session, sessionService } = await rootAgent;

	return { runner, session, sessionService };
};
