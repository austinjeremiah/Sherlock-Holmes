import { NextRequest, NextResponse } from "next/server";
import { getRootAgent } from "@/agents";
import { investigateWallet } from "@/agents/evidence/agent";
import { prosecuteWallet } from "@/agents/prosecutor/agent";
import { defendWallet } from "@/agents/defender/agent";
import { judgeWallet } from "@/agents/judge/agent";
import { formatEvidence, formatProsecutor, formatDefender, formatJudge } from "./_formatter";

/**
 * POST /api/agent
 * 
 * ATP (Agent Token Protocol) endpoint for Sherlock Holmes agent
 * 
 * Usage:
 * POST https://your-domain.vercel.app/api/agent
 * Body: { "message": "investigate 0xabc..." }
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { message } = body;

		if (!message || typeof message !== "string") {
			return NextResponse.json(
				{ error: "Missing 'message' field in request body" },
				{ status: 400 }
			);
		}

		// Check if message contains a wallet address
		const walletMatch = message.match(/0x[a-fA-F0-9]{40}/);
		
		if (walletMatch) {
			// Full investigation with all agents
			const walletAddress = walletMatch[0];

			// Step 1: Evidence Agent
			const evidenceJson = await investigateWallet(walletAddress);
			const evidence = JSON.parse(evidenceJson);
			const evidenceReport = formatEvidence(evidence);

			// Step 2: Prosecutor Agent
			const prosecutionCase = await prosecuteWallet(evidence);
			const prosecutorReport = formatProsecutor(prosecutionCase);

			// Step 3: Defender Agent
			const defenseCase = await defendWallet(evidence, prosecutionCase);
			const defenderReport = formatDefender(defenseCase);

			// Step 4: Judge Agent
			const verdict = await judgeWallet(evidence, prosecutionCase, defenseCase);
			const judgeReport = formatJudge(verdict);

			// Step 5: Send Telegram Alert
			try {
				const { sendAlert } = await import("@/agents/telegram/agent");
				await sendAlert(walletAddress, verdict.verdict, verdict.riskScore);
			} catch (error) {
				console.error("❌ Failed to send Telegram alert:", error);
			}

			// Combine all reports in clean format
			const fullReport = [evidenceReport, prosecutorReport, defenderReport, judgeReport].join("\n\n---\n\n");

			// Return clean chat-style response
			return NextResponse.json({
				success: true,
				walletAddress,
				response: fullReport,
				verdict: verdict.verdict,
				riskScore: verdict.riskScore,
				graph: {
					nodes: evidence.graph.nodes,
					edges: evidence.graph.edges
				},
				timestamp: new Date().toISOString(),
			});
		}

		// For regular conversation, use ADK agent
		const { runner } = await getRootAgent();
		const response = await runner.ask(message);

		return NextResponse.json({
			success: true,
			response: typeof response === "string" ? response : "Investigation complete",
			agent: "sherlock_holmes",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error in /api/agent:", error);
		return NextResponse.json(
			{ 
				error: "Internal server error",
				message: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

/**
 * GET /api/agent
 * 
 * Health check endpoint
 */
export async function GET() {
	return NextResponse.json({
		agent: "Sherlock Holmes - Blockchain Forensics Detective",
		version: "1.0.0",
		status: "operational",
		framework: "ADK-TS",
		capabilities: [
			"Ethereum wallet investigation",
			"Transaction pattern analysis",
			"Scam detection",
			"Risk scoring",
			"Multi-agent court system (Evidence, Prosecutor, Defender, Judge)",
			"Telegram alerts"
		],
		endpoint: "/api/agent",
		usage: {
			method: "POST",
			body: { message: "investigate 0x..." }
		}
	});
}
