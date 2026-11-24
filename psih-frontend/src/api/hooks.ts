import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  AdminUser, Analysis, AuditLog, CaseFlag, Complaint, ComplaintDetail, CrimeType, DashboardStats, Evidence, FileType,
  Investigation, InvestigationStatus, Officer, RiskLevel, SubmissionStatus, Thana,
} from '../lib/types';

// "Real-time": the backend has no WebSocket/SSE, so staff views poll. Swap for SSE later.
const LIVE = 30_000;

export const useThanas = () =>
  useQuery({ queryKey: ['thanas'], queryFn: async () => (await api<Thana[]>('/thanas')).data, staleTime: 10 * 60_000 });

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: async () => (await api<DashboardStats>('/dashboard')).data, refetchInterval: LIVE });

export const useComplaints = (page: number, status: string, live: boolean) =>
  useQuery({
    queryKey: ['complaints', page, status],
    queryFn: () => api<Complaint[]>(`/complaints?page=${page}&limit=10${status ? `&status=${status}` : ''}`),
    placeholderData: keepPreviousData,
    refetchInterval: live ? LIVE : false,
  });

export const useAuditLogs = (page: number) =>
  useQuery({ queryKey: ['audit', page], queryFn: () => api<AuditLog[]>(`/audit-logs?page=${page}&limit=15`), placeholderData: keepPreviousData });

export interface ComplaintInput { thana_code: string; area: string; crime_type: CrimeType; case_description: string }

export function useCreateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: ComplaintInput) => api<Complaint>('/complaints', { method: 'POST', body: b }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  });
}
export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: SubmissionStatus }) =>
      api(`/complaints/${v.id}/status`, { method: 'PATCH', body: { submission_status: v.status } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['complaints'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}
export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/complaints/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  });
}

export const useOfficers = (thanaCode: string) =>
  useQuery({
    queryKey: ['officers', thanaCode], enabled: !!thanaCode, staleTime: 5 * 60_000,
    queryFn: async () => (await api<Officer[]>(`/officers?thana_code=${encodeURIComponent(thanaCode)}`)).data,
  });

export const useComplaint = (id: string) =>
  useQuery({ queryKey: ['complaint', id], queryFn: async () => (await api<ComplaintDetail>(`/complaints/${id}`)).data });

export const useInvestigations = (status: string) =>
  useQuery({
    queryKey: ['investigations', status], refetchInterval: LIVE,
    queryFn: async () => (await api<Investigation[]>(`/investigations${status ? `?status=${status}` : ''}`)).data,
  });

export const useAnalyses = () =>
  useQuery({ queryKey: ['analyses'], queryFn: async () => (await api<Analysis[]>('/crime-analysis')).data });

function useWorkflowMutation<V, R>(fn: (v: V) => Promise<R>, keys: string[]) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] })) });
}
export const useAssignSI = () =>
  useWorkflowMutation((b: { complaint_id: string; current_SI_id: string }) => api('/assignments', { method: 'POST', body: b }),
    ['complaints', 'complaint', 'investigations', 'dashboard']);
export const useUpdateInvestigation = () =>
  useWorkflowMutation((v: { id: string; status: InvestigationStatus }) =>
    api(`/investigations/${v.id}/status`, { method: 'PATCH', body: { investigation_status: v.status } }),
    ['investigations', 'complaint', 'dashboard']);
export const useCreateReview = () =>
  useWorkflowMutation((b: { investigation_id: string; oc_id: string; flag: CaseFlag }) => api('/reviews', { method: 'POST', body: b }),
    ['investigations', 'complaint']);
export const useAddEvidence = () =>
  useWorkflowMutation((b: { complaint_id: string; file_type: FileType; file_path: string }) =>
    api<Evidence>('/evidence', { method: 'POST', body: b }), ['complaint']);
export const useCreateAnalysis = () =>
  useWorkflowMutation((b: { thana_code: string; crime_type: CrimeType; period_start: string; period_end: string; risk_level: RiskLevel }) =>
    api('/crime-analysis', { method: 'POST', body: b }), ['analyses']);

// ---- Admin ----
export const useAllOfficers = () =>
  useQuery({ queryKey: ['officers', 'all'], queryFn: async () => (await api<Officer[]>('/officers')).data });
export const useAdminUsers = (page: number) =>
  useQuery({ queryKey: ['users', page], queryFn: () => api<AdminUser[]>(`/users?page=${page}&limit=15`), placeholderData: keepPreviousData });

type Body = Record<string, unknown>;
function useSave(path: string, keys: string[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id?: string; body: Body }) =>
      api(v.id ? `${path}/${encodeURIComponent(v.id)}` : path, { method: v.id ? 'PATCH' : 'POST', body: v.body }),
    onSuccess: () => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  });
}
function useRemove(path: string, keys: string[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: () => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  });
}
export const useSaveStation = () => useSave('/thanas', ['thanas', 'officers']);
export const useRemoveStation = () => useRemove('/thanas', ['thanas', 'officers']);
export const useSaveOfficer = () => useSave('/officers', ['officers', 'users']);
export const useRemoveOfficer = () => useRemove('/officers', ['officers', 'users']);
export const useSaveUser = () => useSave('/users', ['users', 'officers']);
export const useRemoveUser = () => useRemove('/users', ['users', 'officers']);
