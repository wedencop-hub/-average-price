const ADMIN_ID='1454798203';
const tg=window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand();}

// GitHub Pages-only version: all runtime data is stored in this browser's localStorage.
const telegramUserId=tg?.initDataUnsafe?.user?.id?String(tg.initDataUnsafe.user.id):'';
const visitorId=telegramUserId||localStorage.getItem('averagePriceVisitorId')||crypto.randomUUID();
localStorage.setItem('averagePriceVisitorId',visitorId);
const isAdmin=telegramUserId===ADMIN_ID;

const ITEMS_KEY='averagePriceItemsV2';
const VOTES_KEY='averagePriceMyVotesV2';
const SUGGESTIONS_KEY='averagePriceSuggestionsV2';

const seed=[
  {id:'msd-320',name:'Плівка MSD 3.20 м',category:'Полотно',unit:'м²',baseAvg:1340,baseVotes:42},
  {id:'msd-500',name:'Плівка MSD 5.00 м',category:'Полотно',unit:'м²',baseAvg:1720,baseVotes:37},
  {id:'pvc-wall',name:'Профіль ПВХ стіна',category:'Профіль',unit:'м.п.',baseAvg:98,baseVotes:31},
  {id:'shadow',name:'Тіньовий профіль',category:'Профіль',unit:'м.п.',baseAvg:195,baseVotes:24},
  {id:'lamp-platform',name:'Платформа під люстру',category:'Комплектуючі',unit:'шт.',baseAvg:135,baseVotes:18}
];

function read(key,fallback){try{const x=JSON.parse(localStorage.getItem(key));return x??fallback}catch{return fallback}}
function write(key,value){localStorage.setItem(key,JSON.stringify(value))}
let items=read(ITEMS_KEY,null);
if(!Array.isArray(items)){items=seed;write(ITEMS_KEY,items)}
let myPrices=read(VOTES_KEY,{});
let suggestions=read(SUGGESTIONS_KEY,[]);

const prices=document.querySelector('#prices');
const search=document.querySelector('#search');
const modal=document.querySelector('#modal');
const statusBox=document.querySelector('#dbStatus');
const adminPanel=document.querySelector('#adminPanel');
const adminBtn=document.querySelector('#adminBtn');

function money(n){return new Intl.NumberFormat('uk-UA').format(Math.round(Number(n)||0))}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function setStatus(text,ok=true){statusBox.innerHTML=`<strong>${ok?'Збережено на пристрої':'Увага'}</strong><span>${esc(text)}</span>`;statusBox.classList.toggle('ok',!!ok)}
function uid(prefix='id'){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
function stats(item){
  const mine=Number(myPrices[item.id]);
  const hasMine=Number.isFinite(mine)&&mine>0;
  const n=Number(item.baseVotes)||0;
  const sum=(Number(item.baseAvg)||0)*n;
  return {mine:hasMine?mine:null,votes:n+(hasMine?1:0),avg:(sum+(hasMine?mine:0))/(n+(hasMine?1:0)||1)};
}

function render(){
  const q=search.value.trim().toLowerCase();
  const list=items.filter(x=>String(x.name).toLowerCase().includes(q)||String(x.category||'').toLowerCase().includes(q));
  prices.innerHTML='';
  document.querySelector('#empty').classList.toggle('hidden',list.length>0);
  for(const x of list){
    const s=stats(x),value=s.mine??0,max=5000,pct=s.votes?Math.max(1,Math.min(100,s.avg/max*100)):0;
    const meta=[x.category,x.unit].filter(Boolean).join(' · ');
    const el=document.createElement('article');el.className='card';
    el.innerHTML=`<div class="cardHead"><div><h2>${esc(x.name)}</h2>${meta?`<div class="meta">${esc(meta)}</div>`:''}</div><span class="votes">${s.votes} голосів</span></div>
      <div class="stats"><div><div class="label">Ваша ціна</div><div class="value" data-my-value="${x.id}">${s.mine==null?'—':money(s.mine)+' грн'}</div></div><div><div class="label">Середня ціна</div><div class="value">${s.votes?money(s.avg)+' грн':'—'}</div></div></div>
      <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
      <div class="sliderRow"><span>0</span><input class="priceSlider" data-id="${x.id}" type="range" min="0" max="5000" step="10" value="${value}"><span>5000</span></div>
      <div class="sliderCurrent"><span>Ваша ціна</span><b data-slider-value="${x.id}">${value===0?'Не враховується':money(value)+' грн'}</b></div>
      <div class="cardActions"><button data-id="${x.id}" data-action="lower">− 10 грн</button><button data-id="${x.id}" data-action="higher">+ 10 грн</button></div>`;
    prices.appendChild(el);
  }
}

function savePrice(itemId,next){
  next=Math.max(0,Math.min(5000,Math.round(Number(next)/10)*10));
  if(next===0) delete myPrices[itemId];
  else myPrices[itemId]=next;
  write(VOTES_KEY,myPrices);
  render();
  setStatus(next===0?'Ціна прибрана з голосування.':'Вашу ціну збережено.');
}

prices.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const id=b.dataset.id;if(!items.some(x=>x.id===id))return;
  const current=Number(myPrices[id])||0;
  savePrice(id,current+(b.dataset.action==='higher'?10:-10));
});
prices.addEventListener('input',e=>{
  const s=e.target.closest('.priceSlider');if(!s)return;
  const id=s.dataset.id,value=Number(s.value),card=s.closest('.card');
  card.querySelector(`[data-slider-value="${id}"]`).textContent=value===0?'Не враховується':`${money(value)} грн`;
  card.querySelector(`[data-my-value="${id}"]`).textContent=value===0?'—':`${money(value)} грн`;
});
prices.addEventListener('change',e=>{const s=e.target.closest('.priceSlider');if(s)savePrice(s.dataset.id,Number(s.value))});

// Suggestion: saved locally. The initial price becomes the user's first vote when accepted locally by admin.
document.querySelector('#addBtn').onclick=()=>modal.showModal();
document.querySelector('#suggestForm').addEventListener('submit',e=>{
  e.preventDefault();
  const name=document.querySelector('#suggestName').value.trim();
  const price=Number(document.querySelector('#suggestPrice').value);
  if(name.length<2||!Number.isInteger(price)||price<10||price>5000||price%10!==0)return;
  suggestions.unshift({id:uid('suggestion'),text:name,proposed_price:price,visitorId,created_at:new Date().toISOString(),status:'pending'});
  write(SUGGESTIONS_KEY,suggestions);
  e.target.reset();modal.close();
  setStatus('Заявку збережено на цьому пристрої.');
  if(isAdmin)loadAdminSuggestions();
});

function showAdmin(){adminPanel.classList.remove('hidden');loadAdminSuggestions();loadAdminItems();adminPanel.scrollIntoView({behavior:'smooth',block:'start'})}
if(isAdmin){adminBtn.classList.remove('hidden');adminBtn.onclick=showAdmin}

function loadAdminSuggestions(){
  if(!isAdmin)return;
  const list=document.querySelector('#adminList'),empty=document.querySelector('#adminEmpty');
  const pending=suggestions.filter(s=>s.status==='pending');
  list.innerHTML='';empty.classList.toggle('hidden',pending.length>0);
  pending.forEach(s=>{const el=document.createElement('div');el.className='request';el.innerHTML=`<div><b>${esc(s.text)}</b><div class="requestMeta">Заявка · ${new Date(s.created_at).toLocaleString('uk-UA')} · ${money(s.proposed_price)} грн</div></div><div class="requestActions"><button class="accept" data-id="${s.id}">Додати в прайс</button><button class="reject" data-id="${s.id}">Відхилити</button></div>`;list.appendChild(el)})
}
function loadAdminItems(){
  if(!isAdmin)return;
  const box=document.querySelector('#adminItems'),empty=document.querySelector('#adminItemsEmpty');
  box.innerHTML='';empty.classList.toggle('hidden',items.length>0);
  items.forEach(x=>{const el=document.createElement('div');el.className='adminItem';el.innerHTML=`<div><b>${esc(x.name)}</b><span>${esc([x.category,x.unit].filter(Boolean).join(' · '))}</span></div><button class="deleteItem" data-id="${x.id}">Видалити</button>`;box.appendChild(el)})
}
document.querySelector('#adminRefresh').onclick=()=>{loadAdminSuggestions();loadAdminItems()};
document.querySelector('#adminList').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const s=suggestions.find(x=>x.id===b.dataset.id);if(!s)return;
  if(b.classList.contains('accept')){
    const id=uid('item');
    items.push({id,name:s.text,category:'',unit:'',baseAvg:0,baseVotes:0});
    // If the admin is accepting their own submitted item, its proposed price is immediately their vote.
    if(s.visitorId===visitorId&&s.proposed_price>0)myPrices[id]=s.proposed_price;
    s.status='accepted';write(ITEMS_KEY,items);write(VOTES_KEY,myPrices);
  }else{s.status='rejected'}
  write(SUGGESTIONS_KEY,suggestions);loadAdminSuggestions();loadAdminItems();render();
});
document.querySelector('#adminItems').addEventListener('click',e=>{
  const b=e.target.closest('.deleteItem');if(!b)return;
  if(!confirm('Видалити цю позицію з прайсу?'))return;
  items=items.filter(x=>x.id!==b.dataset.id);delete myPrices[b.dataset.id];
  write(ITEMS_KEY,items);write(VOTES_KEY,myPrices);loadAdminItems();render();
});
document.querySelector('#adminAddBtn').onclick=()=>{
  const name=document.querySelector('#adminName').value.trim();if(name.length<2)return;
  items.push({id:uid('item'),name,category:document.querySelector('#adminCategory').value.trim(),unit:document.querySelector('#adminUnit').value.trim(),baseAvg:0,baseVotes:0});
  write(ITEMS_KEY,items);document.querySelector('#adminName').value='';document.querySelector('#adminCategory').value='';document.querySelector('#adminUnit').value='';loadAdminItems();render();
};

search.addEventListener('input',render);
setStatus('Дані працюють без Supabase — зберігаються в памʼяті браузера.');
render();
