/**
 * AI Chat API - Cloudflare Workers AI
 * Handles chat completions using various AI models
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Chat completion endpoint
      if (path === '/api/chat' && request.method === 'POST') {
        return await handleChat(request, env, corsHeaders);
      }

      // List available models
      if (path === '/api/models' && request.method === 'GET') {
        return jsonResponse({
          models: [
            {
              id: '@cf/meta/llama-3.1-8b-instruct',
              name: 'Llama 3.1 8B',
              description: 'Fast and efficient for general conversations',
              provider: 'Meta'
            },
            {
              id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
              name: 'Llama 3.3 70B',
              description: 'More capable, better reasoning',
              provider: 'Meta'
            },
            {
              id: '@cf/mistral/mistral-7b-instruct-v0.1',
              name: 'Mistral 7B',
              description: 'Great for instruction following',
              provider: 'Mistral'
            },
            {
              id: '@cf/qwen/qwen1.5-14b-chat-awq',
              name: 'Qwen 1.5 14B',
              description: 'Multilingual support',
              provider: 'Qwen'
            }
          ]
        }, 200, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);

    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({
        error: error.message || 'Internal server error'
      }, 500, corsHeaders);
    }
  },
};

/**
 * Handle chat completion
 */
async function handleChat(request, env, corsHeaders) {
  try {
    const { messages, model, stream } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({
        error: 'Messages array is required'
      }, 400, corsHeaders);
    }

    // Default model
    const selectedModel = model || '@cf/meta/llama-3.1-8b-instruct';

    // Handle streaming
    if (stream) {
      return handleStreamingChat(env, messages, selectedModel, corsHeaders);
    }

    // Non-streaming response
    const response = await env.AI.run(selectedModel, {
      messages: messages
    });

    return jsonResponse({
      response: response.response,
      model: selectedModel,
      usage: response.usage || {}
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Chat error:', error);
    return jsonResponse({
      error: error.message || 'Failed to process chat'
    }, 500, corsHeaders);
  }
}

/**
 * Handle streaming chat (Server-Sent Events)
 */
async function handleStreamingChat(env, messages, model, corsHeaders) {
  const stream = await env.AI.run(model, {
    messages: messages,
    stream: true
  });

  // Convert the stream to SSE format
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Process the stream in the background
  (async () => {
    try {
      for await (const chunk of stream) {
        if (chunk.response) {
          const data = `data: ${JSON.stringify({
            content: chunk.response,
            done: false
          })}\n\n`;
          await writer.write(encoder.encode(data));
        }
      }

      // Send completion signal
      await writer.write(encoder.encode('data: {"done":true}\n\n'));
      await writer.close();
    } catch (error) {
      console.error('Streaming error:', error);
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...corsHeaders
    }
  });
}

/**
 * Helper: JSON response
 */
function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
  });
}
