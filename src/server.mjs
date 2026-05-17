// Zero-dep stdio MCP server.
//
// MCP stdio transport is newline-delimited JSON-RPC: one JSON message per
// line on stdin, one response line on stdout. Anything written to stdout
// that isn't a JSON-RPC message corrupts the protocol, so all logs go to
// stderr.
//
// Every incoming message is forwarded verbatim to the upstream HTTP MCP
// endpoint with the user's bearer token, and the upstream response is
// written back on stdout. Notifications (JSON-RPC messages with no `id`)
// get no response per spec.
//
// This means new tools server-side appear automatically here without a
// code change. The local server is a pure transport adapter.

import { createInterface } from 'node:readline'
import { loadCredentials, resolveServer, resolveToken } from './config.mjs'

const USER_AGENT = 'crawlfix-mcp/0.1.0'
const REQUEST_TIMEOUT_MS = 60_000

function log(level, event, fields = {}) {
  const entry = { ts: new Date().toISOString(), level, event, ...fields }
  process.stderr.write(JSON.stringify(entry) + '\n')
}

function writeMessage(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n')
}

function isNotification(msg) {
  return msg && typeof msg === 'object' && !('id' in msg)
}

async function forwardToUpstream({ server, token, message }) {
  const url = `${server}/api/mcp/rpc`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json',
        'authorization': `Bearer ${token}`,
        'user-agent': USER_AGENT,
      },
      body: JSON.stringify(message),
      signal: controller.signal,
    })
    const text = await res.text()
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`upstream returned non-JSON (status ${res.status}): ${text.slice(0, 200)}`)
    }
  } finally {
    clearTimeout(timer)
  }
}

function buildInternalError(id, message) {
  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32603, message },
  }
}

function buildAuthError(id) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32000,
      message: 'crawlfix-mcp: no CRAWLFIX_TOKEN set and no token in ~/.crawlfix/credentials.json. Run `crawlfix login` or set CRAWLFIX_TOKEN.',
    },
  }
}

export async function main() {
  const creds = await loadCredentials()
  const server = resolveServer(creds)
  const token = resolveToken(creds)

  log('info', 'crawlfix_mcp.start', { server, has_token: !!token })

  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity })

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed) continue

    let msg
    try {
      msg = JSON.parse(trimmed)
    } catch (err) {
      log('warn', 'crawlfix_mcp.bad_input', { error: err.message })
      // Per JSON-RPC spec, malformed input gets a parse error reply only if
      // we can recover an id. We can't, so silently drop and continue.
      continue
    }

    const id = msg && typeof msg === 'object' ? msg.id ?? null : null
    const notification = isNotification(msg)

    if (!token) {
      if (!notification) writeMessage(buildAuthError(id))
      continue
    }

    try {
      const response = await forwardToUpstream({ server, token, message: msg })
      // Notifications never get a response written back (per JSON-RPC).
      // Upstream might still return null/empty; either way, stay silent.
      if (notification) continue
      if (response == null) {
        writeMessage(buildInternalError(id, 'upstream returned empty body'))
        continue
      }
      writeMessage(response)
    } catch (err) {
      const message = err && err.message ? err.message : String(err)
      log('error', 'crawlfix_mcp.upstream_error', { error: message })
      if (!notification) writeMessage(buildInternalError(id, `upstream error: ${message}`))
    }
  }

  log('info', 'crawlfix_mcp.stop')
}
