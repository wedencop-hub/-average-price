"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getInventory, saveInventory, seedInventory, type StockItem } from "../../lib/warehouse-inventory";
import "./warehouse.css";

export default function WarehousePage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { getInventory().then(saved => { setItems(saved.length ? saved : seedInventory()); setLoaded(true); }); }, []);
  const low = useMemo(() => items.filter(x => x.quantity <= x.minStock), [items]);
  async function update(sku: string, field: "quantity" | "unitCost" | "minStock", value: number) {
    const next = items.map(x => x.sku === sku ? { ...x, [field]: Math.max(0, value) } : x);
    setItems(next); await saveInventory(next);
  }
  if (!loaded) return <main className="warehouse"><p>Завантаження складу…</p></main>;
  return <main className="warehouse"><Link href="/">← На головну</Link><header><div className="eyebrow">СКЛАД</div><h1>Залишки матеріалів</h1><p>Залишок, закупівельна ціна та мінімальний запас.</p></header>{low.length > 0 && <section className="alert"><b>⚠️ Низький залишок:</b> {low.map(x => x.name).join(", ")}</section>}<section className="panel inventory">{items.map(item => <div className="stock" key={item.sku}><div><b>{item.name}</b><span>{item.sku} · {item.unit}</span></div><label>Залишок<input type="number" min="0" value={item.quantity} onChange={e => update(item.sku,"quantity",Number(e.target.value))}/></label><label>Ціна закупки<input type="number" min="0" value={item.unitCost} onChange={e => update(item.sku,"unitCost",Number(e.target.value))}/></label><label>Мінімум<input type="number" min="0" value={item.minStock} onChange={e => update(item.sku,"minStock",Number(e.target.value))}/></label></div>)}</section></main>}
