import { licensingRoute } from '@/lib/server/api';
import { fail, pollPairing, validDeviceId } from '@/lib/server/licensing';

export const POST = licensingRoute(
  'pair-poll',
  async (b) => {
    if (!validDeviceId(b.device_id)) return fail('invalid_request', 'A device_id is required.');
    return pollPairing(b.device_code, b.device_id);
  },
  40,
);
