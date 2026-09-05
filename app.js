const SUPABASE_URL='https://usggjqukcqzttrilgmmo.supabase.co';
const SUPABASE_KEY='sb_publishable_g3Hi1tMxV4sV5bYXBpijBA_nHFd0zxA';
const ADMIN_ID='1454798203';

const tg=window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand();}

const {createClient}=window.supabase;
const db=createClient(SUPABASE_URL,SUPABASE_KEY);

const telegramUserId=tg?.initDataUnsafe?.user?.id?String(tg.initDataUnsafe.user.id):'';
const visitorId=telegramUserId||localStorage.getItem('averagePriceVisitorId')||crypto.randomUUID();
if(!telegramUserId)localStorage.setItem('averagePriceVisitorId',visitorId);
const isAdmin=telegramUserId===ADMIN_ID;

let items=[];
let myPrices={};

const prices=document.querySelector('#prices');
const search=document.querySelector('#search');
const modal=document.querySelector('#modal');
const statusBox=document.querySelector('#dbStatus');
const adminPanel=document.querySelector('#adminPanel');
const adminBtn=document.querySelector('#adminBtn');

function money(n){return new Intl.NumberFormat('uk-UA').format(Math.round(Number(n)||0))}
function esc(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function setStatus(text,ok=true){statusBox.innerHTML=`<strong>${ok?'Збереження':'Увага'}</strong><span>${esc(text)}</span>`;statusBox.classList.toggle('ok',!!ok)}
function setBusy(text='Завантаження…'){statusBox.innerHTML=`<strong>Збереження</strong><span>${esc(text)}</span>`;statusBox.classList.remove('ok')}

function stats(item){
  const mine=Number(item.my_price);
  const hasMine=Number.isFinite(mine)&&mine>0;
  return {
    mine:hasMine?mine:null,
    votes:Number(item.votes_count)||0,
    avg:Number(item.average_price)||0
  };
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

async function loadPrices(){
  setBusy('Завантаження спільного прайсу…');
  const {data,error}=await db.rpc('get_price_list',{p_telegram_user_id:visitorId});
  if(error){console.error(error);setStatus('Не вдалося завантажити дані з бази.',false);return false;}
  items=(data||[]).map(x=>({...x}));
  myPrices={};
  items.forEach(x=>{if(Number(x.my_price)>0)myPrices[x.id]=Number(x.my_price)});
  render();
  setStatus('Дані синхронізовано зі спільною базою.');
  return true;
}

async function savePrice(itemId,next){
  next=Math.max(0,Math.min(5000,Math.round(Number(next)/10)*10));
  setBusy('Збереження вашої ціни…');
  const {error}=await db.rpc('submit_price_vote',{
    p_item_id:itemId,
    p_telegram_user_id:visitorId,
    p_price:next
  });
  if(error){console.error(error);setStatus('Не вдалося зберегти ціну.',false);return;}
  const item=items.find(x=>x.id===itemId);
  if(item){item.my_price=next;}
  if(next===0)delete myPrices[itemId];else myPrices[itemId]=next;
  await loadPrices();
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

// New position suggestion is stored in the shared Supabase database.
document.querySelector('#addBtn').onclick=()=>modal.showModal();
document.querySelector('#suggestForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=document.querySelector('#suggestName').value.trim();
  const price=Number(document.querySelector('#suggestPrice').value);
  if(name.length<2||!Number.isInteger(price)||price<10||price>5000||price%10!==0)return;
  setBusy('Відправлення заявки…');
  const {error}=await db.rpc('submit_price_suggestion',{
    p_text:name,
    p_telegram_user_id:visitorId,
    p_proposed_price:price
  });
  if(error){console.error(error);setStatus('Не вдалося відправити заявку.',false);return;}
  e.target.reset();modal.close();
  setStatus('Заявку збережено. Після перевірки адміністратора позиція зʼявиться у прайсі.');
  if(isAdmin)loadAdminSuggestions();
});

function showAdmin(){adminPanel.classList.remove('hidden');loadAdminSuggestions();loadAdminItems();adminPanel.scrollIntoView({behavior:'smooth',block:'start'})}
if(isAdmin){adminBtn.classList.remove('hidden');adminBtn.onclick=showAdmin}

async function loadAdminSuggestions(){
  if(!isAdmin)return;
  const list=document.querySelector('#adminList'),empty=document.querySelector('#adminEmpty');
  const {data,error}=await db.rpc('admin_list_price_suggestions',{p_admin_code:telegramUserId});
  if(error){console.error(error);list.innerHTML='';empty.classList.remove('hidden');empty.textContent='Не вдалося завантажити заявки.';return;}
  const pending=data||[];
  list.innerHTML='';empty.classList.toggle('hidden',pending.length>0);empty.textContent='Нових заявок немає.';
  pending.forEach(s=>{const el=document.createElement('div');el.className='request';el.innerHTML=`<div><b>${esc(s.text)}</b><div class="requestMeta">Заявка · ${new Date(s.created_at).toLocaleString('uk-UA')} · ${s.proposed_price?money(s.proposed_price)+' грн':'без ціни'}</div></div><div class="requestActions"><button class="accept" data-id="${s.id}">Додати в прайс</button><button class="reject" data-id="${s.id}">Відхилити</button></div>`;list.appendChild(el)})
}

async function loadAdminItems(){
  if(!isAdmin)return;
  const box=document.querySelector('#adminItems'),empty=document.querySelector('#adminItemsEmpty');
  const {data,error}=await db.rpc('admin_list_price_items',{p_admin_code:telegramUserId});
  if(error){console.error(error);box.innerHTML='';empty.classList.remove('hidden');empty.textContent='Не вдалося завантажити позиції.';return;}
  const rows=data||[];
  box.innerHTML='';empty.classList.toggle('hidden',rows.length>0);empty.textContent='Позицій немає.';
  rows.forEach(x=>{const el=document.createElement('div');el.className='adminItem';el.innerHTML=`<div><b>${esc(x.name)}</b><span>${esc([x.category,x.unit].filter(Boolean).join(' · '))}</span></div><button class="deleteItem" data-id="${x.id}">Видалити</button>`;box.appendChild(el)})
}

document.querySelector('#adminRefresh').onclick=async()=>{setBusy('Оновлення…');await Promise.all([loadPrices(),loadAdminSuggestions(),loadAdminItems()]);};

document.querySelector('#adminList').addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  const id=b.dataset.id;if(!id)return;
  setBusy('Обробка заявки…');
  let error=null;
  if(b.classList.contains('accept')){
    ({error}=await db.rpc('admin_accept_price_suggestion',{p_admin_code:telegramUserId,p_suggestion_id:id}));
  }else if(b.classList.contains('reject')){
    ({error}=await db.rpc('admin_reject_price_suggestion',{p_admin_code:telegramUserId,p_suggestion_id:id}));
  }
  if(error){console.error(error);setStatus('Не вдалося обробити заявку.',false);return;}
  await Promise.all([loadPrices(),loadAdminSuggestions(),loadAdminItems()]);
  setStatus('Зміни збережено у спільній базі.');
});

document.querySelector('#adminItems').addEventListener('click',async e=>{
  const b=e.target.closest('.deleteItem');if(!b)return;
  if(!confirm('Видалити цю позицію з прайсу?'))return;
  setBusy('Видалення позиції…');
  const {error}=await db.rpc('admin_delete_price_item',{p_admin_code:telegramUserId,p_item_id:b.dataset.id});
  if(error){console.error(error);setStatus('Не вдалося видалити позицію.',false);return;}
  await Promise.all([loadPrices(),loadAdminItems()]);
  setStatus('Позицію видалено зі спільного прайсу.');
});

document.querySelector('#adminAddBtn').onclick=async()=>{
  const name=document.querySelector('#adminName').value.trim();if(name.length<2)return;
  setBusy('Додавання позиції…');
  const {error}=await db.rpc('admin_add_price_item',{
    p_admin_code:telegramUserId,
    p_name:name,
    p_category:document.querySelector('#adminCategory').value.trim()||null,
    p_unit:document.querySelector('#adminUnit').value.trim()||null
  });
  if(error){console.error(error);setStatus('Не вдалося додати позицію.',false);return;}
  document.querySelector('#adminName').value='';document.querySelector('#adminCategory').value='';document.querySelector('#adminUnit').value='';
  await Promise.all([loadPrices(),loadAdminItems()]);
  setStatus('Позицію додано у спільний прайс.');
};

search.addEventListener('input',render);
loadPrices();
