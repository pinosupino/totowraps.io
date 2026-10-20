import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {getFirestore,doc,onSnapshot} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
const firebaseConfig = {
  apiKey: "AIzaSyAQaBZqR3pgplwryS1qQwSUT29dPZ3crMM",
  authDomain: "totowrap-749d3.firebaseapp.com",
  projectId: "totowrap-749d3",
  storageBucket: "totowrap-749d3.firebasestorage.app",
  messagingSenderId: "920889634224",
  appId: "1:920889634224:web:d2952fe6680bba9c477a75"
};
const db=getFirestore(initializeApp(firebaseConfig));
let state=null,tab='today';const content=document.querySelector('#content');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=v=>/^\d{1,2}:\d{2}/.test(String(v||''))?String(v):'--:--';
const day=()=>{const unit=state?.activeUnit||'main';return state?.liveGames?.[unit]||state?.today||null};
const roster=()=>Array.isArray(state?.playerRoster)?state.playerRoster:[];
const guesses=()=>Array.isArray(day()?.guesses)?day().guesses.filter(x=>x?.time):[];
const sortTime=(a,b)=>String(a.time).localeCompare(String(b.time));
function render(){if(!state){content.innerHTML='<p class="empty">Waiting for live data…</p>';return}const d=day();if(tab==='today'){
 const names=Array.isArray(d?.winners)?d.winners.map(w=>typeof w==='string'?w:w?.name).filter(Boolean):d?.winner?[d.winner]:[];
 const done=Boolean(d?.wrapTime);content.innerHTML=`<div class="hero"><div class="eyebrow">${done?'OFFICIAL RESULT':'LIVE · TODAY'}</div><div class="big">${esc(done?(names.length?names.join(' & '):'WRAPPED'):time(d?.estWrap))}</div><div class="sub">${esc(done?'Wrap '+time(d.wrapTime):d?'Estimated wrap':'No active game')}</div></div><div class="meta"><div class="tile"><span>PLAYERS</span><strong>${roster().length}</strong></div><div class="tile"><span>BETS</span><strong>${guesses().length}</strong></div></div>`;
}else if(tab==='bets'){const bets=guesses().sort(sortTime);content.innerHTML='<div class="eyebrow">TODAY’S BETS</div>'+(bets.length?`<div class="list">${bets.map(g=>`<div class="entry"><span>${esc(g.name)}</span><strong>${esc(g.time)}</strong></div>`).join('')}</div>`:'<p class="empty">No bets yet.</p>');
}else{const scores=state?.scores||{};const people=roster().map(p=>({name:p.name,score:Number(scores[p.name])||0})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));content.innerHTML='<div class="eyebrow">LEADERBOARD</div>'+(people.length?`<div class="list">${people.map((p,i)=>`<div class="entry"><span>${i+1}. ${esc(p.name)}</span><strong>${p.score} PT</strong></div>`).join('')}</div>`:'<p class="empty">No players yet.</p>')}
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));render()}));
onSnapshot(doc(db,'totowrap','state'),snap=>{state=snap.exists()?snap.data():{};document.querySelector('#connection').textContent='● LIVE';render()},err=>{document.querySelector('#connection').textContent='OFFLINE';content.innerHTML='<p class="empty">Unable to load live data. Check your connection and retry.</p>';console.error('Watch Firebase',err)});
