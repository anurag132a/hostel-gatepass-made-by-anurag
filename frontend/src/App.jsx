import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, LogOut, LayoutDashboard, Users, UserRound, ClipboardList, ScanLine, Plus, Check, X, Clock3, MapPin, CalendarDays, ArrowUpRight, RefreshCw, KeyRound } from 'lucide-react';
import { api, clearSession, getSavedUser, setSession } from './api';

const roleLabels = { hosteller: 'Hosteller', principal: 'Principal', hod: 'HOD', warden: 'Warden', security: 'Security Guard' };
const fmt = (d) => d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const statusClass = (s) => (s || 'pending').toLowerCase();

export default function App() {
  const [user, setUser] = useState(getSavedUser());
  const [view, setView] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [passes, setPasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [requestForm, setRequestForm] = useState({ reason: '', destination: '', outTime: '', expectedReturn: '' });
  const [securityCode, setSecurityCode] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const flash = (text, type = 'success') => { setNotice({ text, type }); window.setTimeout(() => setNotice({ text: '', type: '' }), 4200); };
  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [dash, gp] = await Promise.all([api('/dashboard'), api('/gatepasses')]);
      setStats(dash.counts); setPasses(gp.gatepasses || []);
      if (user.role !== 'hosteller') {
        const hs = await api('/hostellers');
        setStudents(hs.hostellers || []);
      }
    } catch (e) { flash(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (user) load(); }, [user]);
  const doLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await api('/auth/login', { method: 'POST', body: JSON.stringify(loginForm) });
      setSession(result.token, result.user); setUser(result.user); setView('dashboard'); flash(`Welcome, ${result.user.name}.`);
    } catch (e) { flash(e.message, 'error'); }
  };
  const logout = () => { clearSession(); setUser(null); setStats(null); setPasses([]); setStudents([]); setView('dashboard'); };
  const submitPass = async (e) => {
    e.preventDefault();
    try {
      await api('/gatepasses', { method: 'POST', body: JSON.stringify(requestForm) });
      setRequestForm({ reason: '', destination: '', outTime: '', expectedReturn: '' });
      flash('Gate-pass request submitted to Principal, HOD and Warden.'); setView('dashboard'); load();
    } catch (e) { flash(e.message, 'error'); }
  };
  const decide = async (id, decision) => {
    try { const r = await api(`/gatepasses/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision }) }); flash(r.message); load(); }
    catch (e) { flash(e.message, 'error'); }
  };
  const verifyCode = async (e) => {
    e.preventDefault();
    try { const r = await api('/security/verify', { method: 'POST', body: JSON.stringify({ code: securityCode }) }); flash(r.message); setSecurityCode(''); load(); }
    catch (e) { flash(e.message, 'error'); }
  };
  const openStudent = async (id) => {
    try { const d = await api(`/hostellers/${id}`); setSelectedStudent(d); setView('student-detail'); }
    catch (e) { flash(e.message, 'error'); }
  };
  const filteredStudents = useMemo(() => students.filter(s => `${s.name} ${s.studentId || ''} ${s.roomNo || ''} ${s.department || ''}`.toLowerCase().includes(search.toLowerCase())), [students, search]);
  const nav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    ...(user?.role === 'hosteller' ? [{ id: 'new-pass', label: 'Request gate pass', icon: Plus }, { id: 'profile', label: 'My profile', icon: UserRound }] : []),
    ...(user && user.role !== 'hosteller' ? [{ id: 'hostellers', label: 'Hosteller directory', icon: Users }] : []),
    ...(user?.role === 'security' ? [{ id: 'verify', label: 'Verify code', icon: ScanLine }] : [])
  ];
  if (!user) return <div className="login-page"><div className="login-art"><div className="brand"><span className="brand-mark"><ShieldCheck size={23}/></span> HostelHub</div><div className="hero-copy"><span className="eyebrow">HOSTEL OPERATIONS PORTAL</span><h1>Campus life,<br/><em>made simpler.</em></h1><p>A secure and transparent way to manage hostel gate passes, approvals, and student movement.</p><div className="hero-points"><span><Check size={16}/> Multi-level approvals</span><span><Check size={16}/> Verified exit & entry</span><span><Check size={16}/> Role-based access</span></div></div><div className="art-footer">HOSTELHUB · GATEPASS MANAGEMENT</div></div><div className="login-panel"><form className="login-card" onSubmit={doLogin}><div className="mobile-brand"><ShieldCheck/> HostelHub</div><span className="eyebrow">WELCOME BACK</span><h2>Sign in to your portal</h2><p className="muted">Use your assigned hostel account to continue.</p><label>Username<input value={loginForm.username} onChange={e=>setLoginForm({...loginForm,username:e.target.value})} autoComplete="username" required/></label><label>Password<input type="password" value={loginForm.password} onChange={e=>setLoginForm({...loginForm,password:e.target.value})} autoComplete="current-password" required/></label><button className="primary full" type="submit">Sign in <ArrowUpRight size={17}/></button><p className="secure-note"><ShieldCheck size={14}/> Protected role-based access</p></form>{notice.text && <div className={`toast ${notice.type}`}>{notice.text}</div>}</div></div>;

  const pending = passes.filter(p => p.status === 'PENDING');
  const canApprove = ['principal','hod','warden'].includes(user.role);
  const mine = (p) => p.hosteller?._id === user._id || p.hosteller === user._id;
  const displayPasses = user.role === 'hosteller' ? passes.filter(mine) : passes;
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark"><ShieldCheck size={23}/></span><span>HostelHub<small>GATEPASS PORTAL</small></span></div><div className="nav-label">WORKSPACE</div><nav>{nav.map(item => <button key={item.id} className={`nav-item ${view===item.id?'active':''}`} onClick={()=>{setView(item.id);setSelectedStudent(null);}}><item.icon size={18}/>{item.label}{item.id==='hostellers'&&<span className="nav-count">{students.length}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="security-chip"><span className="online-dot"></span><div><strong>System operational</strong><small>Connected to API</small></div></div><button className="nav-item logout" onClick={logout}><LogOut size={18}/> Sign out</button></div></aside>
    <main className="main-area"><header className="topbar"><div><div className="crumb">Workspace <span>/</span> {view==='dashboard'?'Overview':view==='new-pass'?'New request':view==='hostellers'?'Hosteller directory':view==='verify'?'Code verification':view==='profile'?'My profile':'Student details'}</div><h2>{view==='dashboard'?`Good day, ${user.name.split(' ')[1] || user.name.split(' ')[0]}`:view==='new-pass'?'Request a gate pass':view==='hostellers'?'Hosteller directory':view==='verify'?'Gate code verification':view==='profile'?'My profile':'Hosteller details'}</h2></div><div className="top-actions"><button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={17}/></button><div className="user-pill"><div className="avatar">{user.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div><div><strong>{user.name}</strong><small>{roleLabels[user.role]}</small></div></div></div></header>
    {notice.text && <div className={`notice ${notice.type}`}>{notice.text}<button onClick={()=>setNotice({text:'',type:''})}><X size={15}/></button></div>}
    {loading && <div className="loading-line"></div>}
    {view==='dashboard' && <div className="page-content">
      <div className="welcome-banner"><div><span className="eyebrow">YOUR HOSTEL, IN SYNC</span><h3>{user.role==='hosteller'?'Your plans, approved and accounted for.':'A clearer view of campus movement.'}</h3><p>{user.role==='hosteller'?'Create a request and follow every approval in one place.':'Review requests, coordinate approvals, and keep every movement accountable.'}</p></div><div className="banner-icon"><ShieldCheck size={46}/></div></div>
      <div className="stat-grid">{[
        ['Total requests',stats?.total??0,'All recorded gate passes',ClipboardList],
        ['Awaiting review',stats?.pending??0,'Requests pending',Clock3],
        ['Approved',stats?.approved??0,'Ready for exit',Check],
        ['Currently outside',stats?.outside??0,'Awaiting return',ArrowUpRight]
      ].map(([label,value,sub,Icon])=><div className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={18}/></span></div><strong className="stat-value">{value}</strong><small>{sub}</small></div>)}</div>
      <div className="section-heading"><div><h3>{user.role==='hosteller'?'Your gate-pass activity':'Recent gate-pass activity'}</h3><p>Track requests and their current approval status.</p></div>{user.role==='hosteller'&&<button className="primary" onClick={()=>setView('new-pass')}><Plus size={16}/> New request</button>}</div>
      <PassTable passes={displayPasses} user={user} decide={decide} canApprove={canApprove} empty="No gate-pass requests found."/>
      {user.role!=='hosteller'&&<div className="section-heading mt"><div><h3>Approval workflow</h3><p>Every request needs three decisions before a gate code is issued.</p></div></div>}
      {user.role!=='hosteller'&&<div className="workflow-grid">{[['01','Principal approval'],['02','HOD approval'],['03','Warden approval'],['04','Security verification']].map(([n,t])=><div className="workflow-step" key={n}><span>{n}</span><strong>{t}</strong></div>)}</div>}
    </div>}
    {view==='new-pass'&&<div className="page-content narrow"><div className="form-card"><div className="form-title"><span className="form-icon"><ClipboardList/></span><div><h3>Gate-pass request</h3><p>Provide your destination and timings. The request goes to all three approvers.</p></div></div><form onSubmit={submitPass} className="data-form"><label>Reason for leaving<input placeholder="e.g. Family visit, medical appointment" value={requestForm.reason} onChange={e=>setRequestForm({...requestForm,reason:e.target.value})} maxLength="500" required/></label><label>Destination<input placeholder="Where are you going?" value={requestForm.destination} onChange={e=>setRequestForm({...requestForm,destination:e.target.value})} maxLength="200" required/></label><div className="form-row"><label><CalendarDays size={15}/> Exit date & time<input type="datetime-local" value={requestForm.outTime} onChange={e=>setRequestForm({...requestForm,outTime:e.target.value})} required/></label><label><CalendarDays size={15}/> Expected return<input type="datetime-local" value={requestForm.expectedReturn} onChange={e=>setRequestForm({...requestForm,expectedReturn:e.target.value})} required/></label></div><div className="info-callout"><ShieldCheck size={18}/><span>Your request must be approved by <b>Principal, HOD and Warden</b> before a security code is issued.</span></div><div className="form-actions"><button type="button" className="secondary" onClick={()=>setView('dashboard')}>Cancel</button><button className="primary" type="submit">Submit request <ArrowUpRight size={16}/></button></div></form></div></div>}
    {view==='hostellers'&&<div className="page-content"><div className="directory-toolbar"><div><h3>Hosteller records</h3><p>Student profile visibility is restricted to authorized staff roles.</p></div><div className="search-wrap"><Users size={17}/><input placeholder="Search name, ID, room..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div><div className="student-grid">{filteredStudents.map(s=><button className="student-card" key={s._id} onClick={()=>openStudent(s._id)}><div className="student-avatar">{s.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div><div className="student-info"><strong>{s.name}</strong><span>{s.studentId||'No student ID'}</span><small><MapPin size={13}/> Room {s.roomNo||'—'}</small></div><ArrowUpRight className="student-arrow" size={17}/></button>)}{filteredStudents.length===0&&<div className="empty-state">No hostellers match your search.</div>}</div></div>}
    {view==='student-detail'&&selectedStudent&&<div className="page-content"><button className="back-link" onClick={()=>setView('hostellers')}>← Back to directory</button><div className="profile-card"><div className="profile-head"><div className="profile-avatar">{selectedStudent.hosteller.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div><div><h3>{selectedStudent.hosteller.name}</h3><p>{selectedStudent.hosteller.studentId} · Room {selectedStudent.hosteller.roomNo||'—'}</p></div></div><div className="profile-grid">{[['Username',selectedStudent.hosteller.username],['Phone',selectedStudent.hosteller.phone],['Email',selectedStudent.hosteller.email],['Course',selectedStudent.hosteller.course],['Department',selectedStudent.hosteller.department],['Year',selectedStudent.hosteller.year],['Parent / Guardian',selectedStudent.hosteller.parentName],['Guardian phone',selectedStudent.hosteller.parentPhone],['Address',selectedStudent.hosteller.address]].map(([k,v])=><div key={k}><small>{k}</small><strong>{v||'—'}</strong></div>)}</div></div><div className="section-heading"><div><h3>Gate-pass history</h3><p>All recorded requests for this hosteller.</p></div></div><PassTable passes={selectedStudent.gatepasses||[]} user={user} decide={decide} canApprove={canApprove} empty="No history found."/></div>}
    {view==='profile'&&<div className="page-content narrow"><div className="profile-card"><div className="profile-head"><div className="profile-avatar">{user.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div><div><h3>{user.name}</h3><p>{roleLabels[user.role]} · {user.username}</p></div></div><div className="profile-grid">{[['Student ID',user.studentId],['Room',user.roomNo],['Phone',user.phone],['Email',user.email],['Course',user.course],['Department',user.department],['Year',user.year],['Parent / Guardian',user.parentName],['Guardian phone',user.parentPhone],['Address',user.address]].map(([k,v])=><div key={k}><small>{k}</small><strong>{v||'—'}</strong></div>)}</div></div></div>}
    {view==='verify'&&<div className="page-content narrow"><div className="form-card verify-card"><span className="verify-illustration"><KeyRound size={32}/></span><h3>Verify gate code</h3><p>Scan or enter the one-time code provided by the hosteller. OUT codes record exit; IN codes record return.</p><form onSubmit={verifyCode} className="data-form"><label>Gate code<input className="code-input" placeholder="OUT-XXXXXXXX or IN-XXXXXXXX" value={securityCode} onChange={e=>setSecurityCode(e.target.value.toUpperCase())} required autoComplete="off"/></label><button className="primary full" type="submit"><ScanLine size={17}/> Verify code</button></form><div className="info-callout"><ShieldCheck size={18}/><span>Codes are accepted only for the current gate-pass state and cannot be reused after the transition.</span></div></div></div>}
    </main>
  </div>;
}

function PassTable({ passes, user, decide, canApprove, empty }) {
  const [expanded, setExpanded] = useState(null);
  return <div className="table-card"><div className="table-scroll"><table><thead><tr><th>Hosteller / Request</th><th>Schedule</th><th>Approvals</th><th>Status</th><th>Gate codes</th>{canApprove&&<th>Action</th>}</tr></thead><tbody>{passes.map(p=><React.Fragment key={p._id}><tr><td><div className="request-title"><strong>{p.hosteller?.name||user.name}</strong><small>{p.reason}</small><span className="destination"><MapPin size={12}/> {p.destination}</span></div></td><td><div className="schedule"><span>OUT <b>{new Date(p.outTime).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}</b></span><span>BACK <b>{new Date(p.expectedReturn).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}</b></span></div></td><td><div className="approval-list">{['principal','hod','warden'].map(role=><span key={role} className={`approval ${statusClass(p.approvals?.[role])}`}><i></i>{role==='hod'?'HOD':role[0].toUpperCase()+role.slice(1)}</span>)}</div></td><td><span className={`status-badge ${statusClass(p.status)}`}>{p.status}</span></td><td>{p.status==='APPROVED'||p.status==='OUT'||p.status==='COMPLETED'?<button className="codes-button" onClick={()=>setExpanded(expanded===p._id?null:p._id)}>{expanded===p._id?'Hide codes':'View codes'} <KeyRound size={13}/></button>:<span className="muted">Not issued</span>}{expanded===p._id&&<div className="codes-reveal"><small>Exit code</small><b>{p.exitCode||'—'}</b><small>Entry code</small><b>{p.entryCode||'—'}</b></div>}</td>{canApprove&&<td>{p.status==='PENDING'&&p.approvals?.[user.role]==='PENDING'?<div className="action-buttons"><button className="approve-btn" title="Approve" onClick={()=>decide(p._id,'APPROVED')}><Check size={15}/></button><button className="reject-btn" title="Reject" onClick={()=>decide(p._id,'REJECTED')}><X size={15}/></button></div>:<span className="muted">—</span>}</td>}</tr></React.Fragment>)}{passes.length===0&&<tr><td colSpan={canApprove?6:5}><div className="empty-state">{empty}</div></td></tr>}</tbody></table></div><div className="table-foot"><span>Showing {passes.length} request{passes.length===1?'':'s'}</span><span><span className="online-dot"></span> Live database records</span></div></div>;
}
