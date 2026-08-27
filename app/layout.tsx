import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '賢者っち',
  description: '育て方が個性になる、小さな3D育成ゲーム。',
  openGraph: { title: '賢者っち', description: '育て方が、個性になる。', images: ['/og.png'] },
  twitter: { card: 'summary_large_image', title: '賢者っち', description: '育て方が、個性になる。', images: ['/og.png'] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
