export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflow: 'auto', height: '100vh' }}>
      {children}
    </div>
  )
}