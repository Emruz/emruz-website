'use server';

import { saveConsent } from '@/lib/server/privacy';

/** Banner and Cookie settings: "1" allows improvement cookies, anything else is necessary only. */
export async function chooseCookies(form: FormData) {
  await saveConsent(form.get('improve') === '1');
}
