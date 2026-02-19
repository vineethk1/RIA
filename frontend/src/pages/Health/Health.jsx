import NavBar from '../../components/NavBar/NavBar';
import './Health.css';
import { useEffect } from 'react';

export default function Health() {

  useEffect(() => {
    if (window.initChatbot) {
      window.initChatbot({
        theme: 'dark',
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
    else console.warn('Chatbot not initialized yet.');
  };

  return (
    <div className="health-theme">
      <NavBar pageType="health" />

      <div className="ria-bg">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="grid-overlay" />
      </div>

      <main className="ria-main health-theme">
        <section className="health-hero">
          <div className="hero-copy">
            <h1>
              RIA <span>MedTech Agent</span>
            </h1>
            <p className="subtitle">
              Workflow-accurate conversational intelligence for medical device teams. From design
              control and risk to quality events and regulatory submissions — policy-first and
              memory-aware.
            </p>

            <div className="cta">
              <button className="btn btn-primary" onClick={handleOpenChat}>
                Start MedTech Demo
              </button>
              <a className="btn btn-ghost" href="#overview">
                MedTech Overview
              </a>
            </div>

            <div className="hero-metrics">
              <Metric label="Product Lines" value="50+" />
              <Metric label="Latency" value="< 100ms" />
              <Metric label="Standards" value="ISO · IEC · FDA-aware" />
            </div>
          </div>

          {/* Chat card – blue voice-agent MedTech scenario */}
          <div className="chat-card">
            <div className="chat-header">
              <div className="status">
                <span className="online" /> Ingress &amp; Policy active
              </div>
              <div className="pill">Guardrails</div>
            </div>

            <div className="chat-body">
              <div className="msg user">
                “RIA, take notes on this device setup call and highlight risks and action items.”
              </div>
              <div className="msg ai">
                I&apos;m listening on the line. I&apos;m transcribing in real time, detecting
                language, and applying your MedTech policy. I&apos;ll capture setup steps, risks,
                and action items as the call continues.
              </div>
              <div className="msg user">
                “Wait, RIA — just summarize the key risks and next steps.”
              </div>
              <div className="msg ai">
                Here&apos;s the snapshot: <strong>3 risks</strong> — probe connection errors,
                missed QA checklist steps, and unlogged alert codes. <strong>4 action items</strong>{' '}
                — schedule refresher training, log this incident, update the device record, and
                notify the maintenance lead. I&apos;ll push this to your ticketing system and device
                registry.
              </div>
            </div>

            <div className="chat-input">
              <input
                placeholder="Ask in any language…"
                aria-label="Chat input"
              />
              <button className="btn-mic" aria-label="Record voice">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3z" />
                  <path d="M19 10a7 7 0 0 1-14 0H3a9 9 0 0 0 18 0h-2z" />
                  <path d="M11 19h2v3h-2z" />
                </svg>
              </button>
              <button className="btn-send" aria-label="Send message">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22 2L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </section>

        <section id="overview" className="arch health-arch">
          <h2>MedTech Overview</h2>
          <p className="subtitle">
            From design control and risk management to quality events and submissions — safely
            orchestrated.
          </p>
          <HealthDiagram />
          <div className="legend">
            <span className="legend-item l-intake">Design Intake</span>
            <span className="legend-item l-docs">Design History / Tech File</span>
            <span className="legend-item l-reason">Risk &amp; Impact</span>
            <span className="legend-item l-memory">MedTech Memory</span>
            <span className="legend-item l-agent">Quality &amp; RA Agent</span>
            <span className="legend-item l-io">Systems &amp; Interfaces</span>
          </div>
        </section>

        <section className="feature-strips health-strips">
          <Strip
            tag="Design"
            title="Design Control Intake"
            text="Capture user needs, design inputs, change requests, and rationales; normalize terminology and route to the right owners."
          />
          <Strip
            tag="DHF"
            title="Design History & Tech Files"
            text="Generate DHF- and tech-file-ready summaries with citations back to the originating discussions and artifacts."
          />
          <Strip
            tag="Quality"
            title="Quality Events & CAPA"
            text="Draft deviations, complaints, and CAPA records; link to risks, requirements, and verification results with audit trails."
          />
          <Strip
            tag="Memory"
            title="MedTech Memory"
            text="Short- and long-term recall across projects and product lines; fine-grained retention policies and access controls built in."
          />
          <Strip
            tag="Compliance"
            title="Regulatory & Standards"
            text="Policy-first prompts aligned to IEC/ISO and FDA frameworks; event-level logging for inspections and internal audits."
          />
          <Strip
            tag="Teams"
            title="Cross-Functional Collaboration"
            text="Help R&amp;D, QA, RA, and manufacturing share a single conversational interface while preserving role-specific views."
          />
        </section>

        <section className="callout">
          <h2>Try RIA MedTech Agent in a device workflow.</h2>
          <p>
            Design reviews, risk updates, quality events, and submissions — see guard rails and
            MedTech memory working together.
          </p>
          <div className="cta">
            <button className="btn btn-primary" onClick={handleOpenChat}>
              Start MedTech Demo
            </button>
            <a className="btn btn-ghost" href="#overview">
              View MedTech Overview
            </a>
          </div>
          <p className="disclaimer">
            For workflow and documentation support only. Does not control any medical device. Not a
            substitute for professional judgment or regulatory counsel.
          </p>
        </section>

        <footer className="footer">
          <p>
            © {new Date().getFullYear()} RIA MedTech Agent — multilingual, robust, policy-first,
            memory-aware for device teams.
          </p>
        </footer>
      </main>
    </div>
  );
}

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

/* Diagram (vendor-neutral, now MedTech-flavored) */
function HealthDiagram() {
  return (
    <svg
      className="arch-svg"
      viewBox="0 0 1180 320"
      role="img"
      aria-label="MedTech overview"
    >
      <defs>
        {/* blue gradient instead of green */}
        <linearGradient id="hg" x1="0" x2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <Box
        x={40}
        y={60}
        w={200}
        h={80}
        t="Design Intake"
        s="User needs · Inputs"
        cls="intake"
      />
      <Box
        x={280}
        y={60}
        w={220}
        h={80}
        t="Design History File"
        s="Decisions · Summaries"
        cls="docs"
      />
      <Box
        x={540}
        y={60}
        w={220}
        h={80}
        t="Risk & Impact"
        s="FMEA · Hazards"
        cls="reason"
      />
      <Box
        x={800}
        y={60}
        w={200}
        h={80}
        t="Systems & Tools"
        s="PLM · QMS · ALM"
        cls="io"
      />

      <Box
        x={280}
        y={190}
        w={220}
        h={80}
        t="MedTech Memory"
        s="Products & Revisions"
        cls="memory"
      />
      <Box
        x={800}
        y={190}
        w={200}
        h={80}
        t="Quality & RA Agent"
        s="CAPA · Submissions"
        cls="agent"
      />

      <Flow x1={240} y1={100} x2={280} y2={100} />
      <Flow x1={500} y1={100} x2={540} y2={100} />
      <Flow x1={760} y1={100} x2={800} y2={100} />
      <Flow x1={390} y1={140} x2={390} y2={190} />
      <Flow x1={900} y1={140} x2={900} y2={190} />
      <Flow x1={500} y1={230} x2={800} y2={230} dashed />
    </svg>
  );
}

function Box({ x, y, w, h, t, s, cls }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx="14" className={`arch-box ${cls}`} />
      <text x={x + 12} y={y + 32} className="arch-title">
        {t}
      </text>
      <text x={x + 12} y={y + 56} className="arch-sub">
        {s}
      </text>
    </>
  );
}

function Flow({ x1, y1, x2, y2, dashed }) {
  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={`flow ${dashed ? 'flow-dashed' : ''}`}
      />
      <circle className="flow-dot" cx={x1} cy={y1} r="3">
        <animate
          attributeName="cx"
          from={x1}
          to={x2}
          dur="2.4s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="cy"
          from={y1}
          to={y2}
          dur="2.4s"
          repeatCount="indefinite"
        />
      </circle>
    </>
  );
}