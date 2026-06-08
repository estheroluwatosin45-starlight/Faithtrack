import { Layout } from '../components/Layout';
import '../index.css';

export const metadata = {
  title: 'Vessel of His Mercy - Faithtrack',
  description: 'School, Chapel, and Morning Devotion Attendance System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="h-full text-slate-900 antialiased">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
