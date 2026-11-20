import { clientIp, licensingRoute } from '@/lib/server/api';
import { fileCrashReport, parseCrashReport } from '@/lib/server/crash-reports';
import { rateLimit } from '@/lib/server/db';
import { fail } from '@/lib/server/licensing';

// Motiv: a crash or error report, a reported problem or a suggested feature
// the user chose to send becomes a labelled issue in the private Emruz/motiv
// repo. Needs MOTIV_CRASH_GITHUB_TOKEN (Issues: read and write).
export const POST = licensingRoute(
  'crash-report',
  async (b, req) => {
    const token = process.env.MOTIV_CRASH_GITHUB_TOKEN;
    if (!token) {
      console.error('motiv crash-report: MOTIV_CRASH_GITHUB_TOKEN is not set');
      return fail('server_error');
    }
    const report = parseCrashReport(b);
    if (typeof report === 'string') return fail('invalid_request', report);
    if (!(await rateLimit(`crash-report:ip-hour:${clientIp(req)}`, 20, 3600))) return fail('rate_limited');
    if (!(await rateLimit('crash-report:all-hour', 200, 3600))) return fail('rate_limited');
    const { duplicate } = await fileCrashReport(report, token);
    return { status: 200, body: { ok: true, duplicate } };
  },
  5,
);
