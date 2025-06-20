import "dotenv/config";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import WebSocket from 'ws';
import * as fs from "fs";

import {
  convertMcpToLangchainTools,
  McpServersConfig,
  McpServerCleanupFn,
  McpToolsLogger
} from "@h1deya/langchain-mcp-tools";

import { startRemoteMcpServerLocally } from "./remote-server-utils";

export async function test(): Promise<void> {
  let mcpCleanup: McpServerCleanupFn | undefined;
  const openedLogFiles: { [serverName: string]: number } = {};

  // If you are interested in testing the SSE/WS server setup, uncomment
  // one of the following code snippets and one of the appropriate "weather"
  // server configurations, while commenting out the others.

  // const [sseServerProcess, sseServerPort] = await startRemoteMcpServerLocally(
  //   "SSE",  "npx -y @h1deya/mcp-server-weather");

  // // NOTE: without the following line, I got this error:
  // //   ReferenceError: WebSocket is not defined
  // //     at <anonymous> (.../node_modules/@modelcontextprotocol/sdk/src/client/websocket.ts:29:26)
  // global.WebSocket = WebSocket as any;
  //
  // const [wsServerProcess, wsServerPort] = await startRemoteMcpServerLocally(
  //   "WS",  "npx -y @h1deya/mcp-server-weather");

  try {
    const mcpServers: McpServersConfig = {
      filesystem: {
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "."  // path to a directory to allow access to
        ],
        // cwd: "/tmp"  // the working directory to be use by the server
      },

      fetch: {
        command: "uvx",
        args: [
          "mcp-server-fetch"
        ]
      },

      weather: {
        command: "npx",
        args: [
          "-y",
         "@h1deya/mcp-server-weather"
        ]
      },
      
      // // Auto-detection example: This will try Streamable HTTP first, then fallback to SSE
      // weather: {
      //   url: `http://localhost:${sseServerPort}/sse`
      // },
      
      // // THIS DOESN'T WORK: Example of explicit transport selection:
      // weather: {
      //   url: `http://localhost:${sseServerPort}/sse`,
      //   transport: "streamable_http"  // Force Streamable HTTP
      // },
      
      // weather: {
      //   url: `http://localhost:${sseServerPort}/sse`,
      //   transport: "sse"  // Force SSE
      // },

      // weather: {
      //   url: `ws://localhost:${wsServerPort}/message`
      // },

      // github: {
      //   type: "http",
      //   url: "https://api.githubcopilot.com/mcp/",
      //   headers: {
      //     "Authorization": `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`
      //   }
      // },
    };

    // If you are interested in MCP server's stderr redirection,
    // uncomment the following code snippets.
    //
    // // Set a file descriptor to which MCP server's stderr is redirected
    // Object.keys(mcpServers).forEach(serverName => {
    //   if (mcpServers[serverName].command) {
    //     const logPath = `mcp-server-${serverName}.log`;
    //     const logFd = fs.openSync(logPath, "w");
    //     mcpServers[serverName].stderr = logFd;
    //     openedLogFiles[logPath] = logFd;
    //   }
    // });
    //
    // // A very simple custom logger example (optional)
    // class SimpleConsoleLogger implements McpToolsLogger {
    //   constructor(private readonly prefix: string = "MCP") {}
    //   private log(level: string, ...args: unknown[]) {
    //     console.log(`\x1b[90m${level}:\x1b[0m`, ...args);
    //   }
    //   public debug(...args: unknown[]) { this.log("DEBUG", ...args); }
    //   public info(...args: unknown[]) { this.log("INFO", ...args); }
    //   public warn(...args: unknown[]) { this.log("WARN", ...args); }
    //   public error(...args: unknown[]) { this.log("ERROR", ...args); }
    // }

    const { tools, cleanup } = await convertMcpToLangchainTools(mcpServers);
    // const { tools, cleanup } = await convertMcpToLangchainTools(mcpServers, { logLevel: "debug" });
    // const { tools, cleanup } = await convertMcpToLangchainTools(
    //   mcpServers, { logger: new SimpleConsoleLogger() }
    // );

    mcpCleanup = cleanup

    // const llm = new ChatAnthropic({
    //   // https://docs.anthropic.com/en/docs/about-claude/pricing
    //   // https://console.anthropic.com/settings/billing
    //   model: "claude-3-5-haiku-latest"
    //   // model: "claude-sonnet-4-0"
    // });

    const llm = new ChatOpenAI({
      // https://platform.openai.com/docs/pricing
      // https://platform.openai.com/settings/organization/billing/overview
      model: "gpt-4o-mini"
      // model: "o4-mini"
    });

    // const llm = new ChatGoogleGenerativeAI({
    //   // https://ai.google.dev/gemini-api/docs/pricing
    //   // https://console.cloud.google.com/billing
    //   model: "gemini-2.0-flash"
    //   // model: "gemini-2.5-pro-preview-06-05"
    // });

    const agent = createReactAgent({
      llm,
      tools
    });

    console.log("\x1b[32m");  // color to green
    console.log("\nLLM model:", llm.constructor.name, llm.model);
    console.log("\x1b[0m");  // reset the color

    // const query = "Read the news headlines on bbc.com";
    // const query = "Read and briefly summarize the LICENSE file";
    const query = "Tomorrow's weather in SF?";

    console.log("\x1b[33m");  // color to yellow
    console.log(query);
    console.log("\x1b[0m");  // reset the color

    const messages =  { messages: [new HumanMessage(query)] }

    const result = await agent.invoke(messages);

    // the last message should be an AIMessage
    const response = result.messages[result.messages.length - 1].content;

    console.log("\x1b[36m");  // color to cyan
    console.log(response);
    console.log("\x1b[0m");  // reset the color

  } finally {
    await mcpCleanup?.();

    // the following only needed when testing the `stderr` key
    Object.keys(openedLogFiles).forEach(logPath => {
      try {
        fs.closeSync(openedLogFiles[logPath]);
      } catch (error) {
        console.error(`Error closing log file: ${logPath}:`, error);
      }
    });
    // the followings only needed when testing the `url` key
    if (typeof sseServerProcess !== 'undefined') {
      sseServerProcess.kill();
    }
    if (typeof wsServerProcess !== 'undefined') {
      wsServerProcess.kill();
    }
  }
}

test().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
