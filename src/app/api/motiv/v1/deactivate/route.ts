import { licensingRoute } from '@/lib/server/api';
import { deactivateDevice, fail, findSubscription, validDeviceId } from '@/lib/server/licensing';

export const POST = licensingRoute('deactivate', async (b) => {
  if (!validDeviceId(b.device_id)) return fail('invalid_request', 'A device_id is required.');
  const s = await findSubscription(b.subscription_id);
  if (s) await deactivateDevice(s, b.device_id, 'app');
  return { status: 200, body: { ok: true } };
});
