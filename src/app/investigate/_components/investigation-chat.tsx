"use client";

import { Bot, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askSherlock, SherlockResponse } from "../_actions";
import { KnowledgeGraph } from "./knowledge-graph";

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
	const chatRef = useRef<HTMLDivElement>(null);
	const [displayedText, setDisplayedText] = useState("");
	const [isTyping, setIsTyping] = useState(false);

	const generateId = () =>
		crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 10);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (chatRef.current) {
			chatRef.current.scrollTop = chatRef.current.scrollHeight;
		}
	}, [messages, displayedText]);

	// Typewriter effect for the last agent message
	useEffect(() => {
		const lastMessage = messages[messages.length - 1];
		if (lastMessage?.role === "agent" && lastMessage.id !== "welcome") {
			setIsTyping(true);
			setDisplayedText("");
			let index = 0;
			const interval = setInterval(() => {
				if (index < lastMessage.content.length) {
					setDisplayedText((prev) => prev + lastMessage.content[index]);
					index++;
				} else {
					clearInterval(interval);
					setIsTyping(false);
				}
			}, 30); // Typewriter speed

			return () => clearInterval(interval);
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
		setInput("");
		setIsLoading(true);

		try {
			const result: SherlockResponse = await askSherlock(input);
			const agentMessage: Message = {
				id: generateId(),
				role: "agent",
				content: result.text || "The case grows more curious...",
				graph: result.graph,
			};

			setMessages((prev) => [...prev, agentMessage]);
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
			{/* Header - 1950s Noir Style */}
			<div className="border-b border-gray-700 bg-black">
				<div className="container mx-auto px-4 py-6">
					<div className="flex items-center gap-3">
						<Bot className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
						<div>
							<h1 className="text-2xl font-serif text-gray-100 tracking-wide">
								SHERLOCK HOLMES
							</h1>
							<p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
								Blockchain Forensics Division
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Chat Messages */}
			<div
				ref={chatRef}
				className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-[#0a0a0a]"
			>
				<div className="container mx-auto max-w-4xl">
					{messages.map((message, index) => {
						const isLastAgentMessage =
							index === messages.length - 1 && message.role === "agent";
						const displayContent = isLastAgentMessage
							? displayedText
							: message.content;

						return (
							<div
								key={message.id}
								className={`flex gap-4 ${
									message.role === "user" ? "justify-end" : "justify-start"
								}`}
							>
								{message.role === "agent" && (
									<div className="flex-shrink-0 mt-1">
										<div className="w-8 h-8 rounded-full border border-gray-600 bg-black flex items-center justify-center">
											<Bot className="w-4 h-4 text-gray-300" strokeWidth={1.5} />
										</div>
									</div>
								)}

								<div
									className={`max-w-[90%] ${
										message.role === "user"
											? "bg-gray-800 border border-gray-700"
											: "bg-transparent"
									} rounded-lg px-4 py-3`}
								>
									<p
										className={`text-sm leading-relaxed font-mono ${
											message.role === "user" ? "text-gray-100" : "text-gray-300"
										} whitespace-pre-wrap`}
									>
										{displayContent}
										{isLastAgentMessage && isTyping && (
											<span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse" />
										)}
									</p>
									
									{/* Render knowledge graph if available */}
									{message.graph && !isTyping && (
										<div className="mt-4">
											<KnowledgeGraph 
												nodes={message.graph.nodes} 
												edges={message.graph.edges} 
											/>
										</div>
									)}
								</div>

								{message.role === "user" && (
									<div className="flex-shrink-0 mt-1">
										<div className="w-8 h-8 rounded-full border border-gray-600 bg-gray-800 flex items-center justify-center">
											<User className="w-4 h-4 text-gray-300" strokeWidth={1.5} />
										</div>
									</div>
								)}
							</div>
						);
					})}

					{isLoading && messages[messages.length - 1]?.role === "user" && (
						<div className="flex gap-4 justify-start">
							<div className="flex-shrink-0 mt-1">
								<div className="w-8 h-8 rounded-full border border-gray-600 bg-black flex items-center justify-center">
									<Bot className="w-4 h-4 text-gray-300" strokeWidth={1.5} />
								</div>
							</div>
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

			{/* Input Area - Typewriter Style */}
			<div className="border-t border-gray-700 bg-black">
				<div className="container mx-auto max-w-4xl px-4 py-4">
					<form onSubmit={handleSubmit} className="flex gap-3">
						<Textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Type your inquiry here..."
							className="flex-1 min-h-[60px] max-h-[200px] resize-none bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500 font-mono text-sm focus-visible:ring-gray-600"
							disabled={isLoading}
						/>
						<Button
							type="submit"
							disabled={!input.trim() || isLoading}
							className="self-end px-6 bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-600"
						>
							<Send className="w-4 h-4" />
						</Button>
					</form>
					<p className="text-xs text-gray-600 mt-2 font-mono text-center">
						Press Enter to send • Shift+Enter for new line
					</p>
				</div>
			</div>
		</div>
	);
};
