"use client";

import { useEffect, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";

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

export const KnowledgeGraph = ({ nodes, edges }: KnowledgeGraphProps) => {
	const graphRef = useRef<any>();

	useEffect(() => {
		if (graphRef.current) {
			graphRef.current.d3Force("charge").strength(-400);
			graphRef.current.d3Force("link").distance(150);
		}
	}, []);

	const getNodeColor = (node: GraphNode) => {
		if (node.type === "target") return "#00ff00";
		if (node.type === "mixer") return "#ff0000";
		if (node.type === "cex") return "#00bfff";
		if (node.type === "contract") return "#ffa500";
		return "#808080";
	};

	const getNodeSize = (node: GraphNode) => {
		if (node.type === "target") return 12;
		if (node.type === "mixer") return 10;
		if (node.type === "cex") return 10;
		return 8;
	};

	const getLinkColor = (edge: any) => {
		if (edge.risk === "high") return "#ff0000";
		if (edge.risk === "medium") return "#ffa500";
		return "#555555";
	};

	return (
		<div className="w-full h-[600px] bg-black border border-gray-700 rounded-lg overflow-hidden">
			<ForceGraph2D
				ref={graphRef}
				graphData={{ nodes, links: edges }}
				nodeLabel={(node: any) => {
					const edge = edges.find(
						(e) => e.source === node.id || e.target === node.id
					);
					return `${node.id}\nType: ${node.type.toUpperCase()}\n${edge ? `${edge.txCount} txs | ${edge.totalValue} ETH` : ""}`;
				}}
				nodeColor={getNodeColor}
				nodeRelSize={getNodeSize}
				linkColor={getLinkColor}
				linkWidth={2}
				linkDirectionalArrowLength={6}
				linkDirectionalArrowRelPos={1}
				linkCurvature={0.2}
				backgroundColor="#000000"
				nodeCanvasObject={(node: any, ctx, globalScale) => {
					const label = node.id.substring(0, 8) + "...";
					const fontSize = 12 / globalScale;
					ctx.font = `${fontSize}px monospace`;
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";

					// Draw node circle
					ctx.beginPath();
					ctx.arc(node.x, node.y, getNodeSize(node), 0, 2 * Math.PI, false);
					ctx.fillStyle = getNodeColor(node);
					ctx.fill();
					ctx.strokeStyle = "#ffffff";
					ctx.lineWidth = 1 / globalScale;
					ctx.stroke();

					// Draw label
					ctx.fillStyle = "#ffffff";
					ctx.fillText(label, node.x, node.y + getNodeSize(node) + 5);
				}}
				enableNodeDrag={true}
				enableZoomInteraction={true}
				enablePanInteraction={true}
			/>
		</div>
	);
};
