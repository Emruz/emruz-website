import { licensingRoute } from '@/lib/server/api';
import { rateLimit } from '@/lib/server/db';
import { entitle, fail, findSubscription, validDeviceId } from '@/lib/server/licensing';
import { normalizeSubscriptionId } from '@/lib/server/lease';

export const POST = licensingRoute('activate', async (b) => {
  if (!validDeviceId(b.device_id)) return fail('invalid_request', 'A device_id is required.');
  const sub = normalizeSubscriptionId(b.subscription_id);
  if (!sub) return fail('not_found');
  if (!(await rateLimit(`activate:sub:${sub}`, 20, 3600))) return fail('rate_limited');
  return entitle(await findSubscription(sub), b.device_id, b as never);
});
