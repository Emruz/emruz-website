import { licensingRoute } from '@/lib/server/api';
import { rateLimit } from '@/lib/server/db';
import { entitle, fail, findSubscription, validDeviceId } from '@/lib/server/licensing';
import { normalizeSubscriptionId } from '@/lib/server/lease';

export const POST = licensingRoute('checkin', async (b) => {
  if (!validDeviceId(b.device_id)) return fail('invalid_request', 'A device_id is required.');
  const sub = normalizeSubscriptionId(b.subscription_id);
  if (!sub) return fail('not_found');
  if (!(await rateLimit(`checkin:sub:${sub}`, 60, 3600))) return fail('rate_limited');
  return entitle(await findSubscription(sub), b.device_id, { app_version: b.app_version as string, os: b.os as string }, { requireRegistered: true });
});
