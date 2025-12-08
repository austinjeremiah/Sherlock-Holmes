import axios from 'axios';
import { withPaymentInterceptor } from 'x402-axios';
import type { WalletClient } from 'viem';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function investigateWithPayment(
  walletAddress: string,
  walletClient: WalletClient
) {
  // Create x402-enabled axios client with the wallet client directly
  const client = withPaymentInterceptor(
    axios.create({
      baseURL: API_URL,
    }),
    walletClient as any // x402 accepts viem WalletClient as signer
  );

  try {
    // Make request - x402 client automatically handles 402 response
    const response = await client.post('/api/investigate', {
      walletAddress,
    });

    return response.data;
  } catch (error) {
    console.error('Investigation error:', error);
    if (axios.isAxiosError(error)) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error('Payment server is not running. Please start the server with: npm run dev:server');
      }
      throw new Error(error.response?.data?.error || error.message);
    }
    throw error;
  }
}
