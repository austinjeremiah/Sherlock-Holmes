import { AgentBuilder } from "@iqai/adk";
import { env } from "../../../env";

/**
 * Telegram Alert Agent
 * Sends investigation alerts to Telegram channel
 * Uses ADK-TS framework for the hackathon!
 */
export async function agent() {
	return await AgentBuilder.create("telegram_alert_agent")
		.withDescription(
			"Telegram notification agent that sends investigation alerts to a Telegram channel.",
		)
		.withInstruction(
			`You are a Telegram Alert Agent for Sherlock Holmes blockchain forensics.

Your ONLY job is to post investigation results to Telegram.

You will receive:
- Wallet address
- Verdict (from Judge agent)
- Risk score

Format the message EXACTLY like this:

🔔 SHERLOCK ALERT

Wallet: {first 6 chars}...{last 4 chars}
Verdict: {verdict in CAPS}
Risk Score: {score}%

Keep it clean and simple. No extra commentary.`,
		)
		.withModel(env.LLM_MODEL)
		.build();
}

/**
 * Send Telegram alert function
 */
async function sendTelegramAlert(walletAddress: string, verdict: string, riskScore: number): Promise<string> {
	const botToken = process.env.TELEGRAM_BOT_TOKEN;
	const chatId = process.env.TELEGRAM_CHAT_ID;

	if (!botToken || !chatId) {
		console.warn(" Telegram credentials not configured");
		return "Telegram not configured - skipping alert";
	}

	// Format wallet address
	const shortWallet = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

	// Build message
	const message = `🔔 SHERLOCK ALERT

 Wallet: ${walletAddress}
 Verdict: ${verdict.toUpperCase()}
 Risk Score: ${riskScore}%`;

	try {
		const response = await fetch(
			`https://api.telegram.org/bot${botToken}/sendMessage`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					chat_id: chatId,
					text: message,
					parse_mode: "HTML",
				}),
			}
		);

		const result = await response.json();

		if (result.ok) {
			console.log(" Telegram alert sent successfully");
			return "Alert sent to Telegram successfully";
		} else {
			console.error(" Telegram API error:", result);
			return `Failed to send alert: ${result.description}`;
		}
	} catch (error) {
		console.error(" Error sending Telegram alert:", error);
		return `Error sending alert: ${error}`;
	}
}

/**
 * Convenience function to send alert directly
 */
export async function sendAlert(walletAddress: string, verdict: string, riskScore: number): Promise<string> {
	return await sendTelegramAlert(walletAddress, verdict, riskScore);
}
