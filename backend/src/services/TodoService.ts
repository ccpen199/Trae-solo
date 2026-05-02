import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import {
  Todo,
  TodoStatus,
  TodoPriority,
  TodoSource,
  User,
  UserRole,
  MasterWaybill,
} from '../entities';
import { TodoRequest, BusinessNode } from '../types';
import { numberGenerator } from './NumberGeneratorService';

export class TodoService {
  private todoRepo: Repository<Todo>;
  private waybillRepo: Repository<MasterWaybill>;

  private static readonly STATUS_DISPLAY_MAP: Record<TodoStatus, string> = {
    [TodoStatus.PENDING]: '待处理',
    [TodoStatus.IN_PROGRESS]: '处理中',
    [TodoStatus.COMPLETED]: '已完成',
    [TodoStatus.CANCELLED]: '已取消',
    [TodoStatus.OVERDUE]: '已过期',
  };

  private static readonly PRIORITY_DISPLAY_MAP: Record<TodoPriority, string> = {
    [TodoPriority.LOW]: '低',
    [TodoPriority.NORMAL]: '普通',
    [TodoPriority.HIGH]: '高',
    [TodoPriority.URGENT]: '紧急',
  };

  private static readonly NODE_DISPLAY_MAP: Record<BusinessNode, string> = {
    [BusinessNode.BOOKING]: '订舱',
    [BusinessNode.RECEIVING]: '收货',
    [BusinessNode.SECURITY]: '安检',
    [BusinessNode.LOADING]: '装机',
    [BusinessNode.IN_TRANSIT]: '运输',
    [BusinessNode.ARRIVAL]: '到港',
    [BusinessNode.PICKUP]: '提货',
    [BusinessNode.COMPLETION]: '完成',
  };

  constructor() {
    this.todoRepo = AppDataSource.getRepository(Todo);
    this.waybillRepo = AppDataSource.getRepository(MasterWaybill);
  }

  async createTodo(
    waybill: MasterWaybill,
    assignee: User,
    relatedNode: BusinessNode,
    title: string,
    options?: Partial<{
      relatedAction: string;
      description: string;
      priority: TodoPriority;
      dueDate: Date;
      source: TodoSource;
    }>
  ): Promise<Todo> {
    const todo = new Todo();
    todo.todoNo = numberGenerator.generateTodoNo();
    todo.status = TodoStatus.PENDING;
    todo.statusDisplay = TodoService.getStatusDisplay(TodoStatus.PENDING);
    todo.priority = options?.priority || TodoPriority.NORMAL;
    todo.source = options?.source || TodoSource.STATUS_FLOW;
    todo.masterWaybillId = waybill.id;
    todo.relatedNode = relatedNode;
    todo.relatedNodeDisplay = TodoService.getNodeDisplay(relatedNode);
    todo.relatedAction = options?.relatedAction;
    todo.assigneeId = assignee.id;
    todo.assigneeName = assignee.name;
    todo.assigneeRole = assignee.role;
    todo.assigneeRoleDisplay = TodoService.getRoleDisplay(assignee.role);
    todo.title = title;
    todo.description = options?.description;
    todo.isVisible = true;

    if (options?.dueDate) {
      todo.dueDate = options.dueDate;
    }

    return this.todoRepo.save(todo);
  }

  async createTodoFromRequest(request: TodoRequest, assignee: User, waybill: MasterWaybill): Promise<Todo> {
    const todo = new Todo();
    todo.todoNo = numberGenerator.generateTodoNo();
    todo.status = TodoStatus.PENDING;
    todo.statusDisplay = TodoService.getStatusDisplay(TodoStatus.PENDING);
    todo.priority = (request.priority as TodoPriority) || TodoPriority.NORMAL;
    todo.source = TodoSource.MANUAL;
    todo.masterWaybillId = waybill.id;
    todo.relatedNode = request.relatedNode;
    todo.relatedNodeDisplay = TodoService.getNodeDisplay(request.relatedNode as BusinessNode);
    todo.relatedAction = request.relatedAction;
    todo.assigneeId = assignee.id;
    todo.assigneeName = assignee.name;
    todo.assigneeRole = assignee.role;
    todo.assigneeRoleDisplay = TodoService.getRoleDisplay(assignee.role);
    todo.title = request.title;
    todo.description = request.description;
    todo.isVisible = true;

    if (request.dueDate) {
      todo.dueDate = new Date(request.dueDate);
    }

    return this.todoRepo.save(todo);
  }

  static getStatusDisplay(status: TodoStatus): string {
    return this.STATUS_DISPLAY_MAP[status] || status;
  }

  static getPriorityDisplay(priority: TodoPriority): string {
    return this.PRIORITY_DISPLAY_MAP[priority] || priority;
  }

  static getNodeDisplay(node: BusinessNode): string {
    return this.NODE_DISPLAY_MAP[node] || node;
  }

  static getRoleDisplay(role: UserRole): string {
    const map: Record<UserRole, string> = {
      [UserRole.FORWARDER]: '货代',
      [UserRole.AIRLINE]: '航司',
      [UserRole.WAREHOUSE]: '仓库',
      [UserRole.SECURITY]: '安检',
      [UserRole.CONSIGNEE]: '收货人',
      [UserRole.ADMIN]: '管理员',
    };
    return map[role] || role;
  }

  async getUserTodos(
    userId: string,
    options?: Partial<{
      status: TodoStatus;
      relatedNode: BusinessNode;
      priority: TodoPriority;
      page: number;
      pageSize: number;
      includeCompleted: boolean;
    }>
  ): Promise<{ items: Todo[]; total: number }> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, any> = {
      assigneeId: userId,
      isVisible: true,
    };

    if (options?.status) {
      where.status = options.status;
    } else if (!options?.includeCompleted) {
      where.status = TodoStatus.PENDING;
    }

    if (options?.relatedNode) {
      where.relatedNode = options.relatedNode;
    }

    if (options?.priority) {
      where.priority = options.priority;
    }

    const [items, total] = await this.todoRepo.findAndCount({
      where,
      order: { priority: 'DESC', createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return { items, total };
  }

  async getPendingCount(userId: string): Promise<number> {
    return this.todoRepo.count({
      where: {
        assigneeId: userId,
        status: TodoStatus.PENDING,
        isVisible: true,
      },
    });
  }

  async getOverdueCount(userId: string): Promise<number> {
    const now = new Date();
    return this.todoRepo
      .createQueryBuilder('todo')
      .where('todo.assigneeId = :userId', { userId })
      .andWhere('todo.status = :status', { status: TodoStatus.PENDING })
      .andWhere('todo.dueDate < :now', { now })
      .andWhere('todo.isVisible = :isVisible', { isVisible: true })
      .getCount();
  }

  async startTodo(todoId: string, userId: string): Promise<Todo | null> {
    const todo = await this.todoRepo.findOne({
      where: { id: todoId, assigneeId: userId },
    });

    if (!todo) {
      return null;
    }

    todo.status = TodoStatus.IN_PROGRESS;
    todo.statusDisplay = TodoService.getStatusDisplay(TodoStatus.IN_PROGRESS);
    todo.startedAt = new Date();
    todo.startedBy = userId;

    return this.todoRepo.save(todo);
  }

  async completeTodo(todoId: string, userId: string, completionNote?: string): Promise<Todo | null> {
    const todo = await this.todoRepo.findOne({
      where: { id: todoId, assigneeId: userId },
    });

    if (!todo) {
      return null;
    }

    todo.status = TodoStatus.COMPLETED;
    todo.statusDisplay = TodoService.getStatusDisplay(TodoStatus.COMPLETED);
    todo.completedAt = new Date();
    todo.completedBy = userId;

    if (completionNote) {
      todo.completionNote = completionNote;
    }

    return this.todoRepo.save(todo);
  }

  async cancelTodo(todoId: string, userId: string, reason?: string): Promise<Todo | null> {
    const todo = await this.todoRepo.findOne({
      where: { id: todoId, assigneeId: userId },
    });

    if (!todo) {
      return null;
    }

    todo.status = TodoStatus.CANCELLED;
    todo.statusDisplay = TodoService.getStatusDisplay(TodoStatus.CANCELLED);
    todo.cancelledAt = new Date();
    todo.cancelledBy = userId;

    if (reason) {
      todo.cancellationReason = reason;
    }

    return this.todoRepo.save(todo);
  }

  async cancelWaybillTodos(waybillId: string, reason?: string): Promise<void> {
    await this.todoRepo.update(
      {
        masterWaybillId: waybillId,
        status: TodoStatus.PENDING,
      },
      {
        status: TodoStatus.CANCELLED,
        statusDisplay: TodoService.getStatusDisplay(TodoStatus.CANCELLED),
        cancelledAt: new Date(),
        cancellationReason: reason || '运单状态变更，待办自动取消',
      }
    );
  }

  async getWaybillPendingTodos(waybillId: string): Promise<Todo[]> {
    return this.todoRepo.find({
      where: {
        masterWaybillId: waybillId,
        status: TodoStatus.PENDING,
        isVisible: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getTodoById(todoId: string): Promise<Todo | null> {
    return this.todoRepo.findOneBy({ id: todoId });
  }
}
