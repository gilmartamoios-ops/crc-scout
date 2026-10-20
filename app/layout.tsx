import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'E se seu consumo gerasse renda recorrente?',
  description: 'Descubra como transformar produtos do dia a dia em uma comunidade de renda recorrente. Sem taxa de adesão e sem estoque.',
  openGraph: {
    title: 'E se seu consumo gerasse renda recorrente?',
    description: 'Acesse o SCOUT e descubra como funciona na prática. Risco Zero.',
    url: 'https://crc-scout.vercel.app',
    siteName: 'CRC SCOUT',
    images: [
      {
        url: 'https://crc-scout.vercel.app/assets/capa-preview.jpg',
        width: 1200,
        height: 630,
        alt: 'Santinho Digital CRC Scout',
      },
    ],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-neutral-950 text-neutral-100 antialiased min-h-screen selection:bg-[#00ff88] selection:text-black">
        {children}
      </body>
    </html>
  );
}