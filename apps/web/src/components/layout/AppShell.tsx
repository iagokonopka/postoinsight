import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  return (
    <>
      <Sidebar />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
      }}>
        <Topbar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}>
          <Outlet />
        </main>
      </div>
    </>
  )
}
