"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getEstimate } from "../../../../lib/estimate-store";
import { getInventory } from "../../../../lib/warehouse-inventory";
import { createProductionOrderFromEstimate, hasProductionShortage, type ProductionOrder, type ProductionStatus } from "../../../../lib/production-model";
import { getProductionOrder, saveProductionOrder } from "../../../../lib/production-store";
import { getOffline } from "../../../../lib/offline-store";
import type { ObjectRecord } from "../../../../lib/crm-model";
import "./production.css";

const statuses: ProductionStatus[] = ["new", "processing", "ready", "issued", "completed"];
const labels: Record<ProductionStatus, string> = { new: "Нове", processing: "У виробництві", ready: "Готово", issued: "Видано", completed: "Завершено" };

export default function ProductionPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function refresh() {
    setLoading(true);
    const existing = await getProductionOrder(id);
    const estimate = await getEstimate(id);
    const inventory = await getInventory();
    if (existing) setOrder(existing);
    else if (estimate) setOrder(createProductionOrderFromEstimate(estimate, inventory));
    else setOrder(null);
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, [id]);

  async function regenerate() {
    const estimate = await getEstimate(id);
    if (!estimate) return;
    const inventory = await getInventory();
    const next = createProductionOrderFromEstimate(estimate, inventory);
    setOrder(next);
    await saveProductionOrder(next);
    setMessage("Специфікацію оновлено з актуального кошторису.");
  }

  async function setStatus(status: ProductionStatus) {
    if (!order) return;
    if (status === "ready" && hasProductionShortage(order)) {
      setMessage("Неможливо позначити готовим: не вистачає матеріалів.");
      return;
    }
    if (status === "issued" && order.status !== "ready") {
      setMessage("Спочатку переведіть виробництво у статус «Готово».");
      return;
    }
    const next = { ...order, status, updatedAt: new Date().toISOString() };
    setOrder(next);
    await saveProductionOrder(next);
    setMessage(`Статус: ${labels[status]}`);
  }

  if (loading) return <main className="production-page"><p>Завантаження…</p></main>;
  if (!order) return <main className="production-page"><h1>Виробництво</h1><p>Спочатку створіть і збережіть кошторис.</p><Link href={`/objects/${id}/estimate`}>Відкрити кошторис</Link></main>;

  const shortage = hasProductionShortage(order);
  return (
    <main className="production-page">
      <header className="production-header">
        <div><Link href={`/objects/${id}`}>← Об’єкт</Link><h1>Виробниче завдання</h1><p>Специфікація матеріалів для виробництва та комплектації.</p></div>
        <button onClick={() => void regenerate()}>↻ Оновити з кошторису</button>
      </header>

      <section className="production-status">
        {statuses.map((status) => <button key={status} className={order.status === status ? "active" : ""} onClick={() => void setStatus(status)}>{labels[status]}</button>)}
      </section>

      {shortage && <div className="production-alert">⚠️ Є дефіцит матеріалів. Перевірте склад перед запуском.</div>}
      {message && <div className="production-message">{message}</div>}

      <section className="production-card">
        <div className="production-table production-head"><span>Матеріал</span><span>Потрібно</span><span>Доступно</span><span>Дефіцит</span><span>Собівартість</span></div>
        {order.items.map((item) => <div className="production-table" key={item.id}>
          <span><b>{item.name}</b><small>{item.sku}</small></span><span>{item.quantity} {item.unit}</span><span>{item.available} {item.unit}</span><span className={item.shortage ? "shortage" : "ok"}>{item.shortage ? `-${item.shortage}` : "✓"}</span><span>{item.totalCost.toFixed(2)} грн</span>
        </div>)}
        <div className="production-total">Орієнтовна собівартість матеріалів: <b>{order.totalCost.toFixed(2)} грн</b></div>
      </section>

      <div className="production-actions"><Link href={`/objects/${id}/warehouse`}>Склад об’єкта</Link><Link href={`/objects/${id}/installation`}>Монтаж</Link><Link href={`/objects/${id}/finance`}>Фінанси</Link></div>
    </main>
  );
}
