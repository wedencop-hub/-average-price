const seed=[
 {name:'Плівка MSD 3.20 м',price:1280,avg:1340,votes:42,min:0,max:5000},
 {name:'Плівка MSD 5.00 м',price:1650,avg:1720,votes:37,min:0,max:5000},
 {name:'Профіль ПВХ стіна',price:92,avg:98,votes:31,min:0,max:300},
 {name:'Тіньовий профіль',price:180,avg:195,votes:24,min:0,max:500},
 {name:'Платформа під люстру',price:120,avg:135,votes:18,min:0,max:400}
];
let items=JSON.parse(localStorage.getItem('averagePriceItems')||'null')||seed;
const prices=document.querySelector('#prices');const search=document.querySelector('#search');const modal=document.querySelector('#modal');
function money(n){return new Intl.NumberFormat('uk-UA').format(Math.round(n))}
function render(){const q=search.value.trim().toLowerCase();const list=items.filter(x=>x.name.toLowerCase().includes(q));prices.innerHTML='';document.querySelector('#empty').classList.toggle('hidden',list.length>0);list.forEach((x,i)=>{const pct=Math.max(4,Math.min(100,x.avg/x.max*100));const el=document.createElement('article');el.className='card';el.innerHTML=`<div class="cardHead"><h2>${esc(x.name)}</h2><span class="votes">${x.votes} голосів</span></div><div class="stats"><div><div class="label">Ваша ціна</div><div class="value">${money(x.price)}</div></div><div><div class="label">Середня ціна</div><div class="value">${money(x.avg)}</div></div></div><div class="bar"><div class="fill" style="width:${pct}%"></div></div><div class="cardActions"><button data-i="${i}" data-action="lower">− Моя ціна</button><button data-i="${i}" data-action="higher">+ Моя ціна</button></div>`;prices.appendChild(el)})}
function esc(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
document.querySelector('#addBtn').onclick=()=>modal.showModal();document.querySelector('#priceForm').addEventListener('submit',e=>{e.preventDefault();const name=document.querySelector('#name').value.trim();const price=Number(document.querySelector('#price').value);if(!name||!price)return;items.unshift({name,price,avg:price,votes:1,min:0,max:Math.max(500,price*3)});localStorage.setItem('averagePriceItems',JSON.stringify(items));e.target.reset();modal.close();render()});search.addEventListener('input',render);prices.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const x=items[Number(b.dataset.i)];const old=x.votes;x.price=Math.max(1,x.price+(b.dataset.action==='higher'?50:-50));x.avg=Math.round((x.avg*old+x.price)/(old+1));x.votes=old+1;localStorage.setItem('averagePriceItems',JSON.stringify(items));render()});render();
