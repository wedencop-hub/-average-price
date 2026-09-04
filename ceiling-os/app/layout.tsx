import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'СТЕЛЯ OS — операційна система бізнесу натяжних стель',
  description: 'Telegram Mini App для керування бізнесом натяжних стель.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uk"><body>{children}</body></html>;
}
