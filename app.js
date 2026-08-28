const SUPABASE_URL='https://usggjqukcqzttrilgmmo.supabase.co';
const SUPABASE_KEY='sb_publishable_g3Hi1tMxV4sV5bYXBpijBA_nHFd0zxA';
const API=`${SUPABASE_URL}/rest/v1`;

const prices=document.querySelector('#prices');
const search=document.querySelector('#search');
const modal=document.querySelector('#modal');
const statusBox=document.querySelector('#dbStatus');

let items=[];
let myPrices=JSON.parse(localStorage.getItem('myPriceVotes')||'{}');
const visitorId=localStorage.getItem('averagePriceVisitorId')||makeVisitorId();
localStorage.setItem('averagePriceVisitorId',visitorId);

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
  if(!res.ok){let text=await res.text();throw new Error(text||`HTTP ${res.status}`)}
  const text=await res.text();
  return text?JSON.parse(text):null;
}

async function loadItems(){
  setStatus('Завантаження спільної бази…',false);
  const data=await api('price_item_stats?select=id,name,category,unit,is_active,average_price,votes_count&is_active=eq.true&order=name.asc');
  items=data||[];
  setStatus('Спільна база підключена',true);
  render();
}

function setStatus(text,ok){
  if(!statusBox)return;
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
    const base=mine??x.average_price??0;
    const max=Math.max(500,base*3,x.average_price*3,500);
    const pct=Math.max(4,Math.min(100,(x.average_price/max)*100));
    const el=document.createElement('article');
    el.className='card';
    el.innerHTML=`<div class="cardHead"><h2>${esc(x.name)}</h2><span class="votes">${x.votes_count||0} голосів</span></div><div class="stats"><div><div class="label">Ваша ціна</div><div class="value">${mine==null?'—':money(mine)}</div></div><div><div class="label">Середня ціна</div><div class="value">${x.votes_count?money(x.average_price):'—'}</div></div></div><div class="bar"><div class="fill" style="width:${pct}%"></div></div><div class="cardActions"><button data-id="${x.id}" data-action="lower">− Моя ціна</button><button data-id="${x.id}" data-action="higher">+ Моя ціна</button></div>`;
    prices.appendChild(el);
  });
}

async function submitPrice(itemId,delta){
  const item=items.find(x=>x.id===itemId);if(!item)return;
  const current=Number.isFinite(myPrices[itemId])?myPrices[itemId]:(item.average_price||0);
  const next=Math.max(10,Math.min(5000,Math.round((current+delta)/10)*10));
  try{
    await api('price_votes?on_conflict=item_id%2Ctelegram_user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({item_id:itemId,telegram_user_id:visitorId,price:next,updated_at:new Date().toISOString()})});
    myPrices[itemId]=next;
    localStorage.setItem('myPriceVotes',JSON.stringify(myPrices));
    await loadItems();
  }catch(err){
    console.error(err);
    setStatus('Не вдалося зберегти ціну. Спробуйте ще раз.',false);
  }
}

document.querySelector('#addBtn').onclick=()=>modal.showModal();
document.querySelector('#priceForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=document.querySelector('#name').value.trim();
  const price=Number(document.querySelector('#price').value);
  if(!name||!price)return;
  try{
    const created=await api('price_items?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name,is_active:true})});
    const item=created?.[0];
    if(!item)throw new Error('Позицію не створено');
    await api('price_votes?on_conflict=item_id%2Ctelegram_user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({item_id:item.id,telegram_user_id:visitorId,price:Math.min(5000,Math.max(10,Math.round(price/10)*10)),updated_at:new Date().toISOString()})});
    myPrices[item.id]=Math.min(5000,Math.max(10,Math.round(price/10)*10));
    localStorage.setItem('myPriceVotes',JSON.stringify(myPrices));
    e.target.reset();modal.close();await loadItems();
  }catch(err){
    console.error(err);
    setStatus('Не вдалося додати позицію. Спробуйте ще раз.',false);
  }
});

search.addEventListener('input',render);
prices.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;submitPrice(b.dataset.id,b.dataset.action==='higher'?50:-50)});

loadItems().catch(err=>{console.error(err);setStatus('Помилка підключення до бази. Перезавантажте сторінку.',false)});
