#!/usr/bin/env node
// Crawlfix MCP server entry point. Zero external dependencies; Node 18+.
//
// Bridges stdio MCP <-> https://crawlfix.ai/api/mcp/rpc so any MCP client
// (Claude Desktop, Cursor, Claude Code, ...) can drive Crawlfix tools.

import { main } from '../src/server.mjs'

main().catch(err => {
  const msg = err && err.message ? err.message : String(err)
  process.stderr.write(`crawlfix-mcp: fatal: ${msg}\n`)
  if (process.env.CRAWLFIX_DEBUG && err && err.stack) {
    process.stderr.write(err.stack + '\n')
  }
  process.exit(1)
})
