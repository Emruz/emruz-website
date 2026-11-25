import { protectedResourceMetadata } from '@/lib/server/kits/oauth-core';
import { jsonResponse, preflight, serverConfig } from '@/lib/server/kits/server';

// RFC 9728 protected resource metadata for /api/mcp (#67). Also served at
// /.well-known/oauth-protected-resource/api/mcp (path-specific form).
export function GET() {
  return jsonResponse(protectedResourceMetadata(serverConfig), 200, { 'cache-control': 'public, max-age=3600' });
}

export const OPTIONS = preflight;
