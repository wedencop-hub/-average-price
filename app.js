const SUPABASE_URL='https://usggjqukcqzttrilgmmo.supabase.co';
// Current Supabase publishable key. It is intentionally public for browser use.
const SUPABASE_KEY=['sb_publishable_','g3Hi1tMxV4sV5bYXBp','ijBA_nHFd0zxA'].join('');
const API=`${SUPABASE_URL}/rest/v1`;
const RPC=`${SUPABASE_URL}/rest/v1/rpc`;

const prices=document.querySelector('#prices');
const search=document.querySelector('#search');
const modal=document.querySelector('#modal');
const statusBox=document.querySelector('#dbStatus');
const adminPanel=document.querySelector('#adminPanel');
const adminModal=document.querySelector('#adminModal');

let items=[];
let myPrices=JSON.parse(localStorage.getItem('myPriceVotes')||'{}');
const visitorId=localStorage.getItem('averagePriceVisitorId')||makeVisitorId();
localStorage.setItem('averagePriceVisitorId',visitorId);
let adminCode=sessionStorage.getItem('averagePriceAdminCode')||'';

function makeVisitorId(){
  const hex=crypto.randomUUID().replaceAll('-','');
  return (BigInt('0x'+hex)%9000000000000000000n+1n).toString();
}
function money(n){return new Intl.NumberFormat('uk-UA').format(Math.round(n))}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

async function api(path,options={}){
  const res=await fetch(`${API}/${path}`,{
    ...options,
    headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json',...(options.headers||{})}
  });
  if(!res.ok){const text=await res.text();throw new Error(text||`HTTP ${res.status}`)}
  const text=await res.text();
  return text?JSON.parse(text):null;
}
async function rpc(name,body){
  const res=await fetch(`${RPC}/${name}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!res.ok){const text=await res.text();throw new Error(text||`HTTP ${res.status}`)}
  const text=await res.text();return text?JSON.parse(text):null;
}

async function loadItems(){
  setStatus('Завантаження спільної бази…',false);
  const data=await api('price_item_stats?select=id,name,category,unit,is_active,average_price,votes_count&is_active=eq.true&order=name.asc');
  items=data||[];
  setStatus('Спільна база підключена',true);
  render();
}
function setStatus(text,ok){
  statusBox.innerHTML=`<strong>${ok?'Спільна база':'Підключення'}</strong><span>${esc(text)}</span>`;
  statusBox.classList.toggle('ok',!!ok);
}

function render(){
  const q=search.value.trim().toLowerCase();
  const list=items.filter(x=>x.name.toLowerCase().includes(q));
  prices.innerHTML='';
  document.querySelector('#empty').classList.toggle('hidden',list.length>0);
  list.forEach(x=>{
    const mine=Number.isFinite(myPrices[x.id])?myPrices[x.id]:null;
    const sliderValue=mine??x.average_price??10;
    const max=5000;
    const avg=x.average_price||0;
    const pct=Math.max(1,Math.min(100,(avg/max)*100));
    const el=document.createElement('article');
    el.className='card';
    el.innerHTML=`<div class="cardHead"><div><h2>${esc(x.name)}</h2>${x.category||x.unit?`<div class="meta">${esc([x.category,x.unit].filter(Boolean).join(' · '))}</div>`:''}</div><span class="votes">${x.votes_count||0} голосів</span></div>
      <div class="stats"><div><div class="label">Ваша ціна</div><div class="value" data-my-value="${x.id}">${mine==null?'—':money(mine)} грн</div></div><div><div class="label">Середня ціна</div><div class="value">${x.votes_count?money(avg)+' грн':'—'}</div></div></div>
      <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
      <div class="sliderRow"><span>10</span><input class="priceSlider" data-id="${x.id}" type="range" min="10" max="5000" step="10" value="${sliderValue}"><span>5000</span></div>
      <div class="sliderCurrent"><span>Ваша ціна</span><b data-slider-value="${x.id}">${money(sliderValue)} грн</b></div>
      <div class="cardActions"><button data-id="${x.id}" data-action="lower">− 10 грн</button><button data-id="${x.id}" data-action="higher">+ 10 грн</button></div>`;
    prices.appendChild(el);
  });
}

async function savePrice(itemId,next){
  next=Math.max(10,Math.min(5000,Math.round(Number(next)/10)*10));
  try{
    await api('price_votes?on_conflict=item_id%2Ctelegram_user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({item_id:itemId,telegram_user_id:visitorId,price:next,updated_at:new Date().toISOString()})});
    myPrices[itemId]=next;
    localStorage.setItem('myPriceVotes',JSON.stringify(myPrices));
    await loadItems();
  }catch(err){console.error(err);setStatus('Не вдалося зберегти ціну. Спробуйте ще раз.',false)}
}

prices.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const id=b.dataset.id;const item=items.find(x=>x.id===id);if(!item)return;
  const current=Number.isFinite(myPrices[id])?myPrices[id]:(item.average_price||10);
  savePrice(id,current+(b.dataset.action==='higher'?10:-10));
});
prices.addEventListener('input',e=>{
  const s=e.target.closest('.priceSlider');if(!s)return;
  const id=s.dataset.id;const value=Number(s.value);
  const card=s.closest('.card');
  card.querySelector(`[data-slider-value="${id}"]`).textContent=`${money(value)} грн`;
  card.querySelector(`[data-my-value="${id}"]`).textContent=`${money(value)} грн`;
});
prices.addEventListener('change',e=>{
  const s=e.target.closest('.priceSlider');if(!s)return;
  savePrice(s.dataset.id,Number(s.value));
});

document.querySelector('#addBtn').onclick=()=>modal.showModal();
document.querySelector('#suggestForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=document.querySelector('#suggestName').value.trim();
  if(name.length<2)return;
  try{
    await rpc('submit_price_suggestion',{p_text:name,p_telegram_user_id:visitorId});
    e.target.reset();modal.close();
    setStatus('Заявку відправлено адміністратору. Після перевірки позиція зʼявиться для голосування.',true);
  }catch(err){console.error(err);setStatus('Не вдалося відправити заявку. Спробуйте ще раз.',false)}
});

document.querySelector('#adminBtn').onclick=()=>{
  if(adminCode){adminPanel.classList.remove('hidden');loadAdminSuggestions();adminPanel.scrollIntoView({behavior:'smooth'});}
  else adminModal.showModal();
};
document.querySelector('#adminLoginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const code=document.querySelector('#adminCode').value.trim();
  try{
    await rpc('admin_list_price_suggestions',{p_admin_code:code});
    adminCode=code;sessionStorage.setItem('averagePriceAdminCode',code);adminModal.close();adminPanel.classList.remove('hidden');await loadAdminSuggestions();adminPanel.scrollIntoView({behavior:'smooth'});
  }catch(err){alert('Невірний код адміністратора');console.error(err)}
});
async function loadAdminSuggestions(){
  if(!adminCode)return;
  const list=document.querySelector('#adminList');
  const empty=document.querySelector('#adminEmpty');
  try{
    const data=await rpc('admin_list_price_suggestions',{p_admin_code:adminCode});
    list.innerHTML='';empty.classList.toggle('hidden',!!data?.length);
    (data||[]).forEach(s=>{
      const el=document.createElement('div');el.className='request';
      el.innerHTML=`<div><b>${esc(s.text)}</b><div class="requestMeta">Заявка · ${new Date(s.created_at).toLocaleString('uk-UA')}</div></div><div class="requestActions"><button class="accept" data-id="${s.id}">Додати в прайс</button><button class="reject" data-id="${s.id}">Відхилити</button></div>`;
      list.appendChild(el);
    });
  }catch(err){console.error(err);adminCode='';sessionStorage.removeItem('averagePriceAdminCode');adminPanel.classList.add('hidden');alert('Сесія адміністратора завершена.')}
}
document.querySelector('#adminRefresh').onclick=loadAdminSuggestions;
document.querySelector('#adminList').addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  try{
    if(b.classList.contains('accept')) await rpc('admin_accept_price_suggestion',{p_admin_code:adminCode,p_suggestion_id:b.dataset.id});
    else await rpc('admin_reject_price_suggestion',{p_admin_code:adminCode,p_suggestion_id:b.dataset.id});
    await loadAdminSuggestions();await loadItems();
  }catch(err){console.error(err);alert('Не вдалося виконати дію. Перевірте сесію адміністратора.')}
});
document.querySelector('#adminAddBtn').onclick=async()=>{
  const name=document.querySelector('#adminName').value.trim();if(name.length<2)return;
  try{
    await rpc('admin_add_price_item',{p_admin_code:adminCode,p_name:name,p_category:document.querySelector('#adminCategory').value.trim()||null,p_unit:document.querySelector('#adminUnit').value.trim()||null});
    document.querySelector('#adminName').value='';document.querySelector('#adminCategory').value='';document.querySelector('#adminUnit').value='';await loadItems();await loadAdminSuggestions();
  }catch(err){console.error(err);alert('Не вдалося додати позицію. Перевірте сесію адміністратора.')}
};

search.addEventListener('input',render);
loadItems().catch(err=>{console.error(err);setStatus('Помилка підключення до бази. Перезавантажте сторінку.',false)});
if(adminCode){adminPanel.classList.remove('hidden');loadAdminSuggestions();}
