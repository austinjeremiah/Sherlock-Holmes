"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
	ssr: false,
});

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

interface KnowledgeGraphProps {
	nodes: GraphNode[];
	edges: GraphEdge[];
}

interface NodeDetails {
	address: string;
	type: string;
	riskLevel: string;
	txCount: number;
	ethVolume: string;
	connections: number;
}

export const KnowledgeGraph = ({ nodes, edges }: KnowledgeGraphProps) => {
	const graphRef = useRef<any>(null);
	const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
	const [nodeDetailsMap, setNodeDetailsMap] = useState<Map<string, NodeDetails>>(new Map());

	// Pre-calculate all node details on mount and when edges change
	useEffect(() => {
		const detailsMap = new Map<string, NodeDetails>();
		
		console.log('[Graph] Received nodes:', nodes);
		console.log('[Graph] Received edges:', edges);
		
		nodes.forEach(node => {
			// Check if node has metadata already (from evidence agent)
			const nodeMeta = node as any;
			
			console.log(`[Graph] Processing node ${node.id}:`, {
				type: node.type,
				hasTxCount: nodeMeta.txCount !== undefined,
				hasEthVolume: nodeMeta.ethVolume !== undefined,
				txCount: nodeMeta.txCount,
				ethVolume: nodeMeta.ethVolume,
				connections: nodeMeta.connections
			});
			
			if (nodeMeta.txCount !== undefined && nodeMeta.ethVolume !== undefined) {
				// Use metadata directly from node
				detailsMap.set(node.id, {
					address: node.id,
					type: node.type,
					riskLevel: node.riskLevel || "low",
					txCount: nodeMeta.txCount,
					ethVolume: nodeMeta.ethVolume,
					connections: nodeMeta.connections || 1,
				});
			} else {
				// For target node, calculate from all edges
				const connectedEdges = edges.filter(
					(e) => e.source === node.id
				);

				const totalTxCount = connectedEdges.reduce(
					(sum, edge) => sum + (edge.txCount || 0),
					0
				);
				const totalVolume = connectedEdges.reduce((sum, edge) => {
					const value = parseFloat(edge.totalValue || '0');
					return sum + (isNaN(value) ? 0 : value);
				}, 0);

				detailsMap.set(node.id, {
					address: node.id,
					type: node.type,
					riskLevel: node.riskLevel || "low",
					txCount: totalTxCount,
					ethVolume: totalVolume.toFixed(4),
					connections: connectedEdges.length,
				});
			}
		});

		console.log('[Graph] Final details map:', detailsMap);
		setNodeDetailsMap(detailsMap);
	}, [nodes, edges]);

	useEffect(() => {
		if (graphRef.current) {
			// Radial layout - target in center, counterparties around it
			graphRef.current.d3Force("charge").strength(-1000);
			graphRef.current.d3Force("link").distance(200);
		}
	}, []);

	const getNodeColor = (node: GraphNode) => {
		if (node.type === "target") return "#ff4444"; // Red center
		if (node.type === "mixer") return "#ff0000"; // Red
		if (node.type === "cex") return "#4169e1"; // Royal Blue
		if (node.type === "contract") return "#9370db"; // Purple
		return "#708090"; // Slate Gray
	};

	const getNodeSize = (node: GraphNode) => {
		if (node.type === "target") return 20; // Bigger center
		if (node.type === "mixer") return 12;
		if (node.type === "cex") return 12;
		return 10;
	};

	const getLinkColor = (edge: any) => {
		if (edge.risk === "high") return "#ff0000";
		if (edge.risk === "medium") return "#ffa500";
		return "#555555";
	};

	const handleNodeClick = (node: any) => {
		setSelectedNode(node as GraphNode);
	};

	return (
		<div className="relative w-full">
			<div className="w-full h-[600px] bg-white border border-gray-300 rounded-lg overflow-hidden">
				<ForceGraph2D
					ref={graphRef}
					graphData={{ nodes, links: edges }}
					nodeLabel={(node: any) => {
						const details = nodeDetailsMap.get(node.id);
						if (!details) return node.id;
						return `${details.type.toUpperCase()}\n${details.txCount} txs | ${details.ethVolume} ETH`;
					}}
					nodeColor={getNodeColor}
					nodeRelSize={10}
					nodeVal={(node: any) => getNodeSize(node)}
					linkColor={() => "#555555"}
					linkWidth={1}
					linkDirectionalArrowLength={8}
					linkDirectionalArrowRelPos={1}
					linkCurvature={0}
					linkDirectionalParticles={2}
					linkDirectionalParticleWidth={2}
					backgroundColor="#ffffff"
					nodeCanvasObject={(node: any, ctx, globalScale) => {
						const label = node.id.substring(0, 6) + "..." + node.id.substring(node.id.length - 4);
						const fontSize = 10 / globalScale;
						ctx.font = `${fontSize}px Arial`;
						ctx.textAlign = "center";
						ctx.textBaseline = "middle";

						// Draw node circle
						ctx.beginPath();
						ctx.arc(node.x, node.y, getNodeSize(node), 0, 2 * Math.PI, false);
						ctx.fillStyle = getNodeColor(node);
						ctx.fill();
						ctx.strokeStyle = "#ffffff";
						ctx.lineWidth = 2 / globalScale;
						ctx.stroke();

						// Draw label below node
						ctx.fillStyle = "#000000";
						ctx.fillText(label, node.x, node.y + getNodeSize(node) + 15);
					}}
					onNodeClick={handleNodeClick}
					enableNodeDrag={true}
					enableZoomInteraction={true}
					enablePanInteraction={true}
					cooldownTime={3000}
					warmupTicks={100}
				/>
			</div>

			{/* Details Panel */}
			{selectedNode && nodeDetailsMap.get(selectedNode.id) && (
				<div className="absolute top-4 right-4 bg-black border border-green-500 rounded-lg p-4 max-w-md shadow-lg">
					<div className="flex justify-between items-start mb-3">
						<h3 className="text-green-500 font-bold text-sm">NODE DETAILS</h3>
						<button
							onClick={() => setSelectedNode(null)}
							className="text-gray-400 hover:text-white"
						>
							✕
						</button>
					</div>

					<div className="space-y-2 text-xs font-mono text-gray-300">
						<div>
							<span className="text-gray-500">ADDRESS:</span>
							<div className="text-green-400 break-all">
								{nodeDetailsMap.get(selectedNode.id)!.address}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div>
								<span className="text-gray-500">TYPE:</span>
								<div className="text-white uppercase">
									{nodeDetailsMap.get(selectedNode.id)!.type}
								</div>
							</div>

							<div>
								<span className="text-gray-500">RISK:</span>
								<div
									className={`uppercase ${
										nodeDetailsMap.get(selectedNode.id)!.riskLevel === "high"
											? "text-red-500"
											: nodeDetailsMap.get(selectedNode.id)!.riskLevel === "medium"
												? "text-yellow-500"
												: "text-green-500"
									}`}
								>
									{nodeDetailsMap.get(selectedNode.id)!.riskLevel}
								</div>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div>
								<span className="text-gray-500">TRANSACTIONS:</span>
								<div className="text-white">
									{nodeDetailsMap.get(selectedNode.id)!.txCount}
								</div>
							</div>

							<div>
								<span className="text-gray-500">ETH VOLUME:</span>
								<div className="text-white">
									{nodeDetailsMap.get(selectedNode.id)!.ethVolume}
								</div>
							</div>
						</div>

						<div>
							<span className="text-gray-500">CONNECTIONS:</span>
							<div className="text-white">
								{nodeDetailsMap.get(selectedNode.id)!.connections}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
