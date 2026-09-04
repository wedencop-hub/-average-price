const SUPABASE_URL='https://usggjqukcqzttrilgmmo.supabase.co';
const SUPABASE_KEY='sb_publishable_g3Hi1tMxV4sV5bYXBpijBA_nHFd0zxA';
const API=`${SUPABASE_URL}/rest/v1`;
const RPC=`${API}/rpc`;
const PRICE_API=`${SUPABASE_URL}/functions/v1/price-api`;
const ADMIN_ID='1454798203';
const tg=window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand();}
const telegramUserId=tg?.initDataUnsafe?.user?.id?String(tg.initDataUnsafe.user.id):'';
const visitorId=telegramUserId||localStorage.getItem('averagePriceVisitorId')||crypto.randomUUID();
localStorage.setItem('averagePriceVisitorId',visitorId);
const isAdmin=telegramUserId===ADMIN_ID;

const prices=document.querySelector('#prices');
const search=document.querySelector('#search');
const modal=document.querySelector('#modal');
const statusBox=document.querySelector('#dbStatus');
const adminPanel=document.querySelector('#adminPanel');
const adminBtn=document.querySelector('#adminBtn');
let items=[];
let myPrices=JSON.parse(localStorage.getItem('myPriceVotes')||'{}');

function money(n){return new Intl.NumberFormat('uk-UA').format(Math.round(Number(n)||0))}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function setStatus(text,ok){statusBox.innerHTML=`<strong>${ok?'Спільна база':'Підключення'}</strong><span>${esc(text)}</span>`;statusBox.classList.toggle('ok',!!ok)}
async function rpc(name,body){const r=await fetch(`${RPC}/${name}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw new Error(t||`HTTP ${r.status}`);return t?JSON.parse(t):null}
async function priceApi(action,body={}){const r=await fetch(PRICE_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...body,p_telegram_user_id:visitorId,initData:tg?.initData||''})});const t=await r.text();if(!r.ok)throw new Error(t||`HTTP ${r.status}`);return t?JSON.parse(t):null}

async function loadItems(){
  setStatus('Завантаження спільної бази…',false);
  try{
    const data=await priceApi('list');
    items=(data.items||[]).map(x=>({...x,average_price:Number(x.average_price)||0,votes_count:Number(x.votes_count)||0,my_price:Number(x.my_price)||0}));
    for(const x of items) if(x.my_price>0) myPrices[x.id]=x.my_price;
    localStorage.setItem('myPriceVotes',JSON.stringify(myPrices));
    setStatus('Спільна база підключена',true);render();
  }catch(e){console.error(e);setStatus('Помилка підключення до бази. Перезавантажте сторінку.',false)}
}

function render(){
  const q=search.value.trim().toLowerCase();
  const list=items.filter(x=>String(x.name).toLowerCase().includes(q)||String(x.category||'').toLowerCase().includes(q));
  prices.innerHTML='';document.querySelector('#empty').classList.toggle('hidden',list.length>0);
  for(const x of list){
    const mine=Number.isFinite(myPrices[x.id])?Number(myPrices[x.id]):null;
    const value=mine??0,avg=x.average_price||0,max=5000,pct=avg>0?Math.max(1,Math.min(100,avg/max*100)):0;
    const meta=[x.category,x.unit].filter(Boolean).join(' · ');
    const el=document.createElement('article');el.className='card';
    el.innerHTML=`<div class="cardHead"><div><h2>${esc(x.name)}</h2>${meta?`<div class="meta">${esc(meta)}</div>`:''}</div><span class="votes">${x.votes_count||0} голосів</span></div>
      <div class="stats"><div><div class="label">Ваша ціна</div><div class="value" data-my-value="${x.id}">${mine==null?'—':money(mine)+' грн'}</div></div><div><div class="label">Середня ціна</div><div class="value">${x.votes_count?money(avg)+' грн':'—'}</div></div></div>
      <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
      <div class="sliderRow"><span>0</span><input class="priceSlider" data-id="${x.id}" type="range" min="0" max="5000" step="10" value="${value}"><span>5000</span></div>
      <div class="sliderCurrent"><span>Ваша ціна</span><b data-slider-value="${x.id}">${value===0?'Не враховується':money(value)+' грн'}</b></div>
      <div class="cardActions"><button data-id="${x.id}" data-action="lower">− 10 грн</button><button data-id="${x.id}" data-action="higher">+ 10 грн</button></div>`;
    prices.appendChild(el);
  }
}

async function savePrice(itemId,next){
  next=Math.max(0,Math.min(5000,Math.round(Number(next)/10)*10));
  try{
    await priceApi('vote',{itemId,price:next});
    if(next===0) delete myPrices[itemId]; else myPrices[itemId]=next;
    localStorage.setItem('myPriceVotes',JSON.stringify(myPrices));
    await loadItems();
  }catch(err){console.error(err);setStatus('Не вдалося зберегти ціну. Спробуйте ще раз.',false)}
}

prices.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const id=b.dataset.id,item=items.find(x=>x.id===id);if(!item)return;
  const current=Number.isFinite(myPrices[id])?Number(myPrices[id]):0;
  savePrice(id,current+(b.dataset.action==='higher'?10:-10));
});
prices.addEventListener('input',e=>{
  const s=e.target.closest('.priceSlider');if(!s)return;
  const id=s.dataset.id,value=Number(s.value),card=s.closest('.card');
  card.querySelector(`[data-slider-value="${id}"]`).textContent=value===0?'Не враховується':`${money(value)} грн`;
  card.querySelector(`[data-my-value="${id}"]`).textContent=value===0?'—':`${money(value)} грн`;
});
prices.addEventListener('change',e=>{const s=e.target.closest('.priceSlider');if(s)savePrice(s.dataset.id,Number(s.value))});

// New position suggestion: name + initial price. The backend also notifies the administrator in Telegram.
document.querySelector('#addBtn').onclick=()=>modal.showModal();
document.querySelector('#suggestForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=document.querySelector('#suggestName').value.trim();
  const price=Number(document.querySelector('#suggestPrice').value);
  if(name.length<2||!Number.isInteger(price)||price<10||price>5000||price%10!==0)return;
  const btn=e.target.querySelector('.primary');btn.disabled=true;
  try{await priceApi('suggest',{text:name,price});e.target.reset();modal.close();setStatus('Заявку відправлено адміністратору. Ви одразу вказали свою ціну.',true)}
  catch(err){console.error(err);setStatus('Не вдалося відправити заявку. Спробуйте ще раз.',false)}
  finally{btn.disabled=false}
});

function showAdmin(){adminPanel.classList.remove('hidden');loadAdminSuggestions();loadAdminItems();adminPanel.scrollIntoView({behavior:'smooth',block:'start'})}
if(isAdmin){adminBtn.classList.remove('hidden');adminBtn.onclick=showAdmin}

async function loadAdminSuggestions(){
  if(!isAdmin)return;
  const list=document.querySelector('#adminList'),empty=document.querySelector('#adminEmpty');
  try{
    const data=await rpc('admin_list_price_suggestions',{p_admin_code:ADMIN_ID});
    list.innerHTML='';empty.classList.toggle('hidden',!!data?.length);
    (data||[]).forEach(s=>{const el=document.createElement('div');el.className='request';el.innerHTML=`<div><b>${esc(s.text)}</b><div class="requestMeta">Заявка · ${new Date(s.created_at).toLocaleString('uk-UA')} · ${s.proposed_price?money(s.proposed_price)+' грн':''}</div></div><div class="requestActions"><button class="accept" data-id="${s.id}">Додати в прайс</button><button class="reject" data-id="${s.id}">Відхилити</button></div>`;list.appendChild(el)})
  }catch(err){console.error(err)}
}
async function loadAdminItems(){
  if(!isAdmin)return;
  const box=document.querySelector('#adminItems'),empty=document.querySelector('#adminItemsEmpty');
  try{
    const data=await rpc('admin_list_price_items',{p_admin_code:ADMIN_ID});
    box.innerHTML='';empty.classList.toggle('hidden',!!data?.length);
    (data||[]).forEach(x=>{const el=document.createElement('div');el.className='adminItem';el.innerHTML=`<div><b>${esc(x.name)}</b><span>${esc([x.category,x.unit].filter(Boolean).join(' · '))}</span></div><button class="deleteItem" data-id="${x.id}">Видалити</button>`;box.appendChild(el)})
  }catch(err){console.error(err);empty.classList.remove('hidden');empty.textContent='Не вдалося завантажити позиції.'}
}
document.querySelector('#adminRefresh').onclick=()=>{loadAdminSuggestions();loadAdminItems()};
document.querySelector('#adminList').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;try{if(b.classList.contains('accept'))await rpc('admin_accept_price_suggestion',{p_admin_code:ADMIN_ID,p_suggestion_id:b.dataset.id});else await rpc('admin_reject_price_suggestion',{p_admin_code:ADMIN_ID,p_suggestion_id:b.dataset.id});await loadAdminSuggestions();await loadItems();await loadAdminItems()}catch(err){console.error(err);alert('Не вдалося виконати дію.')}});
document.querySelector('#adminItems').addEventListener('click',async e=>{const b=e.target.closest('.deleteItem');if(!b)return;if(!confirm('Видалити цю позицію з прайсу? Вона зникне для всіх учасників.'))return;try{await rpc('admin_delete_price_item',{p_admin_code:ADMIN_ID,p_item_id:b.dataset.id});await loadItems();await loadAdminItems()}catch(err){console.error(err);alert('Не вдалося видалити позицію.')}});
document.querySelector('#adminAddBtn').onclick=async()=>{const name=document.querySelector('#adminName').value.trim();if(name.length<2)return;try{await rpc('admin_add_price_item',{p_admin_code:ADMIN_ID,p_name:name,p_category:document.querySelector('#adminCategory').value.trim()||null,p_unit:document.querySelector('#adminUnit').value.trim()||null});document.querySelector('#adminName').value='';document.querySelector('#adminCategory').value='';document.querySelector('#adminUnit').value='';await loadItems();await loadAdminItems()}catch(err){console.error(err);alert('Не вдалося додати позицію.')}};

search.addEventListener('input',render);
loadItems();
