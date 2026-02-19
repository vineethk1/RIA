import './Home.css';
import NavBar from '../../components/NavBar/NavBar';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.initChatbot) {
      window.initChatbot({
        theme: 'dark',
        customStyles: {
          userMessage: {
            bgcolor: '#8b5cf6',
            color: 'white'
          },
          textField: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              color: '#e5e5e5',
              '&:hover fieldset': {
                borderColor: '#8b5cf6 !important',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#8b5cf6 !important',
              },
            },
          },
          sendButton: {
            bgcolor: '#8b5cf6',
            color: 'white',
            '&:hover': {
              bgcolor: '#7c3aed',
            }
          },
        }
      });
    }
    return () => {
      if (window.destroyChatbot) {
        window.destroyChatbot();
      }
    };
  }, []);

  const handleOpenChat = () => {
    if (window.openChatbot) window.openChatbot();
    else console.warn("Chatbot not initialized yet.");
  };

  return (
    <div className="home-theme">
      <NavBar />

      {/* Background */}
      <div className="ria-bg">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="grid-overlay" />
      </div>

      <main className="ria-main">
        {/* HERO */}
        <section className="hero">
          <div className="hero-copy">
            <h1>
              RIA <span>Conversational AI</span>
            </h1>
            <p className="subtitle">
              Multilingual, policy-first conversational intelligence.
              From noise suppression and translation to reasoning, memory,
              and micro-agent execution — RIA powers realtime human-AI collaboration.
            </p>

            <div className="cta">
              <a className="btn btn-primary" href="#playground" onClick={(e)=>{e.preventDefault();handleOpenChat();}}>
                Open Playground
              </a>
              <a className="btn btn-ghost" href="#architecture">See Architecture</a>
            </div>

            <div className="hero-metrics">
              <Metric label="Languages" value="23+" />
              <Metric label="Latency" value="< 100ms" />
              <Metric label="PII Redaction" value="Built-in" />
            </div>
          </div>

          {/* Chat preview card */}
          <div className="chat-card">
            <div className="chat-header">
              <div className="status">
                <span className="online" /> Ingress & Policy active
              </div>
              <div className="pill">Guardrails</div>
            </div>

            <div className="chat-body">
              <div className="msg user">“Summarize the latest cardiology consultation notes for Dr. Patel.”</div>
              <div className="msg ai">
                Patient: R. Singh, 58 yrs. Condition stable. Recommended stress test next week
                and medication adjustment. Drafted follow-up note for physician approval.
              </div>
              <div className="msg user">“Book the stress test and alert nursing staff.”</div>
              <div className="msg ai">
                Appointment booked for Tuesday 9 AM. Nursing team notified. Added to patient’s care plan memory.
              </div>
            </div>

            <div className="chat-input">
              <input placeholder="Ask in any language..." />
              <button className="btn-mic" aria-label="Record voice">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3z"/>
                  <path d="M19 10a7 7 0 0 1-14 0H3a9 9 0 0 0 18 0h-2z"/>
                  <path d="M11 19h2v3h-2z"/>
                </svg>
              </button>
              <button className="btn-send" aria-label="Send message">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE OVERVIEW */}
        <section id="architecture" className="arch">
          <h2>RIA Conversational AI System Overview</h2>
          <p className="subtitle">
            From raw audio/text to safe, grounded actions with memory and domain terminology.
          </p>
          <ArchitectureDiagram />
          <div className="legend">
            <span className="legend-item l-ingress">Ingress & Policy</span>
            <span className="legend-item l-adapt">Domain Adaptation</span>
            <span className="legend-item l-orch">Task Orchestration</span>
            <span className="legend-item l-llm">LLM & SLM</span>
            <span className="legend-item l-memory">Memory & DB</span>
            <span className="legend-item l-agent">Micro-Agent</span>
            <span className="legend-item l-io">UI / TTS</span>
          </div>
        </section>

        {/* FEATURE STRIPS */}
        <section className="feature-strips">
          <Strip tag="Ingress & Policy" title="Privacy, Auth, Guard Rails"
                 text="PII filtering, token checks, tenant isolation, and interrupt detection before anything else touches the model." />
          <Strip tag="Domain Adaptation" title="Terminology + Translation"
                 text="Speech-to-text, language detection, glossary-aware normalization, and domain tagging for multilingual consistency." />
          <Strip tag="Task Orchestration" title="Prompt Composer & Feasibility"
                 text="Compose system prompts, reason about feasibility, and route infeasible items for human review." />
          <Strip tag="Reasoning" title="Primary + Secondary Models"
                 text="Blend large and small models. Generate, translate, and apply policy guard rails per step." />
          <Strip tag="Memory" title="Short- & Long-Term Context"
                 text="Session-aware recall with fast short-term context and durable long-term retrieval for continuity across sessions." />
          <Strip tag="Execution" title="Micro-Agent + TTS"
                 text="Dispatch tasks to micro-agents and stream results back to the interface, including optional text-to-speech." />
        </section>

        {/* CALLOUT */}
        <section id="playground" className="callout">
          <h2>Experience RIA in action.</h2>
          <p>Stream audio, text, and multilingual inputs through our full pipeline.
             See guard rails, domain adaptation, memory recall, and micro-agent orchestration — live.</p>
          <div className="cta">
            <button className="btn btn-primary" onClick={handleOpenChat}>Launch Demo</button>
            <button className="btn btn-ghost" onClick={() => navigate('/docs')} >Read the Docs</button>
          </div>
        </section>

        <footer className="footer">
          <p>© {new Date().getFullYear()} RIA Conversational AI — multilingual, robust, policy-first, memory-aware.</p>
        </footer>
      </main>
    </div>
  );
}

/* --- tiny components --- */
function Metric({ label, value }) {
  return (
    <div className="metric">
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

function Strip({ tag, title, text }) {
  return (
    <div className="strip">
      <span className="tag">{tag}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

/* --- pure-SVG animated architecture map (no libs) --- */
function ArchitectureDiagram() {
  return (
    <svg className="arch-svg" viewBox="0 0 1180 340" role="img" aria-label="Architecture diagram">
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#67e8f9" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <ArchBox x={30}  y={60}  w={180} h={80} label="Ingress & Policy" sub="Privacy · Auth · Guard Rails" cls="ingress"/>
      <ArchBox x={240} y={60}  w={200} h={80} label="Domain Adaptation" sub="ASR · Detect · Glossary" cls="adapt"/>
      <ArchBox x={470} y={60}  w={210} h={80} label="Task Orchestration" sub="Prompt · Feasibility" cls="orch"/>
      <ArchBox x={710} y={60}  w={200} h={80} label="Primary LLM" sub="Reason · Translate" cls="llm"/>
      <ArchBox x={930} y={60}  w={210} h={80} label="UI / TTS" sub="Realtime I/O" cls="io"/>

      <ArchBox x={710} y={200} w={200} h={80} label="Secondary Model" sub="Specialized Tasks" cls="llm"/>
      <ArchBox x={470} y={200} w={210} h={80} label="Memory Engine" sub="Short- & Long-Term Context" cls="memory"/>
      <ArchBox x={240} y={200} w={200} h={80} label="Semantic Index" sub="Search · Storage" cls="memory"/>
      <ArchBox x={930} y={200} w={210} h={80} label="Micro-Agent" sub="Task Execution & Status" cls="agent"/>

      <Flow x1={210} y1={100} x2={240} y2={100}/>
      <Flow x1={440} y1={100} x2={470} y2={100}/>
      <Flow x1={680} y1={100} x2={710} y2={100}/>
      <Flow x1={910} y1={100} x2={930} y2={100}/>

      <Flow x1={350} y1={140} x2={350} y2={200}/>
      <Flow x1={575} y1={140} x2={575} y2={200}/>
      <Flow x1={810} y1={140} x2={810} y2={200}/>
      <Flow x1={1035} y1={140} x2={1035} y2={200}/>

      <Flow x1={680} y1={240} x2={710} y2={240}/>
      <Flow x1={450} y1={240} x2={470} y2={240}/>
      <Flow x1={910} y1={240} x2={930} y2={240}/>

      <Flow x1={810} y1={200} x2={1035} y2={200} dashed />
    </svg>
  );
}

function ArchBox({ x, y, w, h, label, sub, cls }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx="14" className={`arch-box ${cls}`} />
      <text x={x + 12} y={y + 32} className="arch-title">{label}</text>
      <text x={x + 12} y={y + 56} className="arch-sub">{sub}</text>
    </>
  );
}
function Flow({ x1, y1, x2, y2, dashed }) {
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className={`flow ${dashed ? 'flow-dashed' : ''}`} />
      <circle className="flow-dot" cx={x1} cy={y1} r="3">
        <animate attributeName="cx" from={x1} to={x2} dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="cy" from={y1} to={y2} dur="2.4s" repeatCount="indefinite" />
      </circle>
    </>
  );
}
