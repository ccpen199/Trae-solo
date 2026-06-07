import { TicketRepository } from '../repositories/TicketRepository.js';
import type { WorkTicket, PaginatedResult } from '../types/index.js';

export class TicketService {
  private ticketRepository: TicketRepository;

  constructor() {
    this.ticketRepository = new TicketRepository();
  }

  public createTicket(ticketData: Omit<WorkTicket, 'id' | 'created_at' | 'updated_at'>): number {
    return this.ticketRepository.create(ticketData);
  }

  public getTicketById(id: number): WorkTicket | null {
    return this.ticketRepository.findById(id);
  }

  public getTickets(page: number = 1, pageSize: number = 10, filters?: Record<string, unknown>): PaginatedResult<WorkTicket> {
    return this.ticketRepository.getTicketsWithDetails(page, pageSize, filters) as unknown as PaginatedResult<WorkTicket>;
  }

  public getPendingTickets(): WorkTicket[] {
    return this.ticketRepository.findPendingTickets();
  }

  public getTicketsByStatus(status: string): WorkTicket[] {
    return this.ticketRepository.findByStatus(status);
  }

  public getTicketsByAssignee(assigneeId: number): WorkTicket[] {
    return this.ticketRepository.findByAssignee(assigneeId);
  }

  public getTicketsByReporter(reporterId: number): WorkTicket[] {
    return this.ticketRepository.findByReporter(reporterId);
  }

  public updateTicket(id: number, ticketData: Partial<WorkTicket>): boolean {
    return this.ticketRepository.update(id, ticketData);
  }

  public updateStatus(id: number, status: WorkTicket['status'], extra?: Partial<WorkTicket>): boolean {
    return this.ticketRepository.updateStatus(id, status, extra);
  }

  public assignTicket(id: number, assigneeId: number): boolean {
    return this.ticketRepository.assignTicket(id, assigneeId);
  }

  public completeTicket(id: number, rating?: number, feedback?: string): boolean {
    return this.ticketRepository.completeTicket(id, rating, feedback);
  }

  public deleteTicket(id: number): boolean {
    return this.ticketRepository.delete(id);
  }

  public getTicketStats() {
    return this.ticketRepository.getTicketStats();
  }

  public getTicketsByStatusGroup() {
    return this.ticketRepository.getTicketsByStatusGroup();
  }

  public getTicketsByTypeGroup() {
    return this.ticketRepository.getTicketsByTypeGroup();
  }

  public getRecentTickets(limit: number = 10) {
    return this.ticketRepository.getRecentTickets(limit);
  }

  public startTicket(id: number): boolean {
    return this.ticketRepository.updateStatus(id, 'processing', {
      started_at: new Date().toISOString(),
    });
  }

  public cancelTicket(id: number): boolean {
    return this.ticketRepository.updateStatus(id, 'cancelled');
  }
}

export default TicketService;
