import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph';
import { HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
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

  const llm = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0, maxTokens: 1000 });

  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: new MemorySaver()
  });

  const query = 'Read and briefly summarize the file ./LICENSE';

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
