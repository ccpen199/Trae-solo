import { get, post, put, del } from './request';
import { CaseSource, CaseBid, Contract, PublishCaseParams, BidParams, PaginationResult, PaginationParams } from '@/types';

export const caseApi = {
  getCaseList: (params: PaginationParams & {
    keyword?: string; cause?: string; province?: string; amountMin?: number; amountMax?: number; status?: string }): Promise<PaginationResult<CaseSource>> => {
    return get<PaginationResult<CaseSource>>('/cases', { params });
  },

  getCaseDetail: (id: string): Promise<CaseSource> => {
    return get<CaseSource>(`/cases/${id}`);
  },

  publishCase: (data: PublishCaseParams): Promise<CaseSource> => {
    return post<CaseSource>('/cases', data);
  },

  updateCase: (id: string, data: Partial<CaseSource>): Promise<CaseSource> => {
    return put<CaseSource>(`/cases/${id}`, data);
  },

  deleteCase: (id: string): Promise<void> => {
    return del(`/cases/${id}`);
  },

  submitBid: (data: BidParams): Promise<CaseBid> => {
    return post<CaseBid>('/bids', data);
  },

  getCaseBids: (caseId: string): Promise<CaseBid[]> => {
    return get<CaseBid[]>(`/cases/${caseId}/bids`);
  },

  selectLawyer: (caseId: string, bidId: string): Promise<void> => {
    return post(`/cases/${caseId}/select-bid`, { bidId });
  },

  getMatchedCases: (): Promise<CaseSource[]> => {
    return get<CaseSource[]>('/cases/matched');
  },

  getMyPublishedCases: (): Promise<CaseSource[]> => {
    return get<CaseSource[]>('/cases/my-published');
  },

  getMyBids: (): Promise<CaseBid[]> => {
    return get<CaseBid[]>('/bids/my');
  },

  getContractList: (params?: PaginationParams): Promise<PaginationResult<Contract>> => {
    return get<PaginationResult<Contract>>('/contracts', { params });
  },

  getContractDetail: (id: string): Promise<Contract> => {
    return get<Contract>(`/contracts/${id}`);
  },

  createContract: (caseId: string, templateId: string): Promise<Contract> => {
    return post<Contract>('/contracts', { caseId, templateId });
  },

  signContract: (id: string, role: 'client' | 'lawyer'): Promise<Contract> => {
    return post<Contract>(`/contracts/${id}/sign`, { role });
  },

  payDeposit: (caseId: string): Promise<{ paymentUrl: string }> => {
    return post(`/cases/${caseId}/pay-deposit`);
  },

  releasePayment: (caseId: string): Promise<void> => {
    return post(`/cases/${caseId}/release-payment`);
  },
};
