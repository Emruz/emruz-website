# Emruz kits over MCP

emruz.com serves the Emruz kits (Claude skills from the `Emruz/emruz-kits` repo) as a remote MCP server, with emruz.com as the OAuth 2.1 authorization server. Issue #67.

## Endpoints

| Path | What |
|---|---|
| `/api/mcp` | MCP server: Streamable HTTP, stateless, JSON responses, read-only |
| `/.well-known/oauth-protected-resource` (and `/api/mcp` suffix) | Protected resource metadata (RFC 9728) |
| `/.well-known/oauth-authorization-server` | Authorization server metadata (RFC 8414) |
| `/api/oauth/register` | Dynamic client registration (RFC 7591), public clients only |
| `/oauth/authorize` | Sign-in and consent page |
| `/api/oauth/token` | Authorization code with PKCE S256, refresh with rotation |
| `/api/oauth/revoke` | Revocation (RFC 7009); revoking either token ends the grant |

Access tokens are EdDSA JWTs, 10 minutes, audience `/api/mcp`. Refresh tokens are opaque, 30 days, single use; a reused refresh token revokes the whole grant and sends an alert. Codes are single use and die after one failed attempt. Client ID Metadata Documents are not supported yet; Claude falls back to dynamic registration.

## Tools

`list_skills`, `search_skills`, `get_skill`, `get_skill_file`, plus `resources/list` and `resources/read` for SKILL.md. Every call reads the account's entitlements, so a grant or revocation takes effect on the next call.

## Access

- Free skills (`access: free` in the manifest): any signed-in account.
- Paid skills: an entitlement in `kit_entitlements` for the skill's pack, or `all`. `through_ref` empty follows new releases; a tag holds the account at that release.
- Staff grant and revoke on `/admin/kits`. Accounts see their kits and disconnect apps on `/motiv/account#kits`.

## Content and releases

The site follows the newest published GitHub Release of `SKILLS_REPO` (drafts and pre-releases are ignored), checked every 10 minutes. Publishing a release makes it live; no deploy needed. Each release's `.tar.gz` is checked against its `SHA256SUMS` asset and its manifest validated (source `emruz-kits`, a `pack` on every skill). If the newest release fails, the site keeps serving the last good one and emails a `kits_release_invalid` alert. Archives are cached in Netlify Blobs (`kits-releases`) and `.data/kits` locally.

To hold the site at one release (for example to back out a bad release), set `SKILLS_REF` to its tag in Netlify and redeploy. Remove it to follow releases again.

## Environment

| Variable | Notes |
|---|---|
| `MCP_TOKEN_PRIVATE_KEY` | Ed25519 PKCS8 PEM, one line with literal `\n`. Secret, Functions scope. `openssl genpkey -algorithm ed25519` |
| `MCP_TOKEN_KID` | `m1`. Change it together with the key when rotating; existing access tokens then fail and clients refresh. |
| `SKILLS_REPO` | `Emruz/emruz-kits` |
| `SKILLS_TOKEN` | Fine-grained token, that repo only, Contents read-only, with an expiry. Secret. Renew before it expires. |
| `SKILLS_REF` | Optional hold, see above |

## Rate limits

Registration 10/hour per IP and 200/hour total. Authorize 30 per 10 minutes per IP. Token 60/hour per client and 120/hour per IP. MCP without a valid token 60/hour per IP; signed in 600/hour per account and 300/hour per client; 5,000/hour in total. Over a limit: 429 with Retry-After. Edge rate limiting is a follow-up.

## Connecting

- claude.ai: Settings, Connectors, Add custom connector, URL `https://emruz.com/api/mcp`.
- Claude Code: `claude mcp add --transport http emruz-kits https://emruz.com/api/mcp`, then `/mcp` to sign in.

## Data

Migration 021: `oauth_clients`, `oauth_grants`, `oauth_codes`, `oauth_refresh_tokens`, `kit_entitlements`, `mcp_audit`. The daily purge function deletes expired codes and refresh tokens, grants revoked over a year ago, and audit rows over a year old.
