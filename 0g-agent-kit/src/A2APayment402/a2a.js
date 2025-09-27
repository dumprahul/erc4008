import axios from 'axios';
import { createDemoPaymentPayload, encodePaymentPayload } from './payment.js';

export async function sendMessage(serviceUrl, skill, input) {
  const client = axios.create({ baseURL: serviceUrl, timeout: 15000 });
  const payload = { jsonrpc: '2.0', id: 1, method: 'message/send', params: { skill, input } };
  try {
    const resp = await client.post('/a2a', payload);
    if (resp.data && resp.data.error && resp.data.error.code === 402) {
      const accepts = resp.data.error.data?.accepts || resp.data.error.data?.accepts;
      const first = Array.isArray(accepts) ? accepts[0] : accepts;
      const envPayment = process.env.PAYMENT_AMOUNT;
      const value = envPayment || first?.maxAmountRequired || '10000';
      const payment = await createDemoPaymentPayload(process.env.PRIVATE_KEY_ADDRESS || '0xPayer', first.payTo, value, first.asset || '0xVerifier');
      const b64 = encodePaymentPayload(payment);
      const retryResp = await client.post('/a2a', payload, { headers: { 'X-PAYMENT': b64 } });
      return retryResp.data;
    }
    return resp.data;
  } catch (e) {
    throw e;
  }
}
