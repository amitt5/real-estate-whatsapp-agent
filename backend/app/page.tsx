export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Real Estate WhatsApp Agent API</h1>
      <p>API is running and ready to receive webhooks.</p>
      <p>
        <strong>Health Check:</strong>{' '}
        <a href="/api">/api</a>
      </p>
      <p>
        <strong>Webhook Endpoint:</strong>{' '}
        <code>/api/webhook</code>
      </p>
    </main>
  );
}
