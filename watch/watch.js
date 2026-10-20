import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {getFirestore,doc,onSnapshot} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
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
loginToggle.addEventListener('click',()=>{if(admin){wrapPanel.hidden=!wrapPanel.hidden}else{loginPanel.hidden=!loginPanel.hidden}});
document.querySelector('#login-form').addEventListener('submit',async e=>{e.preventDefault();authMessage.textContent='Signing in…';try{await signInWithEmailAndPassword(auth,document.querySelector('#admin-email').value.trim(),document.querySelector('#admin-password').value);document.querySelector('#admin-password').value=''}catch(err){authMessage.textContent='Login failed: '+(err.code||'check credentials')}});
document.querySelector('#logout').addEventListener('click',()=>signOut(auth));
onAuthStateChanged(auth,user=>{admin=Boolean(user&&user.email?.toLowerCase()==='edgaleone@gmail.com');loginToggle.textContent=admin?'ADMIN ✓':'LOGIN';loginPanel.hidden=true;wrapPanel.hidden=!admin;if(user&&!admin){authMessage.textContent='This account is not an authorized admin';loginPanel.hidden=false}});
let state=null,tab='today';const content=document.querySelector('#content');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=v=>/^\d{1,2}:\d{2}/.test(String(v||''))?String(v):'--:--';
const day=()=>{const unit=state?.activeUnit||'main';return state?.liveGames?.[unit]||state?.today||null};
const roster=()=>Array.isArray(state?.playerRoster)?state.playerRoster:[];
const guesses=()=>Array.isArray(day()?.guesses)?day().guesses.filter(x=>x?.time):[];
const sortTime=(a,b)=>String(a.time).localeCompare(String(b.time));
function render(){if(!state){content.innerHTML='<p class="empty">Waiting for live data…</p>';return}const d=day();if(tab==='today'){
 const names=Array.isArray(d?.winners)?d.winners.map(w=>typeof w==='string'?w:w?.name).filter(Boolean):d?.winner?[d.winner]:[];
 const done=Boolean(d?.wrapTime);if(!d || (!done && !d?.estWrap && !guesses().length)){content.innerHTML='<div class="hero no-game"><div class="big">No active game yet</div></div>';return}content.innerHTML=`<div class="hero"><div class="eyebrow">${done?'OFFICIAL RESULT':'LIVE · TODAY'}</div><div class="big">${esc(done?(names.length?names.join(' & '):'WRAPPED'):time(d?.estWrap))}</div><div class="sub">${esc(done?'Wrap '+time(d.wrapTime):d?'Estimated wrap':'No active game')}</div></div>`;
}else if(tab==='bets'){const bets=guesses().sort(sortTime);content.innerHTML='<div class="eyebrow">TODAY’S BETS</div>'+(bets.length?`<div class="list">${bets.map(g=>`<div class="entry"><span>${esc(g.name)}</span><strong>${esc(g.time)}</strong></div>`).join('')}</div>`:'<p class="empty">No bets yet.</p>');
}else{const scores=state?.scores||{};const people=roster().map(p=>({name:p.name,score:Number(scores[p.name])||0})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));content.innerHTML='<div class="eyebrow">LEADERBOARD</div>'+(people.length?`<div class="list">${people.map((p,i)=>`<div class="entry"><span>${i+1}. ${esc(p.name)}</span><strong>${p.score} PT</strong></div>`).join('')}</div>`:'<p class="empty">No players yet.</p>')}
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));render()}));
onSnapshot(doc(db,'totowrap','state'),snap=>{state=snap.exists()?snap.data():{};document.querySelector('#connection').textContent='● LIVE';render()},err=>{document.querySelector('#connection').textContent='OFFLINE';content.innerHTML='<p class="empty">Unable to load live data. Check your connection and retry.</p>';console.error('Watch Firebase',err)});
