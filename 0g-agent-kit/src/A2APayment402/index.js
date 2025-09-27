import { sendMessage } from './a2a.js';

export async function main() {
  const SERVICE_AGENT_URL = process.env.SERVICE_AGENT_URL || 'http://localhost:5402';
  const input = { text: 'This is a long text to summarize for testing the premium summarize skill.' };
  try {
    const resp = await sendMessage(SERVICE_AGENT_URL, 'premium.summarize', input);
    console.log('A2A response:', JSON.stringify(resp, null, 2));
  } catch (e) {
    console.error('error', e);
    process.exit(1);
  }
}

// Run when executed directly
main().catch(e => { console.error(e); process.exit(1); });

export const startClientAgent = () => {
  console.log('Client agent placeholder');
};
