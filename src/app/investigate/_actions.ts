"use server";

import { getRootAgent } from "@/agents";
import { investigateWallet } from "@/agents/evidence/agent";
import { runCourtCase } from "./_court";

interface GraphNode {
	id: string;
	type: "target" | "wallet" | "cex" | "mixer" | "contract";
	label?: string;
	riskLevel?: "low" | "medium" | "high";
}

interface GraphEdge {
	source: string;
	target: string;
	txCount: number;
	totalValue: string;
	risk?: "low" | "medium" | "high";
}

export interface SherlockResponse {
	text: string;
	graph?: {
		nodes: (GraphNode & { 
			txCount?: number; 
			ethVolume?: string;
			connections?: number;
		})[];
		edges: GraphEdge[];
	};
	agentStep?: "evidence" | "prosecutor" | "defender" | "judge" | "telegram";
	isComplete?: boolean;
	courtSteps?: Array<{
		step: "evidence" | "prosecutor" | "defender" | "judge" | "telegram";
		content: string;
	}>;
}

export async function askSherlock(message: string): Promise<SherlockResponse> {
	try {
		// Check if message contains a wallet address
		const walletMatch = message.match(/0x[a-fA-F0-9]{40}/);
		
		if (walletMatch) {
			const walletAddress = walletMatch[0];
			const courtSteps: Array<{
				step: "evidence" | "prosecutor" | "defender" | "judge";
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

			// Get the graph from evidence (first step should have called investigateWallet)
			const evidenceJson = await investigateWallet(walletAddress);
			const evidence = JSON.parse(evidenceJson);

			// Combine all court outputs
			const fullReport = courtSteps.map(s => s.content).join("\n\n");

			return {
				text: fullReport,
				graph: {
					nodes: evidence.graph.nodes,
					edges: evidence.graph.edges
				},
				courtSteps,
				isComplete: true,
			};
		}

		// For regular conversation, use ADK agent
		const { runner } = await getRootAgent();
		const response = await runner.ask(message);
		
		return {
			text: typeof response === 'string' ? response : "I must contemplate this matter further."
		};
	} catch (error) {
		console.error("Error in askSherlock:", error);
		return {
			text: "I apologize, but I encountered an obstacle in my investigation."
		};
	}
}