import { useState } from 'react';
import '../Home/Home.css';
import { useNavigate } from 'react-router-dom';
import { 
    FeatherIcon, 
    MemoryIcon, 
    DocSection, 
    CodeBlock, 
    Alert,
    FeatureCard,
    ConfigTable,
    PropCard,
    AgentPropertiesTable,
    MemoryPropertiesTable,
    ExampleCard,
    PaletteIcon,
    DeviceIcon,
    PositionIcon,
    BoltIcon,
    BrandIcon,
    AgentIcon,
    TestCard,
    ApiMethodsTable,
} from '../Docs/DocsComponents.jsx';

export default function DocsPage() {
  const [, setActiveSection] = useState('quick-start');
  const [consoleLog, setConsoleLog] = useState(['Ready to run tests...']);
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const log = (message, type = 'info') => {
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : '→';
    setConsoleLog(prev => [...prev, `${icon} ${message}`]);
  };

  const clearChatbot = () => {
    if (window.destroyChatbot) {
      window.destroyChatbot();
      log('Chatbot destroyed', 'success');
      
      const customContainer = document.getElementById('custom-chat-container');
      if (customContainer) {
        customContainer.remove();
      }
    } else {
      log('destroyChatbot function not available', 'error');
    }
  };

  const test1 = () => {
    log('Running Test 1: Default Light Theme');
    if (window.initChatbot) {
      window.initChatbot();
      log('Default light theme initialized', 'success');
    }
  };

  const test2 = () => {
    log('Running Test 2: Custom Position');
    if (window.initChatbot) {
      window.initChatbot({ 
        position: { bottom: 50, right: 50 } 
      });
      log('Custom position applied (50px from edges)', 'success');
    }
  };

  const test3 = () => {
    log('Running Test 3: Dark Theme');
    if (window.initChatbot) {
      window.initChatbot({ 
        theme: 'dark' 
      });
      log('Dark theme initialized', 'success');
    }
  };

  const test4 = () => {
    log('Running Test 4: Embedded in Container');
    
    if (window.destroyChatbot) {
      window.destroyChatbot();
      log('Previous chatbot destroyed', 'success');
    }
    
    const existingContainer = document.getElementById('custom-chat-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    setTimeout(() => {
      const customContainer = document.createElement('div');
      customContainer.id = 'custom-chat-container';
      customContainer.style.height = '80vh';
      customContainer.style.width = '90%';
      customContainer.style.maxWidth = '1200px';
      customContainer.style.margin = '20px auto';
      customContainer.style.border = '2px solid #8b5cf6';
      customContainer.style.borderRadius = '12px';
      customContainer.style.overflow = 'hidden';
      customContainer.style.position = 'relative';
      document.body.appendChild(customContainer);
      
      const chatRoot = document.createElement('div');
      chatRoot.id = 'chatbot-widget-root';
      chatRoot.style.height = '100%';
      chatRoot.style.width = '100%';
      customContainer.appendChild(chatRoot);
      
      if (window.initChatbot) {
        window.initChatbot({
          embedded: true,
          theme: 'light',
          customStyles: {
            container: { height: '100%', position: 'relative' },
            paper: { height: '100%', maxHeight: 'none' }
          }
        });
        log('Chatbot embedded in custom container (80vh)', 'success');
      }
    }, 150);
  };

  const test5 = () => {
    log('Running Test 5: Custom Branding (Purple Gradient)');
    if (window.initChatbot) {
      window.initChatbot({
        theme: 'dark',
        greeting: 'Hello! Welcome to Customized Ria. How can I assist you today?',
        customStyles: {
          userMessage: { 
            bgcolor: '#667eea',
            color: 'white'
          },
          header: {
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white'
          }
        }
      });
      log('Custom purple branding applied', 'success');
    }
  };

  const test6 = () => {
    log('Running Test 6: Large Widget');
    if (window.initChatbot) {
      window.initChatbot({
        customStyles: {
          paper: {
            width: 500,
            height: 800
          }
        }
      });
      log('Large widget initialized (500x800)', 'success');
    }
  };

  const test7 = () => {
    log('Running Test 7: Left Side Position');
    if (window.initChatbot) {
      window.initChatbot({
        customStyles: {
          container: {
            left: 24,
            right: 'auto'
          }
        }
      });
      log('Left side position applied', 'success');
    }
  };

  const test8 = () => {
    log('Running Test 8: Programmatic Control');
    if (window.initChatbot) {
      window.initChatbot();
      
      setTimeout(() => {
        if (window.openChatbot) {
          window.openChatbot();
          log('Chatbot opened (1s)', 'success');
        }
      }, 1000);
      
      setTimeout(() => {
        if (window.closeChatbot) {
          window.closeChatbot();
          log('Chatbot closed (3s)', 'success');
        }
      }, 3000);
      
      setTimeout(() => {
        if (window.toggleChatbot) {
          window.toggleChatbot();
          log('Chatbot toggled (5s)', 'success');
        }
      }, 5000);
      
      log('Programmatic control sequence started', 'success');
    }
  };

  const test9 = () => {
    log('Running Test 9: With Agent Configuration');
    if (window.initChatbot) {
      window.initChatbot({
        configFile: '/agent-config.json',
        theme: 'light',
        formattingStyles: {
          heading: {
            mt: 3,
            mb: 2,
            fontWeight: 700,
            color: '#2563eb',
            fontSize: '1.15rem',
            borderBottom: '2px solid #60a5fa',
            paddingBottom: '8px',
          },
          bold: {
            fontWeight: 700,
            color: '#1e40af',
          },
          italic: {
            fontStyle: 'italic',
            color: '#3b82f6',
          },
          code: {
            bgcolor: '#dbeafe',
            color: '#1e3a8a',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.95em',
            fontFamily: 'monospace',
            border: '1px solid #93c5fd',
          },
          blockquote: {
            borderLeft: '4px solid #60a5fa',
            bgcolor: '#f0f9ff',
            color: '#0c4a6e',
            pl: 3,
            py: 2,
            my: 2,
            borderRadius: '0 8px 8px 0',
            fontStyle: 'italic',
            boxShadow: '0 1px 3px rgba(96, 165, 250, 0.1)',
          },
          list: {
            my: 2,
            pl: 4,
            listItem: {
              mb: 1,
              lineHeight: 1.8,
              color: '#1e40af',
            },
          },
          table: {
            container: {
              my: 3,
              maxWidth: '100%',
              overflowX: 'auto',
              bgcolor: '#eff6ff',
              border: '2px solid #60a5fa',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(96, 165, 250, 0.15)',
            },
            header: {
              bgcolor: '#60a5fa',
              fontWeight: 700,
              color: '#ffffff',
              fontSize: '0.95rem',
              borderBottom: '2px solid #3b82f6',
              padding: '12px',
            },
            cell: {
              color: '#1e293b',
              borderBottom: '1px solid #bfdbfe',
              padding: '12px',
            },
            rowHover: {
              bgcolor: '#dbeafe',
              transition: 'background-color 0.2s ease',
            },
          },
        }
      });
      log('Chatbot initialized with blue styling (#60a5fa theme)', 'success');
      log('Custom styles: Blue headings, tables, blockquotes, lists with hover effects', 'info');
      log('Note: Requires valid config file at /agent-config.json', 'info');
    } else {
      log('window.initChatbot is not defined', 'error');
    }
  };

  return (
    <div className="home-theme">
      <nav className="nav" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--nav-h)',
        background: 'rgba(11, 16, 32, 0.95)',
        borderBottom: '1px solid var(--stroke)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        padding: '0 clamp(20px, 5vw, 72px)',
        cursor: 'pointer'
      }}
      onClick={() => navigate('/')}>
        <span style={{ color: 'var(--text-1)', fontSize: '20px', fontWeight: 700 }}>
          RIA <span style={{ color: 'var(--accent-1)' }}>Docs</span>
        </span>
      </nav>

      <div className="ria-bg">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="grid-overlay" />
      </div>

      <main className="ria-main">
        <section className="hero" style={{ display: 'block', textAlign: 'center', paddingBottom: '48px' }}>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', marginBottom: '16px' }}>
            Chatbot Widget <span style={{ background: 'linear-gradient(90deg, var(--accent-2), var(--accent-1))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Documentation</span>
          </h1>
          <p className="subtitle" style={{ maxWidth: '700px', margin: '0 auto 32px' }}>
            Easy-to-embed, customizable chatbot widget with powerful agent configuration
          </p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => scrollToSection('quick-start')}>Quick Start</button>
            <button className="btn btn-ghost" onClick={() => scrollToSection('features')}>Features</button>
            <button className="btn btn-ghost" onClick={() => scrollToSection('configuration')}>Configuration</button>
            <button className="btn btn-ghost" onClick={() => scrollToSection('formatting')}>Formatting Styles</button>
            <button className="btn btn-ghost" onClick={() => scrollToSection('agent-config')}>Agent Setup</button>
            <button className="btn btn-ghost" onClick={() => scrollToSection('examples')}>Examples</button>
            <button className="btn btn-ghost" onClick={() => scrollToSection('tests')}>Live Tests</button>
            <button className="btn btn-ghost" onClick={() => scrollToSection('troubleshooting')}>Troubleshooting</button>
          </div>
        </section>

        <DocSection id="quick-start" title="Quick Start">
          <p>Get started in seconds with just one line of code. Add this to your website:</p>
          
          <CodeBlock language="html">{`<!-- Add this script to your HTML -->
<script src="https://your-cdn.com/chatbot.js"></script>`}</CodeBlock>

          <Alert type="success">
            <strong>That's it!</strong> The chatbot will automatically appear in the bottom-right corner of your page with default settings.
          </Alert>

          <h3>Optional: Custom Configuration</h3>
          <p>If you want to customize the chatbot, add an initialization script:</p>

          <CodeBlock language="javascript">{`<script src="https://your-cdn.com/chatbot.js"></script>
<script>
  // Initialize with custom options
  window.initChatbot({
    theme: 'dark',
    position: { bottom: 24, right: 24 },
    configFile: '/agent-config.json'
  });
</script>`}</CodeBlock>
        </DocSection>

        <DocSection id="features" title="Features">
          <div className="feature-strips-docs">
            <FeatureCard 
              icon={<PaletteIcon />} 
              title="Themeable" 
              text="Light and dark themes with full customization support" 
            />
            <FeatureCard 
              icon={<DeviceIcon />} 
              title="Responsive" 
              text="Works perfectly on desktop, tablet, and mobile devices" 
            />
            <FeatureCard 
              icon={<PositionIcon />} 
              title="Flexible Positioning" 
              text="Position anywhere on your page with custom styles" 
            />
            <FeatureCard 
              icon={<BoltIcon />} 
              title="Easy Integration" 
              text="Single script tag - no complex setup required" 
            />
            <FeatureCard 
              icon={<BrandIcon />} 
              title="Custom Branding" 
              text="Match your brand colors and style" 
            />
            <FeatureCard 
              icon={<AgentIcon />} 
              title="Agent Configuration" 
              text="Connect to custom AI endpoints and APIs" 
            />
            <FeatureCard 
              icon={<MemoryIcon />} 
              title="Memory Support" 
              text="Maintain conversation context across messages" 
            />
            <FeatureCard 
              icon={<FeatherIcon />} 
              title="Lightweight" 
              text="Optimized bundle size for fast loading" 
            />
          </div>
        </DocSection>

        <DocSection id="configuration" title="Configuration Options">
          <ConfigTable />

          <h3>Custom Styles</h3>
          <p>The <code>customStyles</code> object accepts these properties:</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', margin: '20px 0' }}>
            <PropCard title="userMessage" description="User message bubble styles (background, color)" />
            <PropCard title="header" description="Chat header styles (background, color, padding)" />
            <PropCard title="paper" description="Chat window styles (width, height, border radius)" />
            <PropCard title="container" description="Container styles (position, dimensions)" />
            <PropCard title="sendButton" description="Send button styles (color, background)" />
          </div>
        </DocSection>

        <DocSection id="formatting" title="Message Formatting Styles">
          <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-1)' }}>
            Customize how bot messages are displayed using the <code>formattingStyles</code> prop. This allows you to style markdown-formatted content including headings, bold text, italic text, code blocks, lists, tables, and blockquotes.
          </p>

          <h3 style={{ fontSize: '1.5rem', marginTop: '36px', marginBottom: '16px', color: 'var(--text-1)' }}>Available Formatting Options</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', margin: '20px 0' }}>
            <PropCard title="heading" description="Styles for markdown headings (# Header)" />
            <PropCard title="bold" description="Styles for bold text (**bold** or __bold__)" />
            <PropCard title="italic" description="Styles for italic text (*italic* or _italic_)" />
            <PropCard title="code" description="Styles for inline code (`code`)" />
            <PropCard title="blockquote" description="Styles for blockquotes (> quote)" />
            <PropCard title="list" description="Styles for lists (bullets and numbered)" />
            <PropCard title="table" description="Styles for markdown tables" />
          </div>

          <h3 style={{ fontSize: '1.5rem', marginTop: '36px', marginBottom: '16px', color: 'var(--text-1)' }}>Example: Blue Theme Formatting</h3>
          <CodeBlock language="javascript">{`window.initChatbot({
  theme: 'light',
  formattingStyles: {
    heading: {
      mt: 3,
      mb: 2,
      fontWeight: 700,
      color: '#2563eb',
      fontSize: '1.15rem',
      borderBottom: '2px solid #60a5fa',
      paddingBottom: '8px',
    },
    bold: {
      fontWeight: 700,
      color: '#1e40af',
    },
    italic: {
      fontStyle: 'italic',
      color: '#3b82f6',
    },
    code: {
      bgcolor: '#dbeafe',
      color: '#1e3a8a',
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '0.95em',
      fontFamily: 'monospace',
      border: '1px solid #93c5fd',
    },
    blockquote: {
      borderLeft: '4px solid #60a5fa',
      bgcolor: '#f0f9ff',
      color: '#0c4a6e',
      pl: 3,
      py: 2,
      my: 2,
      borderRadius: '0 8px 8px 0',
      fontStyle: 'italic',
    },
    list: {
      my: 2,
      pl: 4,
      listItem: {
        mb: 1,
        lineHeight: 1.8,
        color: '#1e40af',
      },
    },
    table: {
      container: {
        my: 3,
        bgcolor: '#eff6ff',
        border: '2px solid #60a5fa',
        borderRadius: '8px',
      },
      header: {
        bgcolor: '#60a5fa',
        fontWeight: 700,
        color: '#ffffff',
      },
      cell: {
        color: '#1e293b',
        borderBottom: '1px solid #bfdbfe',
      },
      rowHover: {
        bgcolor: '#dbeafe',
      },
    },
  }
});`}</CodeBlock>

          <Alert type="info">
            <strong>Supported Markdown Features:</strong> The chatbot supports headings (# ## ###), bold (**text**), italic (*text*), inline code (`code`), blockquotes ({'>'} text), bullet lists (- item), numbered lists (1. item), and tables (| col1 | col2 |).
          </Alert>

          <h3 style={{ fontSize: '1.5rem', marginTop: '36px', marginBottom: '16px', color: 'var(--text-1)' }}>Style Properties</h3>
          <p>All formatting styles use Material-UI's sx prop syntax. Common properties include:</p>
          <ul style={{ marginTop: '16px', paddingLeft: '24px' }}>
            <li style={{ marginBottom: '8px' }}><code>color</code> - Text color (e.g., '#2563eb')</li>
            <li style={{ marginBottom: '8px' }}><code>bgcolor</code> - Background color</li>
            <li style={{ marginBottom: '8px' }}><code>fontWeight</code> - Font weight (e.g., 600, 700)</li>
            <li style={{ marginBottom: '8px' }}><code>fontSize</code> - Font size (e.g., '1.15rem', '14px')</li>
            <li style={{ marginBottom: '8px' }}><code>padding</code>, <code>pl</code>, <code>py</code> - Padding values</li>
            <li style={{ marginBottom: '8px' }}><code>margin</code>, <code>mt</code>, <code>mb</code>, <code>my</code> - Margin values</li>
            <li style={{ marginBottom: '8px' }}><code>border</code>, <code>borderLeft</code>, <code>borderBottom</code> - Border styles</li>
            <li style={{ marginBottom: '8px' }}><code>borderRadius</code> - Border radius</li>
          </ul>
        </DocSection>

        <DocSection id="agent-config" title="Agent Configuration">
          <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-1)' }}>
            Connect your chatbot to custom AI endpoints and APIs using an agent configuration file. This powerful feature allows you to integrate with your own backend services, AI models, or third-party APIs.
          </p>

          <div style={{ 
            background: 'rgba(139, 92, 246, 0.08)', 
            border: '2px solid var(--accent-1)', 
            borderRadius: '16px', 
            padding: '24px',
            margin: '24px 0'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--accent-1)', fontSize: '1.4rem' }}>What is an Agent Configuration?</h3>
            <p style={{ fontSize: '1.05rem', marginBottom: '16px', color: 'var(--text-1)' }}>An agent configuration file is a JSON file that defines:</p>
            <ul style={{ marginTop: '12px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '12px', fontSize: '1.05rem', color: 'var(--text-1)' }}>
                <strong style={{ color: 'var(--accent-1)' }}>Custom endpoints:</strong> Where to send user messages for processing
              </li>
              <li style={{ marginBottom: '12px', fontSize: '1.05rem', color: 'var(--text-1)' }}>
                <strong style={{ color: 'var(--accent-1)' }}>Request format:</strong> How to structure API requests
              </li>
              <li style={{ marginBottom: '12px', fontSize: '1.05rem', color: 'var(--text-1)' }}>
                <strong style={{ color: 'var(--accent-1)' }}>Response handling:</strong> How to extract and display responses
              </li>
              <li style={{ marginBottom: '12px', fontSize: '1.05rem', color: 'var(--text-1)' }}>
                <strong style={{ color: 'var(--accent-1)' }}>Memory management:</strong> How to maintain conversation context
              </li>
              <li style={{ marginBottom: '0', fontSize: '1.05rem', color: 'var(--text-1)' }}>
                <strong style={{ color: 'var(--accent-1)' }}>Agent metadata:</strong> Description and capabilities of each agent
              </li>
            </ul>
          </div>

          <h3 style={{ fontSize: '1.5rem', marginTop: '36px', marginBottom: '16px', color: 'var(--text-1)' }}>Basic Setup</h3>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-1)' }}>
            To use an agent configuration, create a JSON file and reference it when initializing the chatbot:
          </p>
          <CodeBlock language="javascript">{`window.initChatbot({
  configFile: '/path/to/agent-config.json'
});`}</CodeBlock>

          <h3 style={{ fontSize: '1.5rem', marginTop: '36px', marginBottom: '16px', color: 'var(--text-1)' }}>Configuration File Structure</h3>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-1)', marginBottom: '16px' }}>
            Here's a complete example of an agent configuration file:
          </p>
          <CodeBlock language="json">{`{
  "agents": {
    "coast_agent": {
      "description": "Provides information related to manufacturing",
      "endpoint": "http://localhost:8080/chat/manufacturing",
      "method": "POST",
      "query_params": [],
      "required_fields": ["query"],
      "response_format": "json",
      "response_field": ["response"],
      "memory": {
        "enabled": true,
        "delivery": "body",
        "field_name": "conversation_history",
        "send_as": "json",
        "item_template": {
          "role": "{role}",
          "content": "{text}"
        }
      }
    }
  }
}`}</CodeBlock>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid var(--stroke)', 
            borderRadius: '16px', 
            padding: '28px',
            margin: '32px 0'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.6rem', color: 'var(--text-1)' }}>Configuration Properties Explained</h3>
            
            <h4 style={{ 
              fontSize: '1.35rem', 
              marginTop: '24px', 
              marginBottom: '16px', 
              color: 'var(--accent-1)',
              borderBottom: '2px solid var(--stroke)',
              paddingBottom: '8px'
            }}>Agent Properties</h4>
            <AgentPropertiesTable />

            <h4 style={{ 
              fontSize: '1.35rem', 
              marginTop: '36px', 
              marginBottom: '16px', 
              color: 'var(--accent-1)',
              borderBottom: '2px solid var(--stroke)',
              paddingBottom: '8px'
            }}>Memory Configuration</h4>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-1)', marginBottom: '16px' }}>
              The memory object controls how conversation history is maintained and sent to your API:
            </p>
            <MemoryPropertiesTable />
          </div>

          <Alert type="info">
            <strong>Pro Tip:</strong> The <code style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px', color: 'var(--accent-1)' }}>item_template</code> uses placeholders like <code style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px', color: 'var(--accent-1)' }}>{'{role}'}</code> and <code style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px', color: 'var(--accent-1)' }}>{'{text}'}</code> which are automatically replaced with actual values. This allows you to format messages in whatever structure your API expects.
          </Alert>

          <h3 style={{ fontSize: '1.5rem', marginTop: '36px', marginBottom: '16px', color: 'var(--text-1)' }}>Example Request Body</h3>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-1)', marginBottom: '16px' }}>
            With the configuration above, when a user sends a message, the chatbot will make a POST request like this:
          </p>
          <CodeBlock language="json">{`POST http://localhost:8080/chat/manufacturing
Content-Type: application/json

{
  "query": "What is the manufacturing process?",
  "conversation_history": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help?"
    },
    {
      "role": "user",
      "content": "What is the manufacturing process?"
    }
  ]
}`}</CodeBlock>

          <h3 style={{ fontSize: '1.5rem', marginTop: '36px', marginBottom: '16px', color: 'var(--text-1)' }}>Multiple Agents Example</h3>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-1)', marginBottom: '16px' }}>
            You can define multiple agents for different purposes:
          </p>
          <CodeBlock language="json">{`{
  "agents": {
    "manufacturing_agent": {
      "description": "Answers manufacturing questions",
      "endpoint": "https://api.example.com/manufacturing",
      "method": "POST",
      "required_fields": ["query"],
      "response_format": "json",
      "response_field": ["response"]
    },
    "support_agent": {
      "description": "Provides customer support",
      "endpoint": "https://api.example.com/support",
      "method": "POST",
      "required_fields": ["message"],
      "response_format": "json",
      "response_field": ["answer"],
      "memory": {
        "enabled": true,
        "delivery": "body",
        "field_name": "history",
        "send_as": "json"
      }
    }
  }
}`}</CodeBlock>

          <Alert type="warning">
            <strong>Security Note:</strong> Always validate and sanitize inputs on your server. Never expose sensitive API keys in the configuration file. Use server-side authentication and authorization for production deployments.
          </Alert>
        </DocSection>

        <DocSection id="examples" title="Configuration Examples">
          <ExampleCard title="Example 1: Dark Theme">
            <CodeBlock language="javascript">{`window.initChatbot({
  theme: 'dark'
});`}</CodeBlock>
          </ExampleCard>

          <ExampleCard title="Example 2: Custom Position">
            <CodeBlock language="javascript">{`window.initChatbot({
  position: { bottom: 50, right: 50 }
});`}</CodeBlock>
          </ExampleCard>

          <ExampleCard title="Example 3: Custom Branding">
            <CodeBlock language="javascript">{`window.initChatbot({
  theme: 'dark',
  greeting: 'Hello! Welcome to Customized Ria.',
  customStyles: {
    userMessage: { 
      bgcolor: '#667eea',
      color: 'white'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white'
    }
  }
});`}</CodeBlock>
          </ExampleCard>

          <ExampleCard title="Example 4: Embedded Mode">
            <CodeBlock language="javascript">{`<!-- Create a container -->
<div id="chatbot-widget-root" style="height: 600px;"></div>

<script>
  window.initChatbot({
    embedded: true
  });
</script>`}</CodeBlock>
          </ExampleCard>

          <ExampleCard title="Example 5: With Agent Configuration">
            <CodeBlock language="javascript">{`window.initChatbot({
  theme: 'light',
  configFile: '/config/agent-config.json',
  customStyles: {
    userMessage: { 
      bgcolor: '#2563eb',
      color: 'white'
    }
  }
});`}</CodeBlock>
          </ExampleCard>

          <ExampleCard title="Example 6: Custom Message Formatting">
            <CodeBlock language="javascript">{`window.initChatbot({
  theme: 'light',
  formattingStyles: {
    heading: {
      color: '#2563eb',
      fontWeight: 700,
      borderBottom: '2px solid #60a5fa',
    },
    bold: {
      color: '#1e40af',
      fontWeight: 700,
    },
    code: {
      bgcolor: '#dbeafe',
      color: '#1e3a8a',
      border: '1px solid #93c5fd',
    },
    table: {
      container: {
        bgcolor: '#eff6ff',
        border: '2px solid #60a5fa',
      },
      header: {
        bgcolor: '#60a5fa',
        color: '#ffffff',
      }
    }
  }
});`}</CodeBlock>
          </ExampleCard>

          <ExampleCard title="Example 7: Complete Production Setup">
            <CodeBlock language="javascript">{`<script src="https://cdn.example.com/chatbot.js"></script>
<script>
  window.initChatbot({
    theme: 'light',
    position: { bottom: 24, right: 24 },
    greeting: 'Hello! Welcome to Ria.',
    configFile: 'https://api.example.com/chatbot-config.json',
    customStyles: {
      header: {
        background: '#2563eb',
        color: 'white'
      },
      userMessage: { 
        bgcolor: '#2563eb',
        color: 'white'
      }
    },
    formattingStyles: {
      heading: {
        color: '#2563eb',
        fontWeight: 700,
      },
      bold: {
        color: '#1e40af',
      }
    }
  });
</script>`}</CodeBlock>
          </ExampleCard>
        </DocSection>

        <DocSection id="api-methods" title="API Methods">
          <p>Control the chatbot programmatically with these methods:</p>
          <ApiMethodsTable />
          
          <Alert type="info">
            <strong>Tip:</strong> These methods are available globally on the window object after the script loads.
          </Alert>
        </DocSection>

        <DocSection id="tests" title="Interactive Test Suite">
          <p>Try different configurations live! Click any test below to see it in action.</p>

          <Alert type="warning">
            <strong>Important:</strong> Click "Clear Chatbot" before running a new test to avoid conflicts.
          </Alert>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', margin: '20px 0' }}>
            <button className="btn btn-primary" style={{ background: 'linear-gradient(90deg, #c66969, #b91c1c)' }} onClick={clearChatbot}>
              Clear Chatbot
            </button>
            <button className="btn btn-ghost" onClick={() => window.openChatbot?.()}>Open</button>
            <button className="btn btn-ghost" onClick={() => window.closeChatbot?.()}>Close</button>
            <button className="btn btn-ghost" onClick={() => window.toggleChatbot?.()}>Toggle</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', margin: '32px 0' }}>
            <TestCard 
              title="Test 1: Default Light Theme"
              description="Floating chat widget in bottom-right corner with light theme"
              onRun={test1}
            />
            <TestCard 
              title="Test 2: Custom Position"
              description="Widget positioned 50px from bottom and right"
              onRun={test2}
            />
            <TestCard 
              title="Test 3: Dark Theme"
              description="Widget with dark theme styling"
              onRun={test3}
            />
            <TestCard 
              title="Test 4: Embedded in Container"
              description="Chatbot fills a custom container (80vh)"
              onRun={test4}
            />
            <TestCard 
              title="Test 5: Custom Branding"
              description="Widget with purple gradient branding"
              onRun={test5}
            />
            <TestCard 
              title="Test 6: Large Widget"
              description="Larger chat window (500x800)"
              onRun={test6}
            />
            <TestCard 
              title="Test 7: Left Side Position"
              description="Widget on bottom-left corner"
              onRun={test7}
            />
            <TestCard 
              title="Test 8: Programmatic Control"
              description="Automatically opens, closes, and toggles"
              onRun={test8}
            />
            <TestCard 
              title="Test 9: Blue Styling Theme"
              description="Agent config with custom blue formatting styles"
              onRun={test9}
            />
          </div>

          <h3>Console Output</h3>
          <div style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid var(--stroke)',
            borderRadius: '12px',
            padding: '20px',
            fontFamily: 'monospace',
            fontSize: '13px',
            maxHeight: '300px',
            overflowY: 'auto',
            margin: '20px 0',
            color: '#10b981'
          }}>
            {consoleLog.map((line, i) => (
              <div key={i} style={{ margin: '4px 0' }}>{line}</div>
            ))}
          </div>
        </DocSection>

        <DocSection id="browser-support" title="Browser Support">
          <p>The chatbot widget works on all modern browsers:</p>
          <ul style={{ marginTop: '16px', paddingLeft: '24px' }}>
            <li style={{ marginBottom: '8px' }}>Chrome 90+</li>
            <li style={{ marginBottom: '8px' }}>Firefox 88+</li>
            <li style={{ marginBottom: '8px' }}>Safari 14+</li>
            <li style={{ marginBottom: '8px' }}>Edge 90+</li>
            <li style={{ marginBottom: '8px' }}>Mobile browsers (iOS Safari, Chrome Mobile)</li>
          </ul>
        </DocSection>

        <DocSection id="troubleshooting" title="Troubleshooting">
          <h3>Chatbot not appearing?</h3>
          <ul style={{ marginTop: '12px', marginBottom: '24px', paddingLeft: '24px' }}>
            <li style={{ marginBottom: '8px' }}>Check that the script tag is correctly placed in your HTML</li>
            <li style={{ marginBottom: '8px' }}>Open browser console and look for JavaScript errors</li>
            <li style={{ marginBottom: '8px' }}>Verify the script URL is correct and accessible</li>
            <li style={{ marginBottom: '8px' }}>Ensure no CSS conflicts are hiding the widget</li>
          </ul>

          <h3>Agent configuration not working?</h3>
          <ul style={{ marginTop: '12px', marginBottom: '24px', paddingLeft: '24px' }}>
            <li style={{ marginBottom: '8px' }}>Verify the JSON file is valid (use a JSON validator)</li>
            <li style={{ marginBottom: '8px' }}>Check that the file path is correct and accessible</li>
            <li style={{ marginBottom: '8px' }}>Look for CORS errors in the browser console</li>
            <li style={{ marginBottom: '8px' }}>Ensure your API endpoint is responding correctly</li>
            <li style={{ marginBottom: '8px' }}>Verify the response format matches your configuration</li>
          </ul>

          <h3>Styling issues?</h3>
          <ul style={{ marginTop: '12px', marginBottom: '24px', paddingLeft: '24px' }}>
            <li style={{ marginBottom: '8px' }}>Check for CSS conflicts with your website styles</li>
            <li style={{ marginBottom: '8px' }}>Use browser DevTools to inspect the chatbot elements</li>
            <li style={{ marginBottom: '8px' }}>Try using <code style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px', color: 'var(--accent-1)' }}>!important</code> in custom styles if needed</li>
            <li style={{ marginBottom: '8px' }}>Clear browser cache after updating styles</li>
          </ul>

          <h3>Formatting styles not applying?</h3>
          <ul style={{ marginTop: '12px', marginBottom: '24px', paddingLeft: '24px' }}>
            <li style={{ marginBottom: '8px' }}>Ensure you're using the correct property names (heading, bold, italic, etc.)</li>
            <li style={{ marginBottom: '8px' }}>Check that style values are valid CSS/MUI sx properties</li>
            <li style={{ marginBottom: '8px' }}>Verify the bot is actually sending markdown-formatted messages</li>
            <li style={{ marginBottom: '8px' }}>Use browser DevTools to inspect the rendered message elements</li>
          </ul>

          <Alert type="info">
            <strong>Need Help?</strong> Check the browser console for error messages. Most issues can be identified through console logs.
          </Alert>
        </DocSection>

        <footer className="footer">
          <p>© {new Date().getFullYear()} RIA Conversational AI — multilingual, robust, policy-first, memory-aware.</p>
        </footer>
      </main>
    </div>
  );
}