"use client";

import { useState, useEffect, useRef, FormEvent, KeyboardEvent, ChangeEvent } from "react";
import "./chat.css";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

interface Model {
  id: string;
  name: string;
  description: string;
  provider: string;
}

const AVAILABLE_MODELS: Model[] = [
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
];

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState('@cf/meta/llama-3.1-8b-instruct');
  const [showTyping, setShowTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Deployed Cloudflare Worker URL
  const API_URL = 'https://ai-chat-api.sghangaan.workers.dev';

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTyping]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadMessages = () => {
    const saved = localStorage.getItem('chatMessages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load messages:', e);
      }
    }
  };

  const saveMessages = (msgs: Message[]) => {
    localStorage.setItem('chatMessages', JSON.stringify(msgs));
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const autoResize = () => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.style.height = messageInputRef.current.scrollHeight + 'px';
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const message = inputValue.trim();
    if (!message || isLoading) return;

    // Clear input
    setInputValue('');
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
    }

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setShowTyping(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          model: currentModel,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);

    } catch (err: any) {
      console.error('Chat error:', err);
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
      setShowTyping(false);
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    autoResize();
  };

  const clearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      localStorage.removeItem('chatMessages');
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModelName = () => {
    const model = AVAILABLE_MODELS.find(m => m.id === currentModel);
    return model ? model.name : 'Llama 3.1 8B';
  };

  return (
    <div className="chat-page ">
      <div className="chat-wrapper">
        
        {/* Header */}
        <header className="chat-header">
          <div className="header-content">
            <h1>🤖 AI Chat</h1>
            <div className="header-badges">
              <span className="badge">Cloudflare Workers AI</span>
              <span className="badge">{getModelName()}</span>
            </div>
          </div>
          <div className="header-controls">
            <select
              className="model-select"
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
            <button onClick={clearChat} className="btn-secondary">
              Clear Chat
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="chat-container" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div className="welcome-message">
              <div className="welcome-icon">👋</div>
              <h2>Welcome to AI Chat!</h2>
              <p>Start a conversation with AI. Choose a model above and type your message below.</p>
              <div className="features">
                <div className="feature">⚡ Lightning fast responses</div>
                <div className="feature">🌍 Powered by Cloudflare's global network</div>
                <div className="feature">🤖 Multiple AI models available</div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.role}-message`}>
                  <div className="message-avatar">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div className="message-text">{message.content}</div>
                    <div className="message-time">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              ))}

              {showTyping && (
                <div className="message assistant-message">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="message-text">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="error-message">{error}</div>
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="input-container">
          <form onSubmit={handleSubmit} className="chat-form">
            <textarea
              ref={messageInputRef}
              className="message-input"
              placeholder="Type your message here... (Shift+Enter for new line)"
              rows={1}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn-send"
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
          <div className="input-hint">
            Press <kbd>Enter</kbd> to send • <kbd>Shift + Enter</kbd> for new line
          </div>
        </div>
      </div>
    </div>
  );
}
