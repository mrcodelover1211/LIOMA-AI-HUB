import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, BrainCircuit, Check, ChevronDown, Code2, Database, Globe, KeyRound, PanelLeft, Plane, Plus, Search, Send, Settings, ShieldCheck, ShoppingCart, Sparkles, TerminalSquare } from 'lucide-react';
import './styles.css';

const modes = [
  { name: 'General Assistant', icon: Sparkles },
  { name: 'Shopping', icon: ShoppingCart },
  { name: 'Research', icon: Search },
  { name: 'Aviation', icon: Plane },
  { name: 'Builder', icon: Code2 },
  { name: 'Browser Agent', icon: Globe }
];

function App() {
  const [mode, setMode] = useState('General Assistant');
  const [keyState, setKeyState] = useState({ loading: true, configured: false, secureStorageAvailable: true });
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    window.lioma.keyStatus().then(s => setKeyState({ loading: false, ...s }))
      .catch(() => setKeyState({ loading: false, configured: false, secureStorageAvailable: false }));
  }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  async function saveKey(e) {
    e.preventDefault();
    setKeyError('');
    const result = await window.lioma.saveKey(keyInput);
    if (result.ok) {
      setKeyInput('');
      setKeyState(s => ({ ...s, configured: true }));
      setShowSettings(false);
    } else setKeyError(result.error || 'Could not save key.');
  }

  async function sendMessage(e) {
    e?.preventDefault();
    const message = input.trim();
    if (!message || busy || !keyState.configured) return;
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setInput('');
    setBusy(true);
    const result = await window.lioma.chat({ message, mode, history });
    setMessages(prev => [...prev, { role: 'assistant', content: result.ok ? result.text : `Error: ${result.error}`, error: !result.ok }]);
    setBusy(false);
  }

  if (keyState.loading) return <div className="loading">Starting Lioma Agent Hub…</div>;
  if (!keyState.configured || showSettings) return <div className="setup-wrap"><div className="setup-card">
    <div className="brand-mark"><BrainCircuit size={30}/></div><div className="eyebrow">LIOMA AGENT HUB · FIRST-RUN SETUP</div>
    <h1>{keyState.configured ? 'API key settings' : 'Connect Lioma’s brain'}</h1>
    <p className="muted">Enter your Groq API key once. Lioma encrypts it with your operating system’s secure storage and hides the input after saving.</p>
    {!keyState.secureStorageAvailable && <div className="error">Secure storage is unavailable. Lioma will not save your key as plain text. Check your Windows account and restart the app.</div>}
    <form onSubmit={saveKey}><label htmlFor="api-key">Groq API key</label><input id="api-key" type="password" autoComplete="off" value={keyInput} onChange={e => setKeyInput(e.target.value)} placeholder="gsk_••••••••••••••••" autoFocus/>
      {keyError && <div className="error">{keyError}</div>}
      <button className="primary full" type="submit" disabled={!keyInput.trim() || !keyState.secureStorageAvailable}><KeyRound size={16}/> Save securely</button>
    </form>
    <div className="small-note"><ShieldCheck size={15}/> Encrypted on this PC. The key is not sent to Supabase.</div>
    <button className="text-button" onClick={() => window.lioma.openExternal('https://console.groq.com/keys')}>Get a Groq API key ↗</button>
    {keyState.configured && <button className="text-button" onClick={() => setShowSettings(false)}>Cancel</button>}
  </div></div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark small"><BrainCircuit size={22}/></div><div><strong>LIOMA</strong><span>AGENT HUB</span></div><button className="icon-btn collapse" title="Sidebar"><PanelLeft size={17}/></button></div>
      <button className="new-chat" onClick={() => setMessages([])}><Plus size={17}/> New conversation <span>⌘K</span></button>
      <div className="section-label">WORKSPACES</div>
      <nav className="mode-list">{modes.map(m => { const Icon = m.icon; return <button key={m.name} className={`mode-item ${mode === m.name ? 'active' : ''}`} onClick={() => setMode(m.name)}><Icon size={17}/><span>{m.name}</span>{mode === m.name && <span className="active-dot"/>}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="connection"><span className="green-dot"/><div><strong>Groq connected</strong><small>API key saved securely</small></div><Check size={16}/></div><button className="mode-item" onClick={() => setShowSettings(true)}><Settings size={17}/> API key settings</button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb"><span>Workspace</span><span className="slash">/</span><strong>{mode}</strong><ChevronDown size={15}/></div><div className="top-actions"><div className="status-pill"><span className="green-dot"/> Ready</div><button className="icon-btn" title="Settings" onClick={() => setShowSettings(true)}><Settings size={18}/></button></div></header>
      <section className="conversation">{messages.length === 0 ? <div className="welcome">
        <div className="welcome-orb"><BrainCircuit size={34}/></div><div className="eyebrow">YOUR AI WORKSPACE</div><h1>What are we working on?</h1><p>Talk to Lioma, switch modes, and turn ideas into tasks.</p>
        <div className="suggestions">{[
          { icon: ShoppingCart, title: 'Find a product', mode: 'Shopping', prompt: 'Help me find and compare products. Ask me for my budget and requirements.' },
          { icon: Search, title: 'Research a topic', mode: 'Research', prompt: 'Help me research a topic. Separate verified facts from uncertainty.' },
          { icon: Plane, title: 'Aviation assistant', mode: 'Aviation', prompt: 'Help me with MSFS 2020 and aviation research.' },
          { icon: Code2, title: 'Build an app', mode: 'Builder', prompt: 'Help me plan a software project and break it into implementable tasks.' }
        ].map(s => { const Icon = s.icon; return <button className="suggestion" key={s.title} onClick={() => { setMode(s.mode); setInput(s.prompt); }}><Icon size={18}/><span><strong>{s.title}</strong><small>{s.prompt}</small></span></button>; })}</div>
      </div> : <div className="message-list">{messages.map((m, i) => <div className={`message-row ${m.role}`} key={i}><div className={`avatar ${m.role}`}>{m.role === 'assistant' ? <BrainCircuit size={17}/> : 'Z'}</div><div className={`bubble ${m.error ? 'bubble-error' : ''}`}><div className="message-author">{m.role === 'assistant' ? `Lioma · ${mode}` : 'You'}</div><div className="message-content">{m.content}</div></div></div>)}{busy && <div className="message-row assistant"><div className="avatar assistant"><BrainCircuit size={17}/></div><div className="bubble"><div className="message-author">Lioma is thinking…</div><div className="typing"><i/><i/><i/></div></div></div>}<div ref={bottomRef}/></div>}</section>
      <div className="composer-area"><form className="composer" onSubmit={sendMessage}><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={`Message Lioma in ${mode}…`} rows={2}/><div className="composer-footer"><div className="composer-tools"><span><ShieldCheck size={14}/> Private key storage</span><span className="mode-chip">{mode}</span></div><button className="send-btn" type="submit" disabled={!input.trim() || busy}><Send size={17}/></button></div></form><p className="disclaimer">Lioma can make mistakes. Verify important information and approve purchases yourself.</p></div>
    </main>
    <aside className="activity-panel"><div className="panel-heading"><div><Activity size={17}/><strong>Agent activity</strong></div><button className="icon-btn"><ChevronDown size={16}/></button></div>
      <div className="activity-empty"><div className="empty-icon"><TerminalSquare size={22}/></div><strong>No active tasks</strong><p>Tasks and tool activity will appear here when connected.</p></div>
      <div className="panel-section"><div className="section-label">SYSTEM STATUS</div><div className="system-row"><span>AI inference</span><span className="ok">Connected</span></div><div className="system-row"><span>Supabase</span><span className="muted">Not configured</span></div><div className="system-row"><span>Browser agent</span><span className="muted">Not connected</span></div></div>
      <div className="panel-section"><div className="section-label">QUICK LINKS</div><button className="quick-link" onClick={() => window.lioma.openExternal('https://console.groq.com/docs/models')}><Globe size={15}/> Groq model catalog</button><button className="quick-link" onClick={() => window.lioma.openExternal('https://supabase.com/dashboard')}><Database size={15}/> Supabase dashboard</button></div>
      <div className="panel-footer"><ShieldCheck size={15}/><span>Local key encryption enabled</span></div>
    </aside>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);