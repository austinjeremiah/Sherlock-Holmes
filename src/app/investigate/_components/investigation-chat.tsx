"use client";

import { Bot, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import { KnowledgeGraph } from "./knowledge-graph";
import { investigateWithPayment } from "@/lib/x402-client";
import type { SherlockResponse } from "../_actions";

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

type Message = {
	role: "user" | "agent";
	content: string;
	id: string;
	graph?: {
		nodes: GraphNode[];
		edges: GraphEdge[];
	};
	agentStep?: "evidence" | "prosecutor" | "defender" | "judge";
	isStreaming?: boolean;
};

export const InvestigationChat = () => {
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "welcome",
			role: "agent",
			content:
				"Good evening. I am Sherlock Holmes, consulting detective. State your case, and spare no detail.",
		},
	]);
	const [isLoading, setIsLoading] = useState(false);
	const [paymentStatus, setPaymentStatus] = useState<'idle' | 'paying' | 'investigating'>('idle');
	const [currentGraph, setCurrentGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
	const chatRef = useRef<HTMLDivElement>(null);

	// Wallet connection
	const { address, isConnected } = useAccount();
	const { data: walletClient } = useWalletClient();

	const generateId = () =>
		crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 10);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (chatRef.current) {
			chatRef.current.scrollTop = chatRef.current.scrollHeight;
		}
	}, [messages]);

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!input.trim() || isLoading) return;

		const userMessage: Message = {
			id: generateId(),
			role: "user",
			content: input,
		};

		setMessages((prev) => [...prev, userMessage]);
		const userInput = input;
		setInput("");
		setIsLoading(true);

		try {
			// Check if it's a wallet address - requires x402 payment
			const walletMatch = userInput.match(/0x[a-fA-F0-9]{40}/);
			
			if (walletMatch) {
				// Check wallet connection
				if (!isConnected || !walletClient) {
					const errorMsg: Message = {
						id: generateId(),
						role: "agent",
						content: "⚠️ Please connect your wallet to proceed with the investigation.",
					};
					setMessages((prev) => [...prev, errorMsg]);
					setIsLoading(false);
					return;
				}

				setPaymentStatus('paying');
				
				const paymentMsg: Message = {
					id: generateId(),
					role: "agent",
					content: `💰 Initiating x402 payment protocol...\n\nInvestigation cost: 0.0001 ETH\n\nPlease approve the payment when prompted...`,
				};
				setMessages((prev) => [...prev, paymentMsg]);

				// Use x402 client - automatically handles payment + retry
				setPaymentStatus('investigating');
				const result: SherlockResponse = await investigateWithPayment(
					walletMatch[0],
					walletClient
				);

				setPaymentStatus('idle');
				
				const successMsg: Message = {
					id: generateId(),
					role: "agent",
					content: "✅ Payment confirmed via x402 protocol. Investigation complete!",
				};
				setMessages((prev) => [...prev, successMsg]);

				// Create placeholder messages for each agent
				const evidenceMsg: Message = {
					id: generateId(),
					role: "agent",
					content: "🔍 EVIDENCE AGENT INVESTIGATING...\n\nAnalyzing blockchain transactions...",
					agentStep: "evidence",
					isStreaming: true,
				};
				const prosecutorMsg: Message = {
					id: generateId(),
					role: "agent",
					content: "",
					agentStep: "prosecutor",
					isStreaming: true,
				};
				const defenderMsg: Message = {
					id: generateId(),
					role: "agent",
					content: "",
					agentStep: "defender",
					isStreaming: true,
				};
				const judgeMsg: Message = {
					id: generateId(),
					role: "agent",
					content: "",
					agentStep: "judge",
					isStreaming: true,
				};

				setMessages((prev) => [...prev, evidenceMsg, prosecutorMsg, defenderMsg, judgeMsg]);

				// Update each agent's message with actual content
				if (result.courtSteps) {
					setMessages((prev) => {
						const updated = [...prev];
						result.courtSteps?.forEach((step) => {
							const msgIndex = updated.findIndex(
								(m) => m.agentStep === step.step && m.isStreaming
							);
							if (msgIndex !== -1) {
								updated[msgIndex] = {
									...updated[msgIndex],
									content: step.content,
									isStreaming: false,
								};
							}
						});
						return updated;
					});
					
					// Set graph in right panel
					if (result.graph) {
						setCurrentGraph(result.graph);
					}
				}
			} else {
				// Regular conversation - no payment needed
				const { askSherlock } = await import("../_actions");
				const result: SherlockResponse = await askSherlock(userInput);
				const agentMessage: Message = {
					id: generateId(),
					role: "agent",
					content: result.text || "The case grows more curious...",
					graph: result.graph,
				};
				setMessages((prev) => [...prev, agentMessage]);
			}
		} catch (error) {
			console.error("Error:", error);
			const errorMessage: Message = {
				id: generateId(),
				role: "agent",
				content: "I apologize, but I seem to have lost my train of thought.",
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div className="flex flex-col h-screen bg-[#0a0a0a]">
			{/* Header - 1950s Noir Style with Connect Button */}
			<div className="border-b border-gray-700 bg-black">
				<div className="px-6 py-6">
					<div className="flex items-center justify-between max-w-[1800px] mx-auto">
						<div>
							<h1 className="text-2xl font-serif text-gray-100 tracking-wide">
								SHERLOCK HOLMES
							</h1>
							<p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
								Blockchain Forensics Division
							</p>
						</div>
						<ConnectButton />
					</div>
				</div>
			</div>

			{/* Split Screen Layout */}
			<div className="flex-1 overflow-hidden flex">
				{/* Left: Chat Messages */}
				<div
					ref={chatRef}
					className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#0a0a0a]"
				>
					<div className="max-w-4xl mx-auto">
					{messages.map((message, index) => {
						return (
							<div
								key={message.id}
								className={`flex gap-4 ${
									message.role === "user" ? "justify-end" : "justify-start"
								}`}
							>
								<div
									className={`max-w-[90%] ${
										message.role === "user"
											? "bg-gray-800 border border-gray-700"
											: "bg-transparent"
									} rounded-lg px-4 py-3`}
								>
									{/* Agent step indicator */}
									{message.agentStep && (
										<div className="mb-2 flex items-center gap-2">
											<span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
												{message.agentStep === "evidence" && "🔍 Evidence Agent"}
												{message.agentStep === "prosecutor" && "⚖️ Prosecutor"}
												{message.agentStep === "defender" && "🛡️ Defender"}
												{message.agentStep === "judge" && "⚖️ Judge"}
											</span>
											{message.isStreaming && (
												<div className="flex gap-1">
													<span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
													<span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]" />
													<span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse [animation-delay:0.4s]" />
												</div>
											)}
										</div>
									)}
									
									<p
										className={`text-sm leading-relaxed font-mono ${
											message.role === "user" ? "text-gray-100" : "text-gray-300"
										} whitespace-pre-wrap`}
									>
										{message.content}
									</p>
								</div>
							</div>
						);
					})}

					{isLoading && messages[messages.length - 1]?.role === "user" && (
						<div className="flex gap-4 justify-start">
							<div className="bg-transparent rounded-lg px-4 py-3">
								<div className="flex gap-1">
									<span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
									<span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
									<span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
								</div>
							</div>
						</div>
					)}
					</div>
				</div>

				{/* Right: Knowledge Graph Panel */}
				<div className="flex-1 border-l border-gray-700 bg-black/50 overflow-y-auto">
					{currentGraph && currentGraph.nodes.length > 0 ? (
						<div className="p-6">
							<div className="border-b border-gray-700 pb-3 mb-4">
								<h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
									Network Analysis
								</h2>
							</div>
							<KnowledgeGraph 
								nodes={currentGraph.nodes} 
								edges={currentGraph.edges} 
							/>
						</div>
					) : (
						<div className="flex items-center justify-center h-full p-6">
							<div className="text-center">
								<Bot className="w-16 h-16 text-gray-700 mx-auto mb-4" strokeWidth={1} />
								<p className="text-sm text-gray-600 font-mono">
									Knowledge graph will appear here
								</p>
								<p className="text-xs text-gray-700 font-mono mt-2">
									Investigate a wallet address to view network connections
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Input Area - Typewriter Style - Left Side Only */}
			<div className="border-t border-gray-700 bg-black">
				<div className="flex">
					{/* Left side input (matches chat area) */}
					<div className="flex-1 px-6 py-4">
						{/* Payment status indicator */}
						{!isConnected && (
							<div className="mb-3 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
								<p className="text-xs text-yellow-400 font-mono">
									⚠️ Connect wallet to investigate blockchain addresses (requires 0.0001 ETH payment)
								</p>
							</div>
						)}
						
						{paymentStatus !== 'idle' && (
							<div className="mb-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
								<p className="text-xs text-blue-400 font-mono">
									{paymentStatus === 'paying' && `💸 x402: Waiting for payment approval...`}
									{paymentStatus === 'investigating' && `🔍 x402: Payment confirmed, investigating...`}
								</p>
							</div>
						)}
						
						<form onSubmit={handleSubmit} className="flex gap-3 items-end">
							<Textarea
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Type your inquiry here..."
								className="flex-1 min-h-[50px] max-h-[200px] resize-none bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500 font-mono text-sm focus-visible:ring-gray-600"
								disabled={isLoading}
							/>
							<Button
								type="submit"
								disabled={!input.trim() || isLoading}
								className="h-[50px] px-8 bg-white hover:bg-gray-200 text-black border border-gray-300 font-mono text-sm font-semibold"
							>
								Send
							</Button>
						</form>
						<p className="text-xs text-gray-600 mt-2 font-mono text-center">
							Press Enter to send • Shift+Enter for new line
						</p>
					</div>
					
					{/* Right side empty (matches graph area) */}
					<div className="flex-1 border-l border-gray-700 bg-black/50"></div>
				</div>
			</div>
		</div>
	);
};
