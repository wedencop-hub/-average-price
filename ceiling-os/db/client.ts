import { Pool, type QueryResultRow } from "pg";
let pool: Pool | undefined;
export function getDb(){if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is not configured");if(!pool)pool=new Pool({connectionString:process.env.DATABASE_URL,max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:5000,ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:false}:undefined});return pool;}
export async function query<T extends QueryResultRow=QueryResultRow>(text:string,values:unknown[]=[]){return getDb().query<T>(text,values);}
