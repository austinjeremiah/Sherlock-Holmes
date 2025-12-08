import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { paymentMiddleware } from 'x402-hono';
import { serve } from '@hono/node-server';
import { env } from '../../env';
import { askSherlock } from '../app/investigate/_actions';

const app = new Hono();

// Enable CORS
app.use('/*', cors());

// Apply x402 payment middleware globally with route-specific pricing
app.use(
  paymentMiddleware(
    env.PAYMENT_WALLET as `0x${string}`, // payTo address
    {
      '/api/investigate': {
        price: '$0.0001', // Minimum allowed: $0.0001 USDC on Base Sepolia
        network: 'base-sepolia', // Base Sepolia testnet (x402 supported)
      },
    },
    {
      url: 'https://x402.org/facilitator', // x402 facilitator for base-sepolia
    }
  )
);

// Investigation endpoint (protected by x402)
app.post('/api/investigate', async (c) => {
  try {
    const { walletAddress } = await c.req.json();
    
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return c.json({ error: 'Invalid wallet address' }, 400);
    }

    // Run the court investigation
    const result = await askSherlock(walletAddress);
    
    return c.json(result);
  } catch (error) {
    console.error('Investigation error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Investigation failed' 
    }, 500);
  }
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

const port = parseInt(process.env.PORT || '3001');

console.log(`🚀 x402 Payment Server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running at http://localhost:${port}`);
