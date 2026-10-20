import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {getFirestore,doc,onSnapshot,runTransaction} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
const firebaseConfig = {
  apiKey: "AIzaSyAQaBZqR3pgplwryS1qQwSUT29dPZ3crMM",
  authDomain: "totowrap-749d3.firebaseapp.com",
  projectId: "totowrap-749d3",
  storageBucket: "totowrap-749d3.firebasestorage.app",
  messagingSenderId: "920889634224",
  appId: "1:920889634224:web:d2952fe6680bba9c477a75"
};
const fbApp=initializeApp(firebaseConfig);const db=getFirestore(fbApp);const auth=getAuth(fbApp);
const root=document.documentElement;
const themeButton=document.querySelector('#theme-toggle');
let theme=localStorage.getItem('totowrap-watch-theme')||'auto';
function applyTheme(){const dark=theme==='dark'||(theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);root.dataset.theme=dark?'dark':'light';themeButton.textContent=dark?'☀ LIGHT':'☾ DARK';themeButton.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode')}
applyTheme();
themeButton.addEventListener('click',()=>{theme=root.dataset.theme==='dark'?'light':'dark';localStorage.setItem('totowrap-watch-theme',theme);applyTheme()});
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(theme==='auto')applyTheme()});
const loginPanel=document.querySelector('#login-panel'),wrapPanel=document.querySelector('#wrap-panel'),loginToggle=document.querySelector('#login-toggle'),authMessage=document.querySelector('#auth-message');
let admin=false;
loginToggle.addEventListener('click',()=>{if(!admin)loginPanel.hidden=!loginPanel.hidden});
document.querySelector('#login-form').addEventListener('submit',async e=>{e.preventDefault();authMessage.textContent='Signing in…';try{await signInWithEmailAndPassword(auth,document.querySelector('#admin-email').value.trim(),document.querySelector('#admin-password').value);document.querySelector('#admin-password').value=''}catch(err){authMessage.textContent='Login failed: '+(err.code||'check credentials')}});
loginToggle.addEventListener('click',()=>{if(admin)signOut(auth)});
onAuthStateChanged(auth,user=>{admin=Boolean(user&&user.email?.toLowerCase()==='edgaleone@gmail.com');loginToggle.textContent=admin?'LOG OUT':'LOGIN';loginPanel.hidden=true;wrapPanel.hidden=true;render();if(user&&!admin){authMessage.textContent='This account is not an authorized admin';loginPanel.hidden=false}});
let state=null,tab='today';const content=document.querySelector('#content');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=v=>/^\d{1,2}:\d{2}/.test(String(v||''))?String(v):'--:--';
const day=()=>{const unit=state?.activeUnit||'main';return state?.liveGames?.[unit]||state?.today||null};
const roster=()=>Array.isArray(state?.playerRoster)?state.playerRoster:[];
const guesses=()=>Array.isArray(day()?.guesses)?day().guesses.filter(x=>x?.time):[];
const sortTime=(a,b)=>String(a.time).localeCompare(String(b.time));
function render(){if(!state){content.innerHTML='<p class="empty">Waiting for live data…</p>';return}const d=day();if(tab==='today'){
 const done=Boolean(d?.wrapTime);const active=Boolean(d&&!done&&(d.approvedAt||d.guesses?.length));
 if(!d||(!done&&!active)){content.innerHTML='<div class="hero no-game"><div class="big">No active game yet</div></div>';return}
 if(done){content.innerHTML=`<div class="hero"><div class="wrap-result-label">TODAY’S WRAP</div><div class="wrap-result">${esc(d.wrapTime)}</div><div class="sub">${esc(Array.isArray(d.winners)&&d.winners.length?d.winners.map(w=>w.name||w).join(' & '):d.winner||'Official result')}</div></div>`;return}
 content.innerHTML=`<div class="hero"><div class="eyebrow">TODAY’S WRAP</div><button id="live-clock" class="clock-wrap" ${admin?'':'disabled'} aria-label="${admin?'Tap to set official wrap':'Official wrap available to admin only'}">${esc(nowClock())}</button><div class="clock-hint">${admin?'TAP TIME TO WRAP':'LIVE TIME'}</div></div>`;
 document.querySelector('#live-clock')?.addEventListener('click',openWrapDialog);

}else if(tab==='bets'){const bets=guesses().sort(sortTime);content.innerHTML='<div class="eyebrow">TODAY’S BETS</div>'+(bets.length?`<div class="list">${bets.map(g=>`<div class="entry"><span>${esc(g.name)}</span><strong>${esc(g.time)}</strong></div>`).join('')}</div>`:'<p class="empty">No bets yet.</p>');
}else{const scores=state?.scores||{};const people=roster().map(p=>({name:p.name,score:Number(scores[p.name])||0})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));content.innerHTML='<div class="eyebrow">LEADERBOARD</div>'+(people.length?`<div class="list">${people.map((p,i)=>`<div class="entry"><span>${i+1}. ${esc(p.name)}</span><strong>${p.score} PT</strong></div>`).join('')}</div>`:'<p class="empty">No players yet.</p>')}
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));render()}));
onSnapshot(doc(db,'totowrap','state'),snap=>{state=snap.exists()?snap.data():{};document.querySelector('#connection').textContent='● CONNECTED';render()},err=>{document.querySelector('#connection').textContent='OFFLINE';content.innerHTML='<p class="empty">Unable to load live data. Check your connection and retry.</p>';console.error('Watch Firebase',err)});

// Capture time once, at the moment the admin taps the clock.
const nowClock=()=>new Date().toLocaleTimeString('en-GB',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
const isoLocal=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
let captured=null,submitting=false;
const dialog=document.querySelector('#wrap-dialog');
function openWrapDialog(){const d=day();if(!admin||!d||d.wrapTime||!(d.approvedAt||d.guesses?.length))return;captured={time:nowClock(),date:isoLocal(),unit:state?.activeUnit||'main',version:state?._version||0};document.querySelector('#wrap-confirm-time').textContent=captured.time;document.querySelector('#wrap-error').textContent='';dialog.showModal()}
document.querySelector('#wrap-cancel').addEventListener('click',()=>{if(!submitting)dialog.close()});
const DAY=86400;const sec=t=>{const a=String(t||'').split(':').map(Number);return a[0]*3600+a[1]*60+(a[2]||0)};
const dateDays=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);
const align=(time,ref)=>[sec(time)-DAY,sec(time),sec(time)+DAY].sort((a,b)=>Math.abs(a-ref)-Math.abs(b-ref))[0];
const nameKey=v=>String(v||'').trim().toLocaleLowerCase();
function officialResult(g,wrap,day){
 const base=day.approvedDate||(/^\d{4}-\d{2}-\d{2}$/.test(day.date||'')?day.date:null)||isoLocal();
 const start=day.approvedAt?sec(day.approvedAt):null;
 const wrapSec=dateDays(base,day.wrapDate)*DAY+sec(wrap);
 const mode=day.historicalImport?.calculationMode||((day.date||day.approvedDate||'')<='2026-06-29'?'legacy':'current');
 const outer=!(day.date||day.approvedDate)||(day.date||day.approvedDate)>='2026-07-16';
 const bets=(g||[]).filter(x=>x.time).map(x=>({...x,s:align(x.time,wrapSec)})).sort((a,b)=>a.s-b.s);
 const groups=[];for(const bet of bets){const last=groups.at(-1);if(last&&last.s===bet.s)last.names.push(bet.name);else groups.push({s:bet.s,names:[bet.name]})}
 const midpoint=(a,b)=>mode==='legacy'?Math.floor((a+b)/2)+1:Math.floor((a+60+b)/2);
 const slices=groups.map((group,i)=>({names:group.names,start:i?midpoint(groups[i-1].s,group.s):(outer?group.s-1800:(start===null?0:start+1)),end:i<groups.length-1?midpoint(group.s,groups[i+1].s)-1:(outer?group.s+59+1800:(start===null?DAY-1:start+DAY))}));
 const winner=slices.find(s=>wrapSec>=s.start&&wrapSec<=s.end);
 const crazy=day.crazyDay?.enabled?day.crazyDay:null;
 const regular=crazy?Number(crazy.regularPoints):1,perfect=crazy?Number(crazy.perfectPoints):2;
 if(![regular,perfect].every(Number.isFinite))throw Error('Invalid scoring configuration');
 const exact=winner&&bets.some(x=>winner.names.includes(x.name)&&wrapSec>=x.s&&wrapSec<=x.s+59);
 const points=winner?(exact?perfect:regular):0;
 const penalties=[];if(crazy&&Number(crazy.penaltyPoints)){const penalty=-Math.abs(Number(crazy.penaltyPoints));const seen=new Set();const add=(name,reason)=>{if(!name||seen.has(nameKey(name)))return;seen.add(nameKey(name));penalties.push({name,points:penalty,reason})};(g||[]).filter(x=>x.name&&!x.time).forEach(x=>add(x.name,'missed-bet'));const excluded=new Set(winner?.names.map(nameKey)||[]);const distances=bets.filter(x=>!excluded.has(nameKey(x.name))).map(x=>({name:x.name,gap:Math.abs(x.s-wrapSec)}));const max=Math.max(...distances.map(x=>x.gap));if(Number.isFinite(max))distances.filter(x=>x.gap===max).forEach(x=>add(x.name,'furthest-from-wrap'))}
 return {winner:winner?.names[0]||"Nobody wins, everybody's happy!",winners:winner?.names.map(name=>({name}))||[],points,noWinner:!winner,penalties};
}
function addScore(scores,name,delta){if(!delta)return;const next=(Number(scores[name])||0)+delta;if(next===0)delete scores[name];else scores[name]=next}
document.querySelector('#wrap-confirm').addEventListener('click',async()=>{
 if(submitting||!captured||!admin||!auth.currentUser)return;submitting=true;const btn=document.querySelector('#wrap-confirm');btn.disabled=true;const error=document.querySelector('#wrap-error');error.textContent='Saving…';
 try{const request={...captured};await runTransaction(db,async tx=>{const ref=doc(db,'totowrap','state');const snap=await tx.get(ref);if(!snap.exists())throw Error('Game not found');const remote=snap.data();if(Number(remote._version||0)!==Number(request.version))throw Error('Game changed on another device. Review and try again.');const unit=request.unit;const current=remote.liveGames?.[unit]||remote.today;if(!current||current.wrapTime||!(current.approvedAt||current.guesses?.length))throw Error('Game is not active');const updated=structuredClone(current);updated.wrapDate=request.date;const result=officialResult(updated.guesses||[],request.time,updated);Object.assign(updated,result,{wrapTime:request.time});const scores={...(remote.scores||{})};if(!result.noWinner)result.winners.forEach(w=>addScore(scores,w.name,result.points));result.penalties.forEach(p=>addScore(scores,p.name,p.points));const next={...remote,scores,_version:Number(remote._version||0)+1,liveGames:{...(remote.liveGames||{}),[unit]:updated}};if(remote.activeUnit===unit||remote.today?.unit===unit||(!remote.today?.unit&&unit==='main'))next.today=updated;tx.set(ref,next)});dialog.close();captured=null;
 }catch(e){error.textContent=e.message||'Could not save wrap';console.error('Watch wrap',e)}finally{submitting=false;btn.disabled=false}
});
setInterval(()=>{const clock=document.querySelector('#live-clock');if(clock&&!dialog.open)clock.textContent=nowClock()},1000);
