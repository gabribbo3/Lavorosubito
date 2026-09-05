'use client';
import {useState} from 'react';

const cats=['Idraulico','Elettricista','Fabbro','Caldaia','Climatizzatore','Serramenti','Meccanico','Altro'];
const icons=['🔧','⚡','🔑','🔥','❄️','🪟','🚗','🏠'];

export default function Home(){
 const [role,setRole]=useState<'cliente'|'professionista'>('cliente');
 const [cat,setCat]=useState('');
 const [urg,setUrg]=useState('SUBITO');
 const [sent,setSent]=useState(false);
 const [online,setOnline]=useState(true);
 const submit=()=>{if(cat){setSent(true)}};
 return <main>
  <header><div className="logo"><b>L</b> Lavoro<span>Subito</span></div><nav><a href="#come">Come funziona</a><a href="#professionisti">Professionisti</a><button className="outline" onClick={()=>setRole('professionista')}>Sono un professionista</button></nav></header>
  <section className="hero">
   <div><label className="tag">● INTERVENTI URGENTI NELLA TUA ZONA</label><h1>Un problema?<br/><span>Risolviamolo subito.</span></h1><p>Trova professionisti disponibili vicino a te. Una richiesta, un match, un intervento.</p><div className="actions"><button className="primary" onClick={()=>document.getElementById('richiesta')?.scrollIntoView()}>🚨 Trova un professionista</button><button className="outline" onClick={()=>setRole('professionista')}>Registrati come professionista →</button></div><div className="checks">✓ Disponibilità in tempo reale　✓ Profili verificati　✓ Recensioni</div></div>
   <div id="richiesta" className="card">
    <div className="live">● LIVE REQUEST</div><h2>Di cosa hai bisogno?</h2><p>Scegli il servizio e indica l'urgenza.</p>
    <div className="grid">{cats.map((c,i)=><button key={c} className={cat===c?'cat selected':'cat'} onClick={()=>setCat(c)}><strong>{icons[i]}</strong>{c}</button>)}</div>
    <div className="urg"><button className={urg==='SUBITO'?'selUrg':''} onClick={()=>setUrg('SUBITO')}>🔴 SUBITO</button><button className={urg==='OGGI'?'selUrg':''} onClick={()=>setUrg('OGGI')}>🟠 OGGI</button><button className={urg==='48H'?'selUrg':''} onClick={()=>setUrg('48H')}>🟡 48H</button></div>
    <input placeholder="Descrivi brevemente il problema..." />
    <button className="full" onClick={submit}>{sent?'✓ Richiesta inviata':'Trova chi è disponibile →'}</button>
    {sent && <div className="success">Richiesta demo creata: {cat} · {urg}. Nella V2 la richiesta verrà inviata ai professionisti reali.</div>}
   </div>
  </section>
  <section className="stats"><div><b>30 sec</b><small>per creare una richiesta</small></div><div><b>🟢 LIVE</b><small>disponibilità professionisti</small></div><div><b>4,9/5</b><small>esperienza pensata per la fiducia</small></div></section>
  <section id="come" className="section"><label className="tag">COME FUNZIONA</label><h2>Dal problema alla soluzione.</h2><div className="steps"><article><i>01</i><h3>Descrivi</h3><p>Scegli il servizio e racconta cosa è successo.</p></article><article><i>02</i><h3>Trova</h3><p>Il sistema cerca professionisti compatibili e disponibili.</p></article><article><i>03</i><h3>Risolvi</h3><p>Il professionista accetta, interviene e riceve il pagamento.</p></article></div></section>
  <section id="professionisti" className="proSection"><div className="section"><label className="tag light">PER I PROFESSIONISTI</label><h2>Sei disponibile? <span>Fatti trovare.</span></h2><div className="proPanel"><div><div className="avatar">MR</div><h3>Mario Rossi</h3><p>Idraulico · Urbino e dintorni</p></div><div className="switchLine"><span>Disponibilità</span><button className={online?'switch on':'switch'} onClick={()=>setOnline(!online)}><span/></button><b>{online?'Disponibile ora':'Offline'}</b></div></div></div></section>
  <section className="signup"><label className="tag">V1</label><h2>Costruiamo il marketplace insieme.</h2><p>La prima versione valida il flusso. Database, account, GPS, notifiche e pagamenti saranno collegati nella prossima fase.</p><button className="primary" onClick={()=>setRole('cliente')}>Inizia come cliente →</button></section>
  <footer><div className="logo"><b>L</b> Lavoro<span>Subito</span></div><small>© 2026 LavoroSubito · V1 MVP</small></footer>
  {role==='professionista' && <div className="modal"><div className="modalBox"><button className="x" onClick={()=>setRole('cliente')}>×</button><label className="tag">PROFESSIONISTA</label><h2>Entra in LavoroSubito</h2><p>Crea il tuo profilo e indica quando puoi intervenire.</p><input placeholder="Nome e cognome"/><input placeholder="Email"/><select><option>Scegli professione</option>{cats.map(c=><option key={c}>{c}</option>)}</select><input placeholder="Comune / zona"/><button className="full">Crea profilo</button><small>Questa è una demo: il salvataggio reale sarà collegato a Supabase.</small></div></div>}
 </main>
}
