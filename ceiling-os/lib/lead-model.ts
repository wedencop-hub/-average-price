export type LeadSource = "telegram" | "phone" | "instagram" | "website" | "referral" | "other";
export type LeadStatus = "new" | "contacted" | "measurement" | "estimate" | "won" | "lost";

export type Lead = {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  clientId?: string;
  objectId?: string;
  createdAt: string;
  updatedAt: string;
};

const KEY = "stelya-os:leads";
function read(): Lead[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Lead[]; } catch { return []; } }
function write(value: Lead[]) { localStorage.setItem(KEY, JSON.stringify(value)); }
export function listLeads(companyId: string): Lead[] { return read().filter(x => x.companyId === companyId).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)); }
export function saveLead(lead: Lead): void { const all=read(); write([...all.filter(x=>x.id!==lead.id),lead]); }
export function updateLeadStatus(id:string,status:LeadStatus): void { const lead=read().find(x=>x.id===id); if(!lead)return; saveLead({...lead,status,updatedAt:new Date().toISOString()}); }
export const leadStatusLabels: Record<LeadStatus,string> = {new:"Новий",contacted:"Контакт",measurement:"Замір",estimate:"Кошторис",won:"Виграно",lost:"Втрачено"};
export const leadSourceLabels: Record<LeadSource,string> = {telegram:"Telegram",phone:"Телефон",instagram:"Instagram",website:"Сайт",referral:"Рекомендація",other:"Інше"};
