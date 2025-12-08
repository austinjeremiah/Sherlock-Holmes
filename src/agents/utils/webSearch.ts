/**
 * Web Search Utility for Wallet Reputation Analysis
 * Searches various scam databases and public sources
 */

interface ScamDatabaseResult {
	source: string;
	isScam: boolean;
	details: string;
	url?: string;
}

/**
 * Search multiple scam databases and sources for wallet reputation
 */
export async function searchWalletReputation(
	walletAddress: string
): Promise<ScamDatabaseResult[]> {
	const results: ScamDatabaseResult[] = [];

	try {
		// 1. Check Etherscan.io Labels API (publicly available data)
		const etherscanLabels = await checkEtherscanLabels(walletAddress);
		if (etherscanLabels) results.push(etherscanLabels);

		// 2. Check ChainAbuse.com database
		const chainAbuse = await checkChainAbuse(walletAddress);
		if (chainAbuse) results.push(chainAbuse);

		// 3. Pattern-based heuristic check
		const patternCheck = checkAddressPattern(walletAddress);
		if (patternCheck) results.push(patternCheck);
	} catch (error) {
		console.error("[Web Search] Error searching wallet reputation:", error);
	}

	return results;
}

/**
 * Check Etherscan public labels (no API key needed for some endpoints)
 */
async function checkEtherscanLabels(
	address: string
): Promise<ScamDatabaseResult | null> {
	try {
		// Etherscan labels are visible on their website - we check for known patterns
		const response = await fetch(
			`https://etherscan.io/address/${address}`,
			{
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				},
			}
		);

		if (!response.ok) return null;

		const html = await response.text();

		// Check for common scam indicators in Etherscan page
		const scamIndicators = [
			"Fake_Phishing",
			"Phish / Hack",
			"Scam",
			"MEV Bot",
			"Tornado.Cash",
			"Sanctioned",
			"Heist",
			"Exploiter",
		];

		const foundIndicators = scamIndicators.filter((indicator) =>
			html.includes(indicator)
		);

		if (foundIndicators.length > 0) {
			return {
				source: "Etherscan Labels",
				isScam: true,
				details: `Flagged as: ${foundIndicators.join(", ")}`,
				url: `https://etherscan.io/address/${address}`,
			};
		}

		return null;
	} catch (error) {
		console.error("[Etherscan Labels] Error:", error);
		return null;
	}
}

/**
 * Check ChainAbuse.com community-reported scams
 */
async function checkChainAbuse(
	address: string
): Promise<ScamDatabaseResult | null> {
	try {
		// ChainAbuse has a public API for scam reports
		const response = await fetch(
			`https://www.chainabuse.com/api/address/${address}`,
			{
				headers: {
					Accept: "application/json",
				},
			}
		);

		if (!response.ok) return null;

		const data = await response.json();

		if (data && data.reports && data.reports.length > 0) {
			return {
				source: "ChainAbuse Community Reports",
				isScam: true,
				details: `${data.reports.length} scam report(s) filed. Categories: ${data.reports.map((r: any) => r.category).join(", ")}`,
				url: `https://www.chainabuse.com/address/${address}`,
			};
		}

		return null;
	} catch (error) {
		console.error("[ChainAbuse] Error:", error);
		return null;
	}
}

/**
 * Pattern-based address analysis (vanity addresses, known prefixes)
 */
function checkAddressPattern(address: string): ScamDatabaseResult | null {
	const addressLower = address.toLowerCase();

	// Check for suspicious vanity patterns
	const zeroCount = (addressLower.match(/0/g) || []).length;
	const hasRepeatingPattern = /(.)\1{6,}/.test(addressLower);

	// Known scam prefixes
	const knownScamPrefixes = [
		"0x00000", // Common phishing prefix
		"0xdead", // Burn addresses sometimes used in scams
		"0x0000000000", // Extreme vanity
	];

	const hasScamPrefix = knownScamPrefixes.some((prefix) =>
		addressLower.startsWith(prefix)
	);

	if (zeroCount >= 10 || hasRepeatingPattern || hasScamPrefix) {
		return {
			source: "Pattern Analysis",
			isScam: true,
			details: `Suspicious vanity address pattern detected. ${zeroCount} zeros, repeating chars: ${hasRepeatingPattern}, known scam prefix: ${hasScamPrefix}`,
		};
	}

	return null;
}

/**
 * Generate comprehensive reputation summary
 */
export function generateReputationSummary(
	results: ScamDatabaseResult[]
): string {
	if (results.length === 0) {
		return "No public scam reports found in databases. However, this does not guarantee legitimacy.";
	}

	const scamReports = results.filter((r) => r.isScam);

	if (scamReports.length === 0) {
		return "Wallet appears clean in public databases.";
	}

	let summary = `🚨 SCAM ALERTS FOUND (${scamReports.length} source(s)):\n\n`;

	for (const report of scamReports) {
		summary += `• ${report.source}: ${report.details}\n`;
		if (report.url) {
			summary += `  Reference: ${report.url}\n`;
		}
		summary += "\n";
	}

	return summary;
}
