import { licensingRoute } from '@/lib/server/api';
import { SITE_URL } from '@/lib/server/config';
import { fail, startPairing, validDeviceId } from '@/lib/server/licensing';

export const POST = licensingRoute(
  'pair-start',
  async (b) => {
    if (!validDeviceId(b.device_id)) return fail('invalid_request', 'A device_id is required.');
    return startPairing(b.device_id, b as never, SITE_URL);
  },
  10,
);
