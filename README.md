# Simple MCP Client Using LangChain / TypeScript [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/hideya/mcp-langchain-tools-ts-usage/blob/main/LICENSE)

This simple MCP-client demonstrates
[Model Context Protocol](https://modelcontextprotocol.io/) server invocations from
LangChain ReAct Agent by wrapping MCP server tools into LangChain Tools.

It leverages [`@h1deya/mcp-langchain-tools`](https://www.npmjs.com/package/@h1deya/mcp-langchain-tools) package,
which initializes specified MCP servers,
and returns [LangChain Tools](https://js.langchain.com/docs/how_to/tool_calling/)
that wrap the given MCP servers.

Anthropic's `claude-3-5-haiku-latest` is used as the LLM.  
For convenience, code for OpenAI's `gpt-4o-mini` is also included and commented out.

## Requirements

- Node.js version 16 or higher installed
- `ANTHROPIC_API_KEY` - get one from [Anthropic](https://console.anthropic.com/settings/keys)  
  If you switch to using OpenAI's LLM, get `OPENAI_API_KEY` from [OpenAI](https://platform.openai.com/api-keys)

## Usage

1. Install dependencies:

    ```bash
    npm install
    ```

2. Setup API key
    ```bash
    export ANTHROPIC_API_KEY=sk-ant-api...
    # export OPENAI_API_KEY=sk-proj-...
    ```

3. Run the app
    ```bash
    npm start
    ```
