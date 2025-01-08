import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';
import { ChatAnthropic } from '@langchain/anthropic';
// import { ChatOpenAI } from '@langchain/openai';
import { convertMCPServersToLangChainTools, MCPServersConfig } from '@h1deya/mcp-langchain-tools';

export async function test(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable needs to be set');
  }

  const mcpServers: MCPServersConfig = {
    filesystem: {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        '.'  // path to a directory to allow access to
      ]
    },
    fetch: {
      command: 'uvx',
      args: [
        'mcp-server-fetch'
      ]
    }
  };

  const { tools, cleanup } = await convertMCPServersToLangChainTools(mcpServers);

  const llm = new ChatAnthropic({
    model: 'claude-3-5-haiku-latest', temperature: 0, maxTokens: 1000
  });
  // const llm = new ChatOpenAI({
  //   model: 'gpt-4o-mini', temperature: 0, maxTokens: 1000
  // });

  const agent = createReactAgent({
    llm,
    tools
  });

  const query = 'Read the news headlines on cnn.com';
  // const query = 'Read and briefly summarize the LICENSE file';

  console.log('\x1b[33m');  // color to yellow
  console.log(query);
  console.log('\x1b[0m');  // reset the color

  const agentFinalState = await agent.invoke(
    { messages: [new HumanMessage(query)] },
    { configurable: { thread_id: 'test-thread' } }
  );

  const result = agentFinalState.messages[agentFinalState.messages.length - 1].content;

  console.log('\x1b[36m');  // color to cyan
  console.log(result);
  console.log('\x1b[0m');  // reset the color

  cleanup();
}

test().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
