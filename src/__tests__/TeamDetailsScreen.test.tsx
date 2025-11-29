import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { TeamDetailsScreen } from '../components/screens/teams/TeamDetailsScreen'
import { joinTeam, leaveTeam } from '../services/teamService'

vi.mock('../Firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'user1' },
    onAuthStateChanged: (cb: any) => {
      cb({ uid: 'user1' })
      return () => {}
    }
  },
  db: {}
}))

vi.mock('../components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: () => <div />,
  AvatarFallback: ({ children }: any) => <div>{children}</div>
}))

vi.mock('../components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>
}))

vi.mock('../components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>
}))

const mockTeamData: any = {
  name: 'Equipo Prueba',
  sport: 'Fútbol',
  captainId: 'user1',
  members: ['user2'],
  status: 'active',
  currentPlayers: 1,
};

let lastUpdatePayload: any = null;
vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn(() => ({} as any)),
    onSnapshot: (ref: any, cb: any) => {
      const snap = {
        exists: () => true,
        id: 'team1',
        data: () => ({ ...mockTeamData })
      }
      cb(snap)
      return () => {}
    },
    collection: vi.fn(() => ({} as any)),
    query: vi.fn(() => ({} as any)),
    where: vi.fn(() => ({} as any)),
    documentId: vi.fn(() => 'id'),
    getDocs: vi.fn(async () => ({
      docs: [{ id: 'user2', data: () => ({ displayName: 'Miembro Uno' }) }]
    })),
    getDoc: vi.fn(async () => ({ exists: () => false })),
    updateDoc: vi.fn(async () => {}),
    arrayRemove: vi.fn((x: any) => x),
    addDoc: vi.fn(async () => {}),
    serverTimestamp: vi.fn(() => new Date()),
    arrayUnion: vi.fn((x: any) => x),
    runTransaction: vi.fn(async (_db: any, cb: any) => {
      const tx = {
        get: vi.fn(async () => ({ exists: () => true, data: () => ({ members: ['user2'], maxPlayers: 5, captainId: 'user1' }) })),
        update: vi.fn((_ref: any, payload: any) => { lastUpdatePayload = payload })
      } as any
      await cb(tx)
      return true
    }),
  }
})

describe('TeamDetailsScreen', () => {
  it('renderiza datos del equipo y miembros', async () => {
    render(<TeamDetailsScreen onBack={() => {}} teamData={{ id: 'team1' }} onNavigate={() => {}} />)
    await waitFor(() => {
      expect(screen.getByText('Detalles del Equipo')).toBeTruthy()
      expect(screen.getByText('Equipo Prueba')).toBeTruthy()
    })
    expect(screen.getByText(/miembros/i)).toBeTruthy()
  })

  it('muestra conteo único de miembros y corrige currentPlayers si hay desajuste', async () => {
    const firestore = await import('firebase/firestore')
    const spyUpdate = vi.spyOn(firestore, 'updateDoc')
    mockTeamData.members = ['user2', 'user2']
    mockTeamData.currentPlayers = 2
    render(<TeamDetailsScreen onBack={() => {}} teamData={{ id: 'team1' }} onNavigate={() => {}} />)
    await waitFor(() => {
      expect(spyUpdate).toHaveBeenCalled()
    })
  })

  it('joinTeam usa transacción y establece currentPlayers correcto', async () => {
    lastUpdatePayload = null
    await expect(joinTeam('team1', 'user3', 'User Tres')).resolves.toBe(true)
    expect(lastUpdatePayload?.currentPlayers).toBe(2)
  })

  it('leaveTeam usa transacción y decremente currentPlayers', async () => {
    lastUpdatePayload = null
    await expect(leaveTeam('team1', 'user2')).resolves.toBe(true)
    expect(lastUpdatePayload?.currentPlayers).toBe(0)
  })
})
