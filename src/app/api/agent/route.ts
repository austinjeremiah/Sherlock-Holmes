import { NextRequest, NextResponse } from "next/server";
import { getRootAgent } from "@/agents";
import { runCourtCase } from "@/app/investigate/_court";
import { investigateWallet } from "@/agents/evidence/agent";

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
			const courtSteps: Array<{
				step: string;
				content: string;
			}> = [];

			// Run the full court case and collect all steps
			for await (const step of runCourtCase(walletAddress)) {
				if (step.isComplete) {
					courtSteps.push({
						step: step.step,
						content: step.content,
					});
				}
			}

			// Get the graph from evidence
			const evidenceJson = await investigateWallet(walletAddress);
			const evidence = JSON.parse(evidenceJson);

			// Combine all court outputs
			const fullReport = courtSteps.map(s => s.content).join("\n\n");

			return NextResponse.json({
				success: true,
				walletAddress,
				// Full report (for ATP)
				report: fullReport,
				// Structured steps (for chat UI)
				courtSteps: courtSteps,
				// Graph data
				graph: {
					nodes: evidence.graph.nodes,
					edges: evidence.graph.edges
				},
				// Metadata
				agents: courtSteps.map(s => s.step),
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
