# crawlfix-mcp

Self-hosted stdio MCP server for Crawlfix. Bridges the
[Model Context Protocol](https://modelcontextprotocol.io) over stdio to the
hosted Crawlfix API so Claude Desktop, Cursor, Windsurf, Claude Code, and any
other MCP client can run audits, fetch fix prompts, verify deploys, manage
monitoring, and more.

Zero external dependencies. Node 18+.

## Install

```bash
# One-off, no install:
npx crawlfix-mcp

# Or install globally:
npm install -g crawlfix-mcp
```

## Auth

Two options. Both end up populating the same place.

```bash
# Option 1: log in once via the crawlfix CLI (recommended).
npx crawlfix login
# saves a bearer token to ~/.crawlfix/credentials.json,
# which crawlfix-mcp picks up automatically.

# Option 2: mint a token in the dashboard and set the env var.
# Get one at https://crawlfix.ai/settings/mcp
export CRAWLFIX_TOKEN=cfix_...
```

## Client configuration

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "crawlfix": {
      "command": "npx",
      "args": ["-y", "crawlfix-mcp"]
    }
  }
}
```

If you didn't run `crawlfix login`, add a `"env"` block:

```json
{
  "mcpServers": {
    "crawlfix": {
      "command": "npx",
      "args": ["-y", "crawlfix-mcp"],
      "env": { "CRAWLFIX_TOKEN": "cfix_..." }
    }
  }
}
```

### Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "crawlfix": {
      "command": "npx",
      "args": ["-y", "crawlfix-mcp"]
    }
  }
}
```

### Claude Code

Add to your project (or user) `.mcp.json`:

```json
{
  "mcpServers": {
    "crawlfix": {
      "command": "npx",
      "args": ["-y", "crawlfix-mcp"]
    }
  }
}
```

Or one-liner:

```bash
claude mcp add crawlfix npx -y crawlfix-mcp
```

## How it works

The bridge reads newline-delimited JSON-RPC from stdin and forwards each
message verbatim to `${CRAWLFIX_SERVER}/api/mcp/rpc` (default
`https://crawlfix.ai`) with `Authorization: Bearer <token>`. Responses are
written back on stdout. Anything internal goes to stderr so it never
corrupts the protocol stream.

That means new tools added server-side appear automatically here without a
code change. Run `tools/list` against the server (or look at the dashboard)
to see the current tool catalog: scans, fix prompts, audit history, AI bot
policy, HEO score, monitoring, exports, and more.

## Environment variables

| Variable           | Purpose                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `CRAWLFIX_TOKEN`   | Bearer token. Takes priority over `~/.crawlfix/credentials.json`.           |
| `CRAWLFIX_SERVER`  | Override the backend URL. Default: `https://crawlfix.ai`.                   |
| `CRAWLFIX_DEBUG`   | Set to `1` to print stack traces on fatal errors.                           |

## Don't want stdio? Use HTTP directly.

Any MCP-over-HTTP client (Cursor, Claude Code, Windsurf) can hit the hosted
endpoint at `https://crawlfix.ai/api/mcp/rpc` directly with the same bearer
token. The hosted variant runs on your dashboard; the stdio bridge in this
repo runs on your machine. Same tool catalog either way.

## Support

Issues, bug reports, or licensing questions: Michael@faction.chat

## License

MIT. See `LICENSE`.
