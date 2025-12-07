import { env } from "../../../env";
import type { EtherscanTransaction, EtherscanTokenTransfer } from "../types";

// Ethereum Mainnet API V2
const ETHERSCAN_API_URL = "https://api.etherscan.io/v2/api";

/**
 * Fetches normal transactions for a wallet from Etherscan
 */
export async function fetchWalletTransactions(
	address: string,
	startBlock: number = 0,
	endBlock: number = 99999999,
): Promise<EtherscanTransaction[]> {
	try {
		const url = `${ETHERSCAN_API_URL}?chainid=1&module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${env.ETHERSCAN_API_KEY}`;

		console.log('[Etherscan] Fetching Mainnet transactions for:', address);
		
		const response = await fetch(url);
		const data = await response.json();

		console.log('[Etherscan] API Response status:', data.status, data.message);

		if (data.status === "1" && data.result) {
			console.log('[Etherscan] Found', data.result.length, 'transactions');
			return data.result as EtherscanTransaction[];
		}

		console.log('[Etherscan] No transactions found');
		return [];
	} catch (error) {
		console.error("Error fetching transactions:", error);
		return [];
	}
}

/**
 * Fetches ERC-20 token transfers for a wallet from Etherscan
 */
export async function fetchTokenTransfers(
	address: string,
	startBlock: number = 0,
	endBlock: number = 99999999,
): Promise<EtherscanTokenTransfer[]> {
	try {
		const url = `${ETHERSCAN_API_URL}?chainid=1&module=account&action=tokentx&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${env.ETHERSCAN_API_KEY}`;

		const response = await fetch(url);
		const data = await response.json();

		if (data.status === "1" && data.result) {
			return data.result as EtherscanTokenTransfer[];
		}

		return [];
	} catch (error) {
		console.error("Error fetching token transfers:", error);
		return [];
	}
}

/**
 * Fetches wallet balance from Etherscan
 */
export async function fetchWalletBalance(address: string): Promise<string> {
	try {
		const url = `${ETHERSCAN_API_URL}?chainid=1&module=account&action=balance&address=${address}&tag=latest&apikey=${env.ETHERSCAN_API_KEY}`;

		const response = await fetch(url);
		const data = await response.json();

		if (data.status === "1" && data.result) {
			// Convert from Wei to ETH
			const balanceInEth = (Number.parseInt(data.result) / 1e18).toFixed(4);
			return balanceInEth;
		}

		return "0";
	} catch (error) {
		console.error("Error fetching balance:", error);
		return "0";
	}
}

/**
 * Known risky addresses (mixers, exploits, etc.)
 * In production, this would come from a larger database
 */
export const KNOWN_MIXERS = [
	"0x8589427373d6d84e98730d7795d8f6f8731fda16", // Tornado Cash: TORN Token
	"0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936", // Tornado Cash: 0.1 ETH
	"0x910cbd523d972eb0a6f4cae4618ad62622b39dbf", // Tornado Cash: 1 ETH
	"0xa160cdab225685da1d56aa342ad8841c3b53f291", // Tornado Cash: 10 ETH
	"0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3", // Tornado Cash: Router
];

export const KNOWN_EXCHANGES = [
	"0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be", // Binance
	"0xd551234ae421e3bcba99a0da6d736074f22192ff", // Binance
	"0x28c6c06298d514db089934071355e5743bf21d60", // Binance US
	"0x21a31ee1afc51d94c2efccaa2092ad1028285549", // Binance
	"0x0681d8db095565fe8a346fa0277bffde9c0edbbf", // Binance
];

/**
 * Checks if an address is a known mixer
 */
export function isKnownMixer(address: string): boolean {
	return KNOWN_MIXERS.includes(address.toLowerCase());
}

/**
 * Checks if an address is a known exchange
 */
export function isKnownExchange(address: string): boolean {
	return KNOWN_EXCHANGES.includes(address.toLowerCase());
}
