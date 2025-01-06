# Simple MCP Client Using LangChain / TypeScript [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/hideya/react/blob/main/LICENSE)

This simple MCP-client demonstrates
[Model Context Protocol](https://modelcontextprotocol.io/) server invocations from
LangChain ReAct Agent by wrapping MCP server tools into LangChain Tools.

It leverages [`@h1deya/mcp-langchain-tools`](https://www.npmjs.com/package/@h1deya/mcp-langchain-tools) package,
which initializes specified MCP servers,
and returns [LangChain Tools](https://js.langchain.com/docs/how_to/tool_calling/)
that wrap the given MCP servers.

OpenAI's `gpt-4o-mini` is used as the LLM.

## Usage

1. Install dependencies:

    ```bash
    npm install
    ```

2. Setup API key
    ```bash
    export OPENAI_API_KEY=sk-proj-...
    ```

3. Run the app
    ```bash
    npm start
    ```
