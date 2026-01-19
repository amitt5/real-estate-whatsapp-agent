export const metadata = {
  title: 'Real Estate WhatsApp Agent',
  description: 'AI WhatsApp agent for real estate company',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
