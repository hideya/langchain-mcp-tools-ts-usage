import { convertMcpToLangchainTools } from '@h1deya/langchain-mcp-tools';
import { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';

// Enable maximum debug logging
process.env.MCP_DEBUG = 'true';

/**
 * Simple implementation of OAuthClientProvider for testing
 */
class TestAuthProvider implements OAuthClientProvider {
  private _clientInfo = { client_id: 'test_client_id' };
  private _tokens = {
    access_token: 'test_token_test_client_id',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'refresh_token'
  };
  private _codeVerifier = 'test_code_verifier';
  
  get redirectUrl() { return 'http://localhost:3000/callback'; }
  get clientMetadata() { 
    return { 
      client_name: 'Test Client',
      redirect_uris: ['http://localhost:3000/callback']
    }; 
  }
  
  async clientInformation() { return this._clientInfo; }
  async saveClientInformation(info) { this._clientInfo = info; }
  async tokens() { return this._tokens; }
  async saveTokens(tokens) { this._tokens = tokens; }
  async codeVerifier() { return this._codeVerifier; }
  async saveCodeVerifier(verifier) { this._codeVerifier = verifier; }
  async redirectToAuthorization(url) { throw new Error('Auth required'); }
}

// Debug logger for client-side events
const log = {
  info: (...args) => console.log('ℹ️', ...args),
  warn: (...args) => console.log('⚠️', ...args),
  error: (...args) => console.log('❌', ...args),
  debug: (...args) => console.log('🔍', ...args),
  success: (...args) => console.log('✅', ...args)
};

// Enhanced debug logging for HTTP
function setupDebugLogging() {
  const originalFetch = global.fetch;
  global.fetch = async function(...args: Parameters<typeof fetch>) {
    const url = args[0].toString();
    const method = args[1]?.method || 'GET';
    log.debug(`HTTP ${method} Request:`, url.substring(0, 80));
    
    // Log request headers if present
    if (args[1]?.headers) {
      log.debug('Request Headers:', args[1].headers);
    }
    
    try {
      const response = await originalFetch(...args);
      log.debug(`HTTP Response: ${response.status} ${response.statusText}`);
      
      // Clone the response so we can read the body for debugging
      // but only for error responses
      if (!response.ok) {
        const clonedResponse = response.clone();
        const bodyText = await clonedResponse.text();
        log.debug(`Response Body:`, bodyText.substring(0, 200));
      }
      
      return response;
    } catch (error) {
      log.error('HTTP Error:', error.message);
      throw error;
    }
  };
}

async function main() {
  log.info('=== MCP SSE AUTH TEST ===');
  setupDebugLogging();
  
  const SERVER_URL = 'http://127.0.0.1:3333';
  
  // 1. Check if server is running
  try {
    log.info('Testing server connection...');
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    log.success('Server is running');
  } catch (error) {
    log.error('Server unavailable:', error.message);
    return;
  }
  
  // 2. Create auth provider and prepare for connection
  const authProvider = new TestAuthProvider();
  const tokens = await authProvider.tokens();
  const tokenPreview = tokens.access_token.substring(0, 15) + '...';
  log.info('Using access token:', tokenPreview);
  log.debug('Auth provider ready with client ID:', (await authProvider.clientInformation()).client_id);
  
  
  try {
    // 3. Connect with auth provider
    log.info('Connecting to MCP with auth...');
    
    // Timeout after 60 seconds to give server time to respond
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout (60s)')), 60000);
    });
    
    log.info('Using URL:', `${SERVER_URL}/sse`);
    log.info('Using access token type:', tokens.token_type);
    
    // Define the result type
    type ToolsResult = { tools: any[]; cleanup: () => Promise<void> };
    
    // Simplify connection approach - use the MCP tools converter directly
    const { tools, cleanup } = await Promise.race<ToolsResult>([
      convertMcpToLangchainTools({
        secureServer: {
          url: `${SERVER_URL}/sse`,
          sseOptions: {
            authProvider
          }
        }
      }),
      timeoutPromise
    ]);
    
    log.success('Connection established successfully!');
    log.info('Available tools:', tools.map(t => t.name).join(', '));
    
    // 4. Test a tool if available
    if (tools.length > 0) {
      const echoTool = tools.find(t => t.name === 'echo');
      if (echoTool) {
        log.info('Testing echo tool...');
        const result = await echoTool.invoke({ message: 'Hello, authenticated MCP!' });
        log.success('Echo tool result:', result);
      } else {
        log.warn('Echo tool not available');
      }
    } else {
      log.warn('No tools available');
    }
    
    // 5. Clean up the connection
    log.info('Cleaning up connection...');
    await cleanup();
    log.success('Test completed successfully!');
    
    
  } catch (error) {
    log.error('Test failed:', error.message);
    
    if (error.stack) {
      const firstLine = error.stack.split('\n')[0];
      log.error('Error details:', firstLine);
    }
    
    log.info('Troubleshooting tips:');
    log.info('1. Make sure the server is running at:', SERVER_URL);
    log.info('2. Verify the token format matches what the server expects');
    log.info('3. Check network connectivity and firewall settings');
  }
}

// Run the test
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
