const modules = [
  ['Об’єкти', 'Керуйте замірами, кошторисами та монтажами'],
  ['Конструктор', 'Намалюйте стелю та отримайте розрахунок'],
  ['Кошториси', 'Окремо для клієнта та внутрішньої собівартості'],
  ['Виробництво', 'Специфікації, комплектація та видача'],
  ['Монтаж', 'Завдання, фото, контроль якості та зарплата'],
  ['Фінанси', 'Доходи, витрати, прибуток та рух коштів'],
] as const;

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="mark">С</div>
        <div>
          <div className="eyebrow">🇺🇦 СТЕЛЯ OS</div>
          <h1>Операційна система бізнесу натяжних стель</h1>
          <p>Замірив → намалював → отримав розрахунок → відправив клієнту.</p>
        </div>
      </section>
      <section className="grid">
        {modules.map(([title, text]) => (
          <article className="card" key={title}>
            <div className="card-title">{title}</div>
            <div className="card-text">{text}</div>
          </article>
        ))}
      </section>
      <section className="status"><span className="dot" /> Конструктор та офлайн-розрахунок доступні</section>
    </main>
  );
}
