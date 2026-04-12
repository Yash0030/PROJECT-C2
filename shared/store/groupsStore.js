import { create } from 'zustand';
import { groupsApi } from '../api/index.js';

export const useGroupsStore = create((set, get) => ({
  groups: [],
  activeGroup: null,
  loading: false,
  error: null,

  fetchNearby: async (lat, lng, radiusKm) => {
    set({ loading: true, error: null });
    try {
      const groups = await groupsApi.list(lat, lng, radiusKm);
      set({ groups, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  setActiveGroup: (group) => set({ activeGroup: group }),

  addGroup: (group) => set(s => ({ groups: [group, ...s.groups] })),

  updateGroupHealth: (groupId, healthScore) =>
    set(s => ({
      groups: s.groups.map(g => g.id === groupId ? { ...g, healthScore } : g),
      activeGroup: s.activeGroup?.id === groupId
        ? { ...s.activeGroup, healthScore }
        : s.activeGroup,
    })),
}));
