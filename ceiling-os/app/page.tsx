import Link from "next/link";
const modules=[
 ["Об’єкти","Керуйте замірами, кошторисами та монтажами","/objects"],
 ["Конструктор","Намалюйте стелю та отримайте розрахунок","/constructor"],
 ["Склад","Залишки, закупівельні ціни та мінімальний запас","/warehouse"],
 ["Кошториси","Окремо для клієнта та внутрішньої собівартості","#"],
 ["Виробництво","Специфікації, комплектація та видача","#"],
 ["Монтаж","Завдання, фото, контроль якості та зарплата","#"],
 ["Фінанси","Доходи, витрати, прибуток та рух коштів","#"],
] as const;
export default function HomePage(){return <main className="shell"><section className="hero"><div className="mark">С</div><div><div className="eyebrow">🇺🇦 СТЕЛЯ OS</div><h1>Операційна система бізнесу натяжних стель</h1><p>Замірив → намалював → отримав розрахунок → відправив клієнту.</p></div></section><section className="grid">{modules.map(([title,text,href])=><Link className="card" href={href} key={title}><div className="card-title">{title}</div><div className="card-text">{text}</div>{href!=="#"&&<div className="card-link">Відкрити →</div>}</Link>)}</section><section className="status"><span className="dot"/> Конструктор, кошторис та офлайн-склад доступні</section></main>}
