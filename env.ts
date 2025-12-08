import { config } from "dotenv";
import { z } from "zod";

// Load .env.local first (Next.js convention), then .env
config({ path: '.env.local' });
config();

/**
 * Environment variable schema definition for the simple agent.
 *
 * Defines and validates required environment variables including:
 * - ADK_DEBUG: Optional debug mode flag (defaults to "false")
 * - GOOGLE_API_KEY: Required API key for Google/Gemini model access
 * - PAYMENT_PRIVATE_KEY: Private key for agent payment wallet
 */
export const envSchema = z.object({
	ADK_DEBUG: z.coerce.boolean().default(false),
	GOOGLE_API_KEY: z.string().min(1, "GOOGLE_API_KEY cannot be empty"),
	LLM_MODEL: z.string().default("gemini-2.5-flash"),
	ETHERSCAN_API_KEY: z.string().min(1, "ETHERSCAN_API_KEY cannot be empty"),
	PAYMENT_PRIVATE_KEY: z.string().min(1, "PAYMENT_PRIVATE_KEY cannot be empty"),
	PAYMENT_WALLET: z.string().min(1, "PAYMENT_WALLET cannot be empty"),
});

/**
 * Validated environment variables parsed from process.env.
 * Throws an error if required environment variables are missing or invalid.
 */
export const env = envSchema.parse(process.env);
