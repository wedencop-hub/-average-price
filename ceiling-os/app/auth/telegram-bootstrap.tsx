"use client";
import{useEffect}from"react";import{getLocalUser,upsertTelegramUser}from"../../lib/auth-model";
export function TelegramBootstrap(){useEffect(()=>{const w=window as typeof window & {Telegram?:{WebApp?:{initData?:string;initDataUnsafe?:{user?:{id:number;username?:string;first_name?:string;last_name?:string;language_code?:string}}}}};const user=w.Telegram?.WebApp?.initDataUnsafe?.user;if(user?.id&&!getLocalUser())upsertTelegramUser(user);},[]);return null}
