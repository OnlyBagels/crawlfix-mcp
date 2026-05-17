// Token + server resolution. Mirrors the crawlfix CLI's contract so a user
// who's already logged in with `crawlfix login` gets the MCP server working
// for free without setting any env vars.

import { homedir } from 'node:os'
import { join } from 'node:path'
import { promises as fs } from 'node:fs'

export const DEFAULT_SERVER = 'https://crawlfix.ai'

export function getCredentialsPath() {
  return join(homedir(), '.crawlfix', 'credentials.json')
}

export async function loadCredentials() {
  try {
    const raw = await fs.readFile(getCredentialsPath(), 'utf8')
    const data = JSON.parse(raw)
    if (data && typeof data === 'object') return data
    return null
  } catch {
    return null
  }
}

export function resolveServer(creds) {
  if (process.env.CRAWLFIX_SERVER) return stripSlash(process.env.CRAWLFIX_SERVER)
  if (creds && creds.server) return stripSlash(creds.server)
  return DEFAULT_SERVER
}

export function resolveToken(creds) {
  if (process.env.CRAWLFIX_TOKEN) return process.env.CRAWLFIX_TOKEN
  if (creds && creds.token) return creds.token
  return null
}

function stripSlash(s) {
  return s.endsWith('/') ? s.slice(0, -1) : s
}
