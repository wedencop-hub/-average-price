"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getOffline } from "../../../../lib/offline-store";
import { calculateCeiling } from "../../../../lib/calculation-engine";
import type { CeilingDrawing } from "../../../../lib/ceiling-model";
import { estimateFromCalculation, recalculateEstimate, type EstimateVersion } from "../../../../lib/estimate-model";
import { getEstimate, saveEstimate } from "../../../../lib/estimate-store";
import "./estimate.css";

type StoredObject = { drawing?: CeilingDrawing };

export default function EstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const [objectId, setObjectId] = useState("");
  const [estimate, setEstimate] = useState<EstimateVersion | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { params.then(({ id }) => {
    setObjectId(id);
    Promise.all([getOffline<StoredObject>(`object:${id}`), getEstimate(id)]).then(([stored, saved]) => {
      const drawing = stored?.payload?.drawing;
      if (!drawing) { setLoading(false); return; }
      const next = estimateFromCalculation(id, calculateCeiling(drawing), saved ?? undefined);
      setEstimate(next); setLoading(false);
    }).catch(() => setLoading(false));
  }); }, [params]);
  if (loading) return <main className="estimate"><p>Завантаження кошторису…</p></main>;
  if (!estimate) return <main className="estimate"><Link href={`/objects/${objectId}`}>← До об’єкта</Link><h1>Кошторис</h1><p>Спочатку створіть замір об’єкта.</p><Link className="primary" href={`/constructor?object=${encodeURIComponent(objectId)}`}>Відкрити конструктор</Link></main>;
  const updatePrice = (sku: string, value: string) => setEstimate(recalculateEstimate(estimate, { [sku]: Number(value) || 0 }));
  const save = async () => { await saveEstimate(estimate); setEstimate({ ...estimate, createdAt: new Date().toISOString() }); };
  return <main className="estimate"><Link href={`/objects/${objectId}`}>← До об’єкта</Link><header><div className="eyebrow">КЛІЄНТСЬКИЙ КОШТОРИС</div><h1>Кошторис №{estimate.version}</h1><p>Версія {estimate.version} · {new Date(estimate.createdAt).toLocaleDateString("uk-UA")}</p></header><section className="panel"><div className="estimate-table"><div className="row head"><span>Позиція</span><span>К-сть</span><span>Ціна</span><span>Сума</span></div>{estimate.items.map(item => <div className="row" key={item.sku}><span>{item.name}<small>{item.unit}</small></span><span>{item.quantity}</span><input aria-label={`Ціна ${item.name}`} type="number" min="0" value={item.unitPrice} onChange={e => updatePrice(item.sku, e.target.value)} /><strong>{item.total.toLocaleString("uk-UA")} ₴</strong></div>)}</div><div className="total"><span>Разом</span><strong>{estimate.total.toLocaleString("uk-UA")} ₴</strong></div><button className="primary" onClick={save}>Зберегти версію</button></section></main>;
}
