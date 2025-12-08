import { Code2, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Navbar } from "./_components/navbar";
import { GridScan } from "@/components/GridScan";

export default function Home() {
	return (
		<>
			<Navbar />
			<div className="min-h-screen relative flex flex-col justify-center overflow-hidden">
				{/* GridScan Background */}
				<div className="absolute inset-0 w-full h-full">
					<GridScan
						sensitivity={0.55}
						lineThickness={1}
						linesColor="#00ff00"
						gridScale={0.1}
						scanColor="#00ff00"
						scanOpacity={0.4}
						enablePost
						bloomIntensity={0.6}
						chromaticAberration={0.002}
						noiseIntensity={0.01}
					/>
				</div>

				{/* Content Overlay */}
				<main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20 sm:pb-24">
					<div className="max-w-4xl mx-auto text-center">
						<div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-accent border border-border mb-6 sm:mb-8">
							<Sparkles className="w-4 h-4 text-primary" />
							<span className="text-xs sm:text-sm font-medium text-muted-foreground">
								Anonymous wallets are only anonymous until we look
							</span>
						</div>
						<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight text-white">
							Sherlock Holmes
						</h1>

						<p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 px-2">
							Multi-agent forensic intelligence for Web3. Evidence extraction, risk scoring, identity hints, behavioural patterns, verdict generation — automated.
						</p>

					<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center flex-wrap">
						<Link
							href="/investigate"
							className={buttonVariants({
								size: "lg",
								variant: "default",
								className:
									"flex items-center gap-2 w-full sm:w-auto justify-center",
							})}
						>
							<Zap className="w-5 h-5" />
							Get Started
						</Link>							<Link
								href="https://github.com/austinjeremiah/Sherlock-Holmes/blob/main/README.md"
								target="_blank"
								rel="noopener noreferrer"
								className={buttonVariants({
									size: "lg",
									variant: "outline",
									className:
										"flex items-center gap-2 w-full sm:w-auto justify-center",
								})}
							>
								<Code2 className="w-5 h-5" />
								View Documentation
							</Link>
						</div>
					</div>
				</main>
			</div>
		</>
	);
}
