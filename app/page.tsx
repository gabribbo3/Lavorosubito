'use client';
import {FormEvent, useEffect, useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {supabase} from '../lib/supabase';

const cats=['Idraulico','Elettricista','Fabbro','Caldaia','Climatizzatore','Serramenti','Meccanico','Altro'];
const icons=['🔧','⚡','🔑','🔥','❄️','🪟','🚗','🏠'];
const slug=(v:string)=>v.toLowerCase().replaceAll(' ','-');

export default function Home(){
 const [user,setUser]=useState<User|null>(null);
 const [role,setRole]=useState<'cliente'|'professionista'>('cliente');
 const [cat,setCat]=useState(''); const [urg,setUrg]=useState('SUBITO'); const [description,setDescription]=useState('');
 const [message,setMessage]=useState(''); const [authOpen,setAuthOpen]=useState(false); const [authMode,setAuthMode]=useState<'login'|'signup'>('signup');
 const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false);
 const [online,setOnline]=useState(false);
 useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user)); const {data}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user??null)); return()=>data.subscription.unsubscribe()},[]);

 async function authSubmit(e:FormEvent){e.preventDefault(); setBusy(true); setMessage('');
  if(authMode==='signup'){
   const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name,role}}});
   setMessage(error?error.message:'Registrazione completata. Controlla la tua email per confermare l’account.');
  } else {const {error}=await supabase.auth.signInWithPassword({email,password}); setMessage(error?error.message:'Accesso effettuato.'); if(!error)setAuthOpen(false)}
  setBusy(false);
 }
 async function submitJob(){
  if(!cat||!description.trim()){setMessage('Scegli una categoria e descrivi il problema.');return}
  if(!user){setRole('cliente');setAuthMode('signup');setAuthOpen(true);setMessage('Registrati o accedi per inviare la richiesta.');return}
  setBusy(true); setMessage('');
  const {data:c,error:ce}=await supabase.from('categories').select('id').eq('slug',slug(cat)).single();
  if(ce||!c){setMessage('Categoria non trovata.');setBusy(false);return}
  const {error}=await supabase.from('jobs').insert({client_id:user.id,category_id:c.id,urgency:urg.toLowerCase(),description:description.trim()});
  setMessage(error?`Errore: ${error.message}`:'✓ Richiesta inviata e salvata nel database.'); setBusy(false);
 }
 async function toggleAvailability(){
  if(!user){setRole('professionista');setAuthOpen(true);return}
  const next=!online; const {error}=await supabase.from('availability').upsert({professional_id:user.id,status:next?'ora':'offline',updated_at:new Date().toISOString()});
  if(error){setMessage('Completa prima il profilo professionista.');return} setOnline(next);
 }
 return <main>
  <header><div className="logo"><b>L</b> Lavoro<span>Subito</span></div><nav><a href="#come">Come funziona</a><a href="#professionisti">Professionisti</a>{user?<button className="outline" onClick={()=>supabase.auth.signOut()}>Esci</button>:<button className="outline" onClick={()=>setAuthOpen(true)}>Accedi / Registrati</button>}</nav></header>
  <section className="hero"><div><label className="tag">● INTERVENTI URGENTI NELLA TUA ZONA</label><h1>Un problema?<br/><span>Risolviamolo subito.</span></h1><p>Trova professionisti disponibili vicino a te. Una richiesta, un match, un intervento.</p><div className="actions"><button className="primary" onClick={()=>document.getElementById('richiesta')?.scrollIntoView()}>🚨 Trova un professionista</button><button className="outline" onClick={()=>{setRole('professionista');setAuthMode('signup');setAuthOpen(true)}}>Registrati come professionista →</button></div><div className="checks">✓ Disponibilità in tempo reale　✓ Profili verificati　✓ Recensioni</div></div>
   <div id="richiesta" className="card"><div className="live">● LIVE REQUEST</div><h2>Di cosa hai bisogno?</h2><p>Scegli il servizio e indica l'urgenza.</p><div className="grid">{cats.map((c,i)=><button key={c} className={cat===c?'cat selected':'cat'} onClick={()=>setCat(c)}><strong>{icons[i]}</strong>{c}</button>)}</div><div className="urg">{['SUBITO','OGGI','48H'].map(u=><button key={u} className={urg===u?'selUrg':''} onClick={()=>setUrg(u)}>{u}</button>)}</div><input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Descrivi brevemente il problema..."/><button className="full" disabled={busy} onClick={submitJob}>{busy?'Invio...':'Trova chi è disponibile →'}</button>{message&&<div className="success">{message}</div>}</div>
  </section>
  <section className="stats"><div><b>30 sec</b><small>per creare una richiesta</small></div><div><b>🟢 LIVE</b><small>disponibilità professionisti</small></div><div><b>V2</b><small>account e richieste reali</small></div></section>
  <section id="come" className="section"><label className="tag">COME FUNZIONA</label><h2>Dal problema alla soluzione.</h2><div className="steps"><article><i>01</i><h3>Descrivi</h3><p>Scegli il servizio e racconta cosa è successo.</p></article><article><i>02</i><h3>Trova</h3><p>Il sistema cerca professionisti compatibili e disponibili.</p></article><article><i>03</i><h3>Risolvi</h3><p>Il professionista accetta e interviene.</p></article></div></section>
  <section id="professionisti" className="proSection"><div className="section"><label className="tag light">PER I PROFESSIONISTI</label><h2>Sei disponibile? <span>Fatti trovare.</span></h2><div className="proPanel"><div><div className="avatar">PRO</div><h3>{user?.email??'Il tuo profilo'}</h3><p>Gestisci la disponibilità in tempo reale</p></div><div className="switchLine"><span>Disponibilità</span><button className={online?'switch on':'switch'} onClick={toggleAvailability}><span/></button><b>{online?'Disponibile ora':'Offline'}</b></div></div></div></section>
  <section className="signup"><label className="tag">V2</label><h2>Il marketplace è collegato al database.</h2><p>Registrazione, login e richieste sono ora integrate con Supabase.</p><button className="primary" onClick={()=>setAuthOpen(true)}>{user?'Account connesso':'Crea il tuo account →'}</button></section>
  <footer><div className="logo"><b>L</b> Lavoro<span>Subito</span></div><small>© 2026 LavoroSubito · V2 MVP</small></footer>
  {authOpen&&<div className="modal"><form className="modalBox" onSubmit={authSubmit}><button type="button" className="x" onClick={()=>setAuthOpen(false)}>×</button><label className="tag">{authMode==='signup'?'REGISTRAZIONE':'ACCESSO'}</label><h2>{authMode==='signup'?'Entra in LavoroSubito':'Bentornato'}</h2>{authMode==='signup'&&<><input required placeholder="Nome e cognome" value={name} onChange={e=>setName(e.target.value)}/><select value={role} onChange={e=>setRole(e.target.value as any)}><option value="cliente">Cliente</option><option value="professionista">Professionista</option></select></>}<input required type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input required minLength={6} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/><button className="full" disabled={busy}>{busy?'Attendi...':authMode==='signup'?'Crea account':'Accedi'}</button><button type="button" className="outline" onClick={()=>setAuthMode(authMode==='signup'?'login':'signup')}>{authMode==='signup'?'Hai già un account? Accedi':'Non hai un account? Registrati'}</button>{message&&<small>{message}</small>}</form></div>}
 </main>
}
