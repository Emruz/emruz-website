import { authServerMetadata } from '@/lib/server/kits/oauth-core';
import { jsonResponse, preflight, serverConfig } from '@/lib/server/kits/server';

// RFC 8414 authorization server metadata for MCP clients (#67)
export function GET() {
  return jsonResponse(authServerMetadata(serverConfig), 200, { 'cache-control': 'public, max-age=3600' });
}

export const OPTIONS = preflight;
