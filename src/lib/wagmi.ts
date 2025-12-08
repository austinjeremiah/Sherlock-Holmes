import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Sherlock Holmes - Blockchain Forensics',
  projectId: '7a6e6a1f7934519391a590f1b17504df',
  chains: [sepolia],
  ssr: true,
});
