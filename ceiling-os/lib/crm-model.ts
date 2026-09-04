export type ObjectStatus = "lead" | "measurement" | "estimate" | "contract" | "deposit_paid" | "production" | "ready" | "delivery" | "installation" | "completed" | "cancelled";

export type Client = { id: string; companyId: string; name: string; phone: string; email?: string; notes?: string; createdAt: string; updatedAt: string };
export type ObjectRecord = { id: string; companyId: string; clientId: string; title: string; address: string; status: ObjectStatus; managerId?: string; estimatorId?: string; foremanId?: string; notes?: string; createdAt: string; updatedAt: string };

const CLIENTS_KEY = "stelya-os:clients";
const OBJECTS_KEY = "stelya-os:objects";

function read<T>(key: string): T[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; } }
function write<T>(key: string, value: T[]) { localStorage.setItem(key, JSON.stringify(value)); }

export function listClients(companyId: string): Client[] { return read<Client>(CLIENTS_KEY).filter((item) => item.companyId === companyId); }
export function saveClient(client: Client): void { const all = read<Client>(CLIENTS_KEY); write(CLIENTS_KEY, [...all.filter((item) => item.id !== client.id), client]); }
export function listObjects(companyId: string): ObjectRecord[] { return read<ObjectRecord>(OBJECTS_KEY).filter((item) => item.companyId === companyId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
export function saveObject(object: ObjectRecord): void { const all = read<ObjectRecord>(OBJECTS_KEY); write(OBJECTS_KEY, [...all.filter((item) => item.id !== object.id), object]); }
