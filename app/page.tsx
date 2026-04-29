import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '60px 20px', fontFamily: 'sans-serif', background: '#f0f2f5', minHeight: '100vh', textAlign: 'center' }}>
      <h1 style={{ color: '#1a365d', marginBottom: '60px', fontSize: '1.8rem' }}>ニコニコレンタカー<br />シフト管理システム</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '320px', margin: '0 auto' }}>
        <Link href="/apply" style={btnStyle}>📅 シフトを申請する</Link>
        <Link href="/view" style={btnStyle}>🔍 確定シフトを見る</Link>
      </div>
    </main>
  );
}

const btnStyle = {
  display: 'block',
  padding: '22px',
  background: '#0070f3',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '16px',
  fontWeight: 'bold',
  fontSize: '1.1rem',
  boxShadow: '0 4px 12px rgba(0,112,243,0.3)',
};