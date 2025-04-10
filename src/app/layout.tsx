import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '時光對話 - 將聊天記錄轉換成精美時間線',
  description: '將您的 LINE 聊天記錄轉換成精美時間線，重溫那些珍貴的時光片段。本地化處理，保護您的隱私。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
