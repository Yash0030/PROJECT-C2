export default function LoadingScreen() {
  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: '#07050f',
    }}>
      <div style={{
        fontSize: 32, fontWeight: 900, fontStyle: 'italic',
        color: '#00ffb3', letterSpacing: '-0.5px', fontFamily: 'Manrope, sans-serif'
      }}>
        ChitChat
      </div>
      <div style={{ fontSize: 12, color: '#62557e', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600 }}>
        Locating you…
      </div>
    </div>
  );
}
