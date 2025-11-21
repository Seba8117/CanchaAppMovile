import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyTeamsScreen } from '../components/screens/teams/MyTeamsScreen'

vi.mock('../Firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'user1', displayName: 'User Uno' },
    onAuthStateChanged: (cb: any) => { cb({ uid: 'user1' }); return () => {}; }
  },
  db: {}
}))

vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(() => ({} as any)),
    query: vi.fn(() => ({} as any)),
    where: vi.fn(() => ({} as any)),
    onSnapshot: (q: any, cb: any) => {
      const captainTeams = [{ id: 't1', data: () => ({ name: 'Equipo A', sport: 'Fútbol', captainId: 'user1', members: ['user1'] }) }]
      const memberTeams = [{ id: 't2', data: () => ({ name: 'Equipo B', sport: 'Basket', captainId: 'userX', members: ['user1', 'userX'] }) }]
      const snap = { docs: q === 'captain' ? captainTeams : memberTeams }
      cb(snap as any)
      return () => {}
    }
  }
})

vi.mock('../components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: () => <div />,
  AvatarFallback: ({ children }: any) => <div>{children}</div>
}))

describe('MyTeamsScreen', () => {
  it('renderiza pantalla de Mis Equipos', async () => {
    render(<MyTeamsScreen onBack={() => {}} onNavigate={() => {}} />)
    expect(await screen.findByText('Mis Equipos')).toBeTruthy()
  })
})