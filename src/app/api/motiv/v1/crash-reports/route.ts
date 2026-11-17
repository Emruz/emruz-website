import { clientIp, licensingRoute } from '@/lib/server/api';
import { fileCrashReport, parseCrashReport } from '@/lib/server/crash-reports';
import { rateLimit } from '@/lib/server/db';
import { fail } from '@/lib/server/licensing';

// Motiv: a crash report the user chose to send becomes a public issue in
// Emruz/motiv-releases. Needs MOTIV_CRASH_GITHUB_TOKEN.
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
    const { url, duplicate } = await fileCrashReport(report, token);
    return { status: 200, body: { issueUrl: url, duplicate } };
  },
  5,
);
