export default function LoadingScreen() {
  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: '#0e0e0e',
    }}>
      <div style={{
        fontSize: 32, fontWeight: 900, fontStyle: 'italic',
        color: '#ffde56', letterSpacing: '-0.5px', fontFamily: 'Manrope, sans-serif'
      }}>
        ChitChat
      </div>
      <div style={{ fontSize: 12, color: '#584235', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600 }}>
        Locating you…
      </div>
    </div>
  );
}
