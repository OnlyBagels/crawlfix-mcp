# crawlfix-mcp

Self-hosted stdio MCP server for Crawlfix. Bridges the
[Model Context Protocol](https://modelcontextprotocol.io) over stdio to the
hosted Crawlfix API so Claude Desktop, Cursor, Windsurf, and any other MCP
client can run audits, fetch fix prompts, and verify deploys.

> Status: **early scaffold**. The stdio bridge is being implemented. Until
> it ships, use the HTTP MCP endpoint directly at
> `https://crawlfix.ai/api/mcp/rpc` (configurable in any MCP-over-HTTP client
> like Cursor, Claude Code, or Windsurf).

## Planned usage

```bash
# Install + run (once published)
npx crawlfix-mcp
```

Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "crawlfix": {
      "command": "npx",
      "args": ["-y", "crawlfix-mcp"],
      "env": {
        "CRAWLFIX_TOKEN": "cfix_..."
      }
    }
  }
}
```

## How to get a token

```bash
npx crawlfix login        # device-flow login, saves to ~/.crawlfix/credentials.json
```

Or mint one in the dashboard at https://crawlfix.ai/settings/mcp.

## License

MIT. See `LICENSE`.
