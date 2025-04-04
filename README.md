# MCP Tools Usage From LangChain / Example in TypeScript [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/hideya/mcp-langchain-tools-ts-usage/blob/main/LICENSE)

This simple [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
client demonstrates the use of MCP server tools by LangChain ReAct Agent.

It leverages a utility function `convertMcpToLangchainTools()` from
[`@h1deya/langchain-mcp-tools`](https://www.npmjs.com/package/@h1deya/langchain-mcp-tools).  
This function handles parallel initialization of specified multiple MCP servers
and converts their available tools into an array of LangChain-compatible tools
([`StructuredTool[]`](https://api.js.langchain.com/classes/_langchain_core.tools.StructuredTool.html)).

Anthropic's `claude-3-5-sonnet-latest` is used as the LLM.
For convenience, code for OpenAI's `gpt-4o` is also included and commented out.

A bit more realistic (conversational) MCP Client is available
[here](https://github.com/hideya/mcp-client-langchain-ts)

A python equivalent of this app is available
[here](https://github.com/hideya/langchain-mcp-tools-py-usage)

## Prerequisites

- Node.js 16+
- npm 7+ (`npx`) to run Node.js-based MCP servers
- [optional] [`uv` (`uvx`)](https://docs.astral.sh/uv/getting-started/installation/)
  installed to run Python-based MCP servers
- API key from [Anthropic](https://console.anthropic.com/settings/keys)
  (or [OpenAI](https://platform.openai.com/api-keys))

## Usage

1. Install dependencies:

    ```bash
    npm install
    ```

2. Setup API key:
    ```bash
    cp .env.template .env
    ```
    - Update `.env` as needed.
    - `.gitignore` is configured to ignore `.env`
      to prevent accidental commits of the credentials.

3. Run the app:
    ```bash
    npm start
    ```
