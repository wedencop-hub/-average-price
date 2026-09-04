export type SubscriptionPlan="free"|"pro"|"business"|"enterprise";
export type SubscriptionStatus="trial"|"active"|"grace"|"expired"|"cancelled";
export type Subscription={id:string;companyId:string;plan:SubscriptionPlan;status:SubscriptionStatus;currentPeriodEnd?:string|null;graceUntil?:string|null};

const limits:Record<SubscriptionPlan,{objects:number;advanced:boolean;team:boolean;warehouse:boolean;finance:boolean;documents:boolean}>={
  free:{objects:10,advanced:false,team:false,warehouse:false,finance:false,documents:false},
  pro:{objects:Number.POSITIVE_INFINITY,advanced:true,team:false,warehouse:false,finance:true,documents:true},
  business:{objects:Number.POSITIVE_INFINITY,advanced:true,team:true,warehouse:true,finance:true,documents:true},
  enterprise:{objects:Number.POSITIVE_INFINITY,advanced:true,team:true,warehouse:true,finance:true,documents:true},
};
export function planLimits(plan:SubscriptionPlan){return limits[plan]}
export function hasSubscriptionAccess(s:Subscription|null|undefined):boolean{if(!s)return true;if(s.status==="cancelled"||s.status==="expired")return false;const end=s.currentPeriodEnd?Date.parse(s.currentPeriodEnd):NaN;if(!Number.isFinite(end)||end>=Date.now())return true;return s.status==="grace"&&!!s.graceUntil&&Date.parse(s.graceUntil)>=Date.now()}
