/**
 * Type definitions for the Blockchain Forensics Court System
 */

// Graph Node Types
export type NodeType = "target" | "wallet" | "cex" | "mixer" | "bridge" | "contract" | "nft";

export interface GraphNode {
	id: string; // address or label
	type: NodeType;
	label?: string;
	riskLevel?: "low" | "medium" | "high";
}

// Graph Edge Types
export interface GraphEdge {
	source: string;
	target: string;
	txCount: number;
	totalValue: string; // in ETH or token units
	risk?: "low" | "medium" | "high";
}

// Evidence Graph Structure
export interface EvidenceGraph {
	nodes: GraphNode[];
	edges: GraphEdge[];
}

// Evidence Summary from Evidence Agent
export interface EvidenceSummary {
	wallet: string;
	chain: string;
	firstSeen: string;
	lastSeen: string;
	totalIn: string;
	totalOut: string;
	txCount: number;
	uniqueCounterparties: number;
	highRiskPatterns: string[]; // textual descriptions of suspicious behavior
	graph: EvidenceGraph;
	riskIndicators: {
		mixerUsage: boolean;
		newWalletPattern: boolean;
		highVolumeSpike: boolean;
		cexInteraction: boolean;
		exploitContractInteraction: boolean;
	};
}

// Prosecution Case
export interface ProsecutionCase {
	keyPoints: string[];
	narrative: string;
	highlightedNodes: string[]; // node IDs to highlight
	severityScore: number; // 0-100
}

// Defense Case
export interface DefenseCase {
	keyPoints: string[];
	narrative: string;
	mitigatingFactors: string[];
	plausibilityScore: number; // 0-100
}

// Judge Verdict
export interface JudgeVerdict {
	verdict: "Likely Fraud" | "Likely Clean" | "Inconclusive";
	riskScore: number; // 0-100
	reasoning: string;
	recommendations: string[];
}

// Full Court Case Result
export interface CourtCaseResult {
	wallet: string;
	chain: string;
	timestamp: string;
	evidence: EvidenceSummary;
	prosecutorCase: ProsecutionCase;
	defenderCase: DefenseCase;
	judgeVerdict: JudgeVerdict;
}

// Etherscan API Response Types
export interface EtherscanTransaction {
	blockNumber: string;
	timeStamp: string;
	hash: string;
	from: string;
	to: string;
	value: string;
	gas: string;
	gasPrice: string;
	isError: string;
	input: string;
}

export interface EtherscanTokenTransfer {
	blockNumber: string;
	timeStamp: string;
	hash: string;
	from: string;
	to: string;
	value: string;
	tokenName: string;
	tokenSymbol: string;
	contractAddress: string;
}
