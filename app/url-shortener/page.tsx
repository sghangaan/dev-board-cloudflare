"use client";

import { useState, FormEvent } from "react";
import "./shortener.css";

interface ShortenedUrl {
  shortUrl: string;
  shortCode: string;
  longUrl: string;
}

export default function URLShortener() {
  const [longUrl, setLongUrl] = useState('');
  const [result, setResult] = useState<ShortenedUrl | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Deployed Cloudflare Worker URL
  const API_URL = process.env.NEXT_PUBLIC_URL_SHORTENER_API!;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const url = longUrl.trim();
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      setError('Please enter a valid URL (include http:// or https://)');
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to shorten URL');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = result.shortUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="shortener-page">
      <div className="shortener-container">
        <h1>⚡ URL Shortener</h1>
        <p className="subtitle">
          Powered by <span className="badge">Cloudflare Workers + KV</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="longUrl">Enter your long URL</label>
            <input
              type="url"
              id="longUrl"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              placeholder="https://example.com/very/long/url/here"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Shortening...' : 'Shorten URL'}
          </button>
        </form>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {result && (
          <div className="result-card">
            <h3>Your Short URL:</h3>
            <div className="short-url-display">
              <input
                type="text"
                value={result.shortUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={copyToClipboard}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <div className="stats-section">
              <div className="stats-item">
                <strong>Original URL:</strong>
                <br />
                <span className="original-url">{result.longUrl}</span>
              </div>
              <div className="stats-item">
                <strong>Short Code:</strong> {result.shortCode}
              </div>
            </div>
          </div>
        )}

        {!result && !error && (
          <div className="features-list">
            <h3>Features:</h3>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Lightning-fast redirects with global KV storage</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🌍</span>
              <span>Distributed across Cloudflare's edge network</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Secure and reliable URL shortening</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>Click tracking and analytics</span>
            </div>
          </div>
        )}

        <div className="footer">
          Built with Cloudflare Workers + KV Storage
        </div>
      </div>
    </div>
  );
}
