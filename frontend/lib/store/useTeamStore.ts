import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient, Team, TeamWithMembers, CreateTeamData, UpdateTeamData } from '../api';

interface TeamState {
  teams: Team[];
  currentTeam: TeamWithMembers | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchTeams: () => Promise<void>;
  fetchTeam: (id: string) => Promise<void>;
  createTeam: (data: CreateTeamData) => Promise<void>;
  updateTeam: (id: string, data: UpdateTeamData) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  
  // Member management
  addTeamMember: (teamId: string, data: any) => Promise<void>;
  updateTeamMember: (teamId: string, userId: string, data: any) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  
  // Utilities
  setError: (error: string | null) => void;
  clearTeam: () => void;
}

export const useTeamStore = create<TeamState>()(
  devtools(
    (set, get) => ({
      teams: [],
      currentTeam: null,
      loading: false,
      error: null,

      fetchTeams: async () => {
        set({ loading: true, error: null });
        try {
          const teams = await apiClient.getTeams();
          set({ teams, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchTeam: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const team = await apiClient.getTeam(id);
          set({ currentTeam: team, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      createTeam: async (data: CreateTeamData) => {
        set({ loading: true, error: null });
        try {
          const team = await apiClient.createTeam(data);
          set((state) => ({ 
            teams: [...state.teams, team], 
            loading: false 
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      updateTeam: async (id: string, data: UpdateTeamData) => {
        set({ loading: true, error: null });
        try {
          const team = await apiClient.updateTeam(id, data);
          set((state) => ({
            teams: state.teams.map(t => t.id === id ? team : t),
            currentTeam: state.currentTeam?.id === id ? { ...state.currentTeam, ...team } : state.currentTeam,
            loading: false
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      deleteTeam: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await apiClient.deleteTeam(id);
          set((state) => ({
            teams: state.teams.filter(t => t.id !== id),
            currentTeam: state.currentTeam?.id === id ? null : state.currentTeam,
            loading: false
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addTeamMember: async (teamId: string, data: any) => {
        try {
          await apiClient.addTeamMember(teamId, data);
          // Refresh team data
          const team = await apiClient.getTeam(teamId);
          set((state) => ({
            currentTeam: team
          }));
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      updateTeamMember: async (teamId: string, userId: string, data: any) => {
        try {
          await apiClient.updateTeamMember(teamId, userId, data);
          // Refresh team data
          const team = await apiClient.getTeam(teamId);
          set((state) => ({
            currentTeam: team
          }));
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      removeTeamMember: async (teamId: string, userId: string) => {
        try {
          await apiClient.removeTeamMember(teamId, userId);
          // Refresh team data
          const team = await apiClient.getTeam(teamId);
          set((state) => ({
            currentTeam: team
          }));
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      setError: (error: string | null) => set({ error }),
      clearTeam: () => set({ currentTeam: null })
    }),
    {
      name: 'team-store'
    }
  )
);