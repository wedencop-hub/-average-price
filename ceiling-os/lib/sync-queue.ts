export type SyncOperation = {
  id: string;
  companyId: string;
  entity: string;
  entityId: string;
  operation: "create" | "update" | "delete";
  payload: unknown;
  createdAt: string;
  attempts: number;
};

const QUEUE_KEY = "ceiling-os:sync-queue";

export function enqueueSync(operation: Omit<SyncOperation, "id" | "createdAt" | "attempts">): SyncOperation {
  const item: SyncOperation = {
    ...operation,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  const queue = readQueue();
  queue.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return item;
}

export function readQueue(): SyncOperation[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as SyncOperation[];
  } catch {
    return [];
  }
}

export function clearQueue(): void {
  if (typeof localStorage !== "undefined") localStorage.removeItem(QUEUE_KEY);
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}
