import type { Metadata } from 'next';
import './globals.css';
import { RegisterServiceWorker } from './offline/register-sw';
import { TelegramBootstrap } from './auth/telegram-bootstrap';
export const metadata: Metadata={title:'СТЕЛЯ OS — операційна система бізнесу натяжних стель',description:'Telegram Mini App для керування бізнесом натяжних стель.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="uk"><body><RegisterServiceWorker/><TelegramBootstrap/>{children}</body></html>}
