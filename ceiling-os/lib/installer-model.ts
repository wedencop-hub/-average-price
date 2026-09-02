export type Installer={id:string;companyId:string;name:string;phone?:string;active:boolean;defaultRuleId?:string};
export type InstallationAssignment={id:string;objectId:string;installerId:string;role:"lead"|"installer";ruleId:string;status:"assigned"|"confirmed"|"completed";createdAt:string};
export const DEMO_INSTALLERS:Installer[]=[{id:"installer-1",companyId:"demo-company",name:"Монтажник 1",active:true},{id:"installer-2",companyId:"demo-company",name:"Монтажник 2",active:true}];
