/**
 * URL Shortener - Cloudflare Worker
 * Handles URL shortening and redirection with analytics
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for API requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Serve the frontend HTML at root
    if (path === '/' || path === '/index.html') {
      return new Response(HTML_TEMPLATE, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // API: Create short URL
    if (path === '/api/shorten' && request.method === 'POST') {
      try {
        const { url: longUrl } = await request.json();

        if (!longUrl || !isValidUrl(longUrl)) {
          return jsonResponse({ error: 'Invalid URL' }, 400, corsHeaders);
        }

        // Generate a random short code (6 characters)
        const shortCode = generateShortCode();

        // Store in KV with metadata
        const data = {
          url: longUrl,
          created: new Date().toISOString(),
          clicks: 0,
        };

        await env.URL_STORE.put(shortCode, JSON.stringify(data));

        const shortUrl = `${url.origin}/${shortCode}`;

        return jsonResponse({
          shortUrl,
          shortCode,
          longUrl
        }, 200, corsHeaders);

      } catch (error) {
        return jsonResponse({ error: 'Failed to create short URL' }, 500, corsHeaders);
      }
    }

    // API: Get URL stats
    if (path.startsWith('/api/stats/') && request.method === 'GET') {
      const shortCode = path.replace('/api/stats/', '');
      const stored = await env.URL_STORE.get(shortCode);

      if (!stored) {
        return jsonResponse({ error: 'Short URL not found' }, 404, corsHeaders);
      }

      const data = JSON.parse(stored);
      return jsonResponse(data, 200, corsHeaders);
    }

    // Redirect: Handle short code
    if (path.length > 1) {
      const shortCode = path.substring(1); // Remove leading slash
      const stored = await env.URL_STORE.get(shortCode);

      if (stored) {
        const data = JSON.parse(stored);

        // Increment click counter
        data.clicks = (data.clicks || 0) + 1;
        await env.URL_STORE.put(shortCode, JSON.stringify(data));

        // Redirect to the original URL
        return Response.redirect(data.url, 302);
      }
    }

    // 404 Not Found
    return new Response('Short URL not found', { status: 404 });
  },
};

// Helper: Generate random short code
function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper: Validate URL
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Helper: JSON response
function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
  });
}

// Embedded HTML Template
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL Shortener - Cloudflare Workers</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 32px;
        }

        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }

        .input-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }

        input[type="url"] {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        input[type="url"]:focus {
            outline: none;
            border-color: #667eea;
        }

        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        button:active {
            transform: translateY(0);
        }

        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .result {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9ff;
            border-radius: 10px;
            display: none;
        }

        .result.show {
            display: block;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .short-url {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }

        .short-url input {
            flex: 1;
            padding: 12px;
            border: 2px solid #667eea;
            border-radius: 8px;
            font-size: 14px;
            background: white;
        }

        .copy-btn {
            padding: 12px 24px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            width: auto;
        }

        .copy-btn:hover {
            background: #5568d3;
        }

        .stats {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
            font-size: 14px;
            color: #666;
        }

        .error {
            margin-top: 15px;
            padding: 15px;
            background: #fee;
            color: #c33;
            border-radius: 8px;
            display: none;
        }

        .error.show {
            display: block;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            color: #999;
            font-size: 12px;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            background: #667eea;
            color: white;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ URL Shortener</h1>
        <p class="subtitle">Powered by <span class="badge">Cloudflare Workers</span></p>

        <div class="input-group">
            <label for="longUrl">Enter your long URL</label>
            <input
                type="url"
                id="longUrl"
                placeholder="https://example.com/very/long/url/here"
                required
            >
        </div>

        <button id="shortenBtn" onclick="shortenUrl()">Shorten URL</button>

        <div class="error" id="error"></div>

        <div class="result" id="result">
            <h3 style="color: #333; margin-bottom: 10px;">Your Short URL:</h3>
            <div class="short-url">
                <input type="text" id="shortUrlInput" readonly>
                <button class="copy-btn" onclick="copyUrl()">Copy</button>
            </div>
            <div class="stats" id="stats"></div>
        </div>

        <div class="footer">
            Built with Cloudflare Workers + KV Storage
        </div>
    </div>

    <script>
        async function shortenUrl() {
            const longUrl = document.getElementById('longUrl').value.trim();
            const btn = document.getElementById('shortenBtn');
            const result = document.getElementById('result');
            const error = document.getElementById('error');

            // Hide previous results
            result.classList.remove('show');
            error.classList.remove('show');

            if (!longUrl) {
                showError('Please enter a URL');
                return;
            }

            // Validate URL
            try {
                new URL(longUrl);
            } catch (e) {
                showError('Please enter a valid URL (include http:// or https://)');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Shortening...';

            try {
                const response = await fetch('/api/shorten', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: longUrl })
                });

                const data = await response.json();

                if (response.ok) {
                    document.getElementById('shortUrlInput').value = data.shortUrl;
                    document.getElementById('stats').innerHTML =
                        '<strong>Original URL:</strong> ' + data.longUrl;
                    result.classList.add('show');
                } else {
                    showError(data.error || 'Failed to shorten URL');
                }
            } catch (err) {
                showError('Network error. Please try again.');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Shorten URL';
            }
        }

        function copyUrl() {
            const input = document.getElementById('shortUrlInput');
            input.select();
            document.execCommand('copy');

            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }

        function showError(message) {
            const error = document.getElementById('error');
            error.textContent = message;
            error.classList.add('show');
        }

        // Allow Enter key to submit
        document.getElementById('longUrl').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                shortenUrl();
            }
        });
    </script>
</body>
</html>`;
