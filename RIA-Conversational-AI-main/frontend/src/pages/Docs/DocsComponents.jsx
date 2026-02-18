export function DocSection({ id, title, children }) {
  return (
    <section id={id} style={{ 
      maxWidth: '1200px', 
      margin: '40px auto', 
      padding: '40px clamp(20px, 5vw, 72px)',
      background: 'var(--glass)',
      border: '1px solid var(--stroke)',
      borderRadius: '18px',
      backdropFilter: 'blur(8px)'
    }}>
      <h2 style={{ 
        fontSize: 'clamp(26px, 4vw, 36px)', 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid var(--stroke)'
      }}>{title}</h2>
      {children}
    </section>
  );
}

export function CodeBlock({ language, children }) {
  return (
    <pre style={{
      background: 'rgba(0, 0, 0, 0.6)',
      border: '1px solid var(--stroke)',
      borderRadius: '12px',
      padding: '20px',
      overflow: 'auto',
      margin: '20px 0',
      color: '#10b981',
      fontSize: '14px',
      lineHeight: '1.6'
    }}>
      <code>{children}</code>
    </pre>
  );
}

export function Alert({ type, children }) {
  const colors = {
    success: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' },
    info: { bg: 'rgba(139, 92, 246, 0.1)', border: 'var(--accent-1)' },
    danger: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444' }
  };

  return (
    <div style={{
      background: colors[type].bg,
      border: `2px solid ${colors[type].border}`,
      borderRadius: '12px',
      padding: '16px 20px',
      margin: '20px 0',
      color: 'var(--text-1)'
    }}>
      {children}
    </div>
  );
}

export function FeatureCard({ icon, title, text }) {
  return (
    <div className="strip-docs">
      <div style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--accent-1)'}}>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export function PropCard({ title, description }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid var(--stroke)',
      borderRadius: '12px',
      padding: '16px',
      borderLeft: '3px solid var(--accent-1)'
    }}>
      <h5 style={{ 
        margin: '0 0 8px 0',
        fontFamily: 'monospace',
        color: 'var(--accent-1)'
      }}>{title}</h5>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-2)' }}>{description}</p>
    </div>
  );
}

export function ExampleCard({ title, children }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ marginBottom: '12px' }}>{title}</h3>
      {children}
    </div>
  );
}

export function TestCard({ title, description, onRun }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid var(--stroke)',
      borderRadius: '12px',
      padding: '20px',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--accent-1)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--stroke)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-1)', fontSize: '1.1rem' }}>{title}</h4>
      <p style={{ margin: '0 0 16px 0', color: 'var(--text-2)', fontSize: '0.95rem' }}>{description}</p>
      <button className="btn btn-primary" onClick={onRun} style={{ width: '100%' }}>Run Test</button>
    </div>
  );
}

export function ConfigTable() {
  const rows = [
    { option: 'theme', type: 'string', default: "'light'", desc: "Theme mode: 'light' or 'dark'" },
    { option: 'position', type: 'object', default: '{ bottom: 24, right: 24 }', desc: 'Position in pixels from edges' },
    { option: 'embedded', type: 'boolean', default: 'false', desc: 'Embed in container instead of floating' },
    { option: 'customStyles', type: 'object', default: '{}', desc: 'Custom style overrides' },
    { option: 'configFile', type: 'string', default: 'undefined', desc: 'Path to agent configuration JSON file' },
    { option: 'formattingStyles', type: 'string', default: '{}', desc: 'Custom formatting options for markdown (Refer below)' }
  ];

  const tableHeaderStyle = {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: 700,
    fontSize: '0.95rem',
    color: 'var(--text-1)',
    borderBottom: '2px solid var(--stroke)',
    background: 'rgba(139, 92, 246, 0.1)'
  };

  const tableCellStyle = {
    padding: '14px 16px',
    color: 'var(--text-1)',
    fontSize: '0.95rem',
    lineHeight: '1.6'
  };

  const codeStyle = {
    background: 'rgba(139, 92, 246, 0.2)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    color: 'var(--accent-1)',
    fontFamily: 'monospace',
    fontWeight: 600
  };

  const typeStyle = {
    color: 'var(--text-1)',
    fontStyle: 'italic',
    fontSize: '0.9rem',
    opacity: 0.85
  };

  return (
    <div style={{ overflowX: 'auto', margin: '24px 0' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
        border: '1px solid var(--stroke)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Option</th>
            <th style={tableHeaderStyle}>Type</th>
            <th style={tableHeaderStyle}>Default</th>
            <th style={tableHeaderStyle}>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ 
              borderBottom: i < rows.length - 1 ? '1px solid var(--stroke)' : 'none',
              background: i % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
            }}>
              <td style={tableCellStyle}><code style={codeStyle}>{row.option}</code></td>
              <td style={{...tableCellStyle, ...typeStyle}}>{row.type}</td>
              <td style={tableCellStyle}><code style={codeStyle}>{row.default}</code></td>
              <td style={tableCellStyle}>{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApiMethodsTable() {
  const methods = [
    { method: 'window.initChatbot(config)', desc: 'Initialize or reconfigure the chatbot', example: "window.initChatbot({ theme: 'dark' })" },
    { method: 'window.openChatbot()', desc: 'Open the chat window', example: 'window.openChatbot()' },
    { method: 'window.closeChatbot()', desc: 'Close the chat window', example: 'window.closeChatbot()' },
    { method: 'window.toggleChatbot()', desc: 'Toggle the chat window open/closed', example: 'window.toggleChatbot()' },
    { method: 'window.destroyChatbot()', desc: 'Remove the chatbot from the page', example: 'window.destroyChatbot()' }
  ];

  const tableHeaderStyle = {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: 700,
    fontSize: '0.95rem',
    color: 'var(--text-1)',
    borderBottom: '2px solid var(--stroke)',
    background: 'rgba(139, 92, 246, 0.1)'
  };

  const tableCellStyle = {
    padding: '14px 16px',
    color: 'var(--text-1)',
    fontSize: '0.95rem',
    lineHeight: '1.6'
  };

  const codeStyle = {
    background: 'rgba(139, 92, 246, 0.2)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    color: 'var(--accent-1)',
    fontFamily: 'monospace',
    fontWeight: 600
  };

  return (
    <div style={{ overflowX: 'auto', margin: '24px 0' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
        border: '1px solid var(--stroke)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Method</th>
            <th style={tableHeaderStyle}>Description</th>
            <th style={tableHeaderStyle}>Example</th>
          </tr>
        </thead>
        <tbody>
          {methods.map((m, i) => (
            <tr key={i} style={{ 
              borderBottom: i < methods.length - 1 ? '1px solid var(--stroke)' : 'none',
              background: i % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
            }}>
              <td style={tableCellStyle}><code style={codeStyle}>{m.method}</code></td>
              <td style={tableCellStyle}>{m.desc}</td>
              <td style={tableCellStyle}><code style={codeStyle}>{m.example}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AgentPropertiesTable() {
  const rows = [
    { property: 'description', type: 'string', desc: 'Human-readable description of what the agent does' },
    { property: 'endpoint', type: 'string', desc: 'Full URL of the API endpoint to send requests to' },
    { property: 'method', type: 'string', desc: 'HTTP method (GET, POST, PUT, etc.)' },
    { property: 'query_params', type: 'array', desc: 'List of query parameters to include in the URL' },
    { property: 'required_fields', type: 'array', desc: 'Fields that must be included in the request body' },
    { property: 'response_format', type: 'string', desc: 'Expected response format (json, text, xml)' },
    { property: 'response_field', type: 'array', desc: 'Path to extract the response text from JSON (e.g., ["data", "message"])' }
  ];

  const tableHeaderStyle = {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: 700,
    fontSize: '0.95rem',
    color: 'var(--text-1)',
    borderBottom: '2px solid var(--stroke)',
    background: 'rgba(139, 92, 246, 0.1)'
  };

  const tableCellStyle = {
    padding: '14px 16px',
    color: 'var(--text-1)',
    fontSize: '0.95rem',
    lineHeight: '1.6'
  };

  const codeStyle = {
    background: 'rgba(139, 92, 246, 0.2)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    color: 'var(--accent-1)',
    fontFamily: 'monospace',
    fontWeight: 600
  };

  const typeStyle = {
    color: 'var(--text-1)',
    fontStyle: 'italic',
    fontSize: '0.9rem',
    opacity: 0.85
  };

  return (
    <div style={{ overflowX: 'auto', margin: '20px 0' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
        border: '1px solid var(--stroke)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Property</th>
            <th style={tableHeaderStyle}>Type</th>
            <th style={tableHeaderStyle}>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ 
              borderBottom: i < rows.length - 1 ? '1px solid var(--stroke)' : 'none',
              background: i % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
            }}>
              <td style={tableCellStyle}><code style={codeStyle}>{row.property}</code></td>
              <td style={{...tableCellStyle, ...typeStyle}}>{row.type}</td>
              <td style={tableCellStyle}>{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MemoryPropertiesTable() {
  const rows = [
    { property: 'enabled', type: 'boolean', desc: 'Whether to track and send conversation history' },
    { property: 'delivery', type: 'string', desc: 'How to send history: "body" or "headers"' },
    { property: 'field_name', type: 'string', desc: 'Name of the field containing conversation history' },
    { property: 'send_as', type: 'string', desc: 'Format for sending history: "json" or "string"' },
    { property: 'item_template', type: 'object', desc: 'Template for each conversation message (uses {role} and {text} placeholders)' }
  ];

  const tableHeaderStyle = {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: 700,
    fontSize: '0.95rem',
    color: 'var(--text-1)',
    borderBottom: '2px solid var(--stroke)',
    background: 'rgba(139, 92, 246, 0.1)'
  };

  const tableCellStyle = {
    padding: '14px 16px',
    color: 'var(--text-1)',
    fontSize: '0.95rem',
    lineHeight: '1.6'
  };

  const codeStyle = {
    background: 'rgba(139, 92, 246, 0.2)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    color: 'var(--accent-1)',
    fontFamily: 'monospace',
    fontWeight: 600
  };

  const typeStyle = {
    color: 'var(--text-1)',
    fontStyle: 'italic',
    fontSize: '0.9rem',
    opacity: 0.85
  };

  return (
    <div style={{ overflowX: 'auto', margin: '20px 0' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
        border: '1px solid var(--stroke)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Property</th>
            <th style={tableHeaderStyle}>Type</th>
            <th style={tableHeaderStyle}>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ 
              borderBottom: i < rows.length - 1 ? '1px solid var(--stroke)' : 'none',
              background: i % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
            }}>
              <td style={tableCellStyle}><code style={codeStyle}>{row.property}</code></td>
              <td style={{...tableCellStyle, ...typeStyle}}>{row.type}</td>
              <td style={tableCellStyle}>{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PaletteIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  );
}

export function DeviceIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}

export function PositionIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

export function BoltIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

export function BrandIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}

export function AgentIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

export function MemoryIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
    </svg>
  );
}

export function FeatherIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
      <line x1="16" y1="8" x2="2" y2="22"/>
      <line x1="17.5" y1="15" x2="9" y2="15"/>
    </svg>
  );
}