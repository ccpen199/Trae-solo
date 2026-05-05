import { Repository, In, IsNull, Not } from "typeorm";
import { AppDataSource } from "../config/database";
import { Bug } from "../models/Bug";
import { BugHistory } from "../models/BugHistory";
import { BugStatus, BugSeverity, BugPriority, UserRole } from "../utils/enums";

const BUG_STATUS_TRANSITIONS: Record<BugStatus, BugStatus[]> = {
  [BugStatus.NEW]: [BugStatus.ASSIGNED, BugStatus.REJECTED],
  [BugStatus.ASSIGNED]: [BugStatus.IN_PROGRESS, BugStatus.NEW, BugStatus.REJECTED],
  [BugStatus.IN_PROGRESS]: [BugStatus.RESOLVED, BugStatus.ASSIGNED],
  [BugStatus.RESOLVED]: [BugStatus.VERIFIED, BugStatus.REOPENED],
  [BugStatus.VERIFIED]: [BugStatus.CLOSED, BugStatus.REOPENED],
  [BugStatus.REOPENED]: [BugStatus.ASSIGNED, BugStatus.IN_PROGRESS],
  [BugStatus.CLOSED]: [BugStatus.REOPENED],
  [BugStatus.REJECTED]: [BugStatus.NEW, BugStatus.REOPENED],
};

export class BugService {
  private bugRepository: Repository<Bug>;
  private bugHistoryRepository: Repository<BugHistory>;

  constructor() {
    this.bugRepository = AppDataSource.getRepository(Bug);
    this.bugHistoryRepository = AppDataSource.getRepository(BugHistory);
  }

  canTransition(from: BugStatus, to: BugStatus): boolean {
    const allowed = BUG_STATUS_TRANSITIONS[from];
    return allowed?.includes(to) || false;
  }

  getAllowedTransitions(status: BugStatus): BugStatus[] {
    return BUG_STATUS_TRANSITIONS[status] || [];
  }

  private async generateBugNumber(projectCode: string): Promise<string> {
    const count = await this.bugRepository.count({
      where: { project: { code: projectCode } },
    });

    const paddedNumber = (count + 1).toString().padStart(5, "0");
    return `${projectCode}-${paddedNumber}`;
  }

  async createBug(
    projectId: string,
    title: string,
    description: string,
    reporterId: string,
    options?: {
      moduleId?: string;
      requirementId?: string;
      versionId?: string;
      assigneeId?: string;
      severity?: BugSeverity;
      priority?: BugPriority;
      stepsToReproduce?: string;
      expectedResult?: string;
      actualResult?: string;
      environment?: string;
      attachments?: string;
    }
  ): Promise<Bug> {
    const project = await AppDataSource
      .createQueryBuilder("project", "p")
      .where("p.id = :id", { id: projectId })
      .getOne();

    if (!project) {
      throw new Error("Project not found");
    }

    const bugNumber = await this.generateBugNumber(project.code);

    const bug = this.bugRepository.create({
      bugNumber,
      title,
      description,
      projectId,
      reporterId,
      moduleId: options?.moduleId,
      requirementId: options?.requirementId,
      versionId: options?.versionId,
      assigneeId: options?.assigneeId,
      severity: options?.severity || BugSeverity.MEDIUM,
      priority: options?.priority || BugPriority.P3,
      status: BugStatus.NEW,
      isPublished: false,
      stepsToReproduce: options?.stepsToReproduce,
      expectedResult: options?.expectedResult,
      actualResult: options?.actualResult,
      environment: options?.environment,
      attachments: options?.attachments,
    });

    const savedBug = await this.bugRepository.save(bug);

    await this.createHistory(
      savedBug.id,
      null,
      BugStatus.NEW,
      "Bug created",
      reporterId
    );

    return savedBug;
  }

  async getBugById(bugId: string): Promise<Bug | null> {
    return this.bugRepository.findOne({
      where: { id: bugId },
      relations: [
        "project",
        "module",
        "requirement",
        "version",
        "reporter",
        "assignee",
        "history",
        "history.user",
      ],
      order: {
        history: { createdAt: "DESC" },
      },
    });
  }

  async getBugs(options?: {
    projectId?: string;
    moduleId?: string;
    requirementId?: string;
    versionId?: string;
    status?: BugStatus | BugStatus[];
    severity?: BugSeverity;
    priority?: BugPriority;
    assigneeId?: string;
    reporterId?: string;
    isPublished?: boolean;
    search?: string;
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<{ bugs: Bug[]; total: number }> {
    const qb = this.bugRepository.createQueryBuilder("bug");

    qb.leftJoinAndSelect("bug.project", "project")
      .leftJoinAndSelect("bug.module", "module")
      .leftJoinAndSelect("bug.reporter", "reporter")
      .leftJoinAndSelect("bug.assignee", "assignee");

    if (options?.projectId) {
      qb.andWhere("bug.projectId = :projectId", { projectId: options.projectId });
    }

    if (options?.moduleId) {
      qb.andWhere("bug.moduleId = :moduleId", { moduleId: options.moduleId });
    }

    if (options?.requirementId) {
      qb.andWhere("bug.requirementId = :requirementId", { requirementId: options.requirementId });
    }

    if (options?.versionId) {
      qb.andWhere("bug.versionId = :versionId", { versionId: options.versionId });
    }

    if (options?.status) {
      if (Array.isArray(options.status)) {
        qb.andWhere("bug.status IN (:...status)", { status: options.status });
      } else {
        qb.andWhere("bug.status = :status", { status: options.status });
      }
    }

    if (options?.severity) {
      qb.andWhere("bug.severity = :severity", { severity: options.severity });
    }

    if (options?.priority) {
      qb.andWhere("bug.priority = :priority", { priority: options.priority });
    }

    if (options?.assigneeId) {
      qb.andWhere("bug.assigneeId = :assigneeId", { assigneeId: options.assigneeId });
    }

    if (options?.reporterId) {
      qb.andWhere("bug.reporterId = :reporterId", { reporterId: options.reporterId });
    }

    if (options?.isPublished !== undefined) {
      qb.andWhere("bug.isPublished = :isPublished", { isPublished: options.isPublished });
    }

    if (options?.search) {
      qb.andWhere(
        "(bug.title LIKE :search OR bug.description LIKE :search OR bug.bugNumber LIKE :search)",
        { search: `%${options.search}%` }
      );
    }

    const sortField = options?.sortBy || "createdAt";
    const sortDir = options?.sortOrder || "DESC";
    qb.orderBy(`bug.${sortField}`, sortDir);

    if (options?.skip !== undefined) {
      qb.skip(options.skip);
    }

    if (options?.take !== undefined) {
      qb.take(options.take);
    }

    const [bugs, total] = await qb.getManyAndCount();

    return { bugs, total };
  }

  async updateBug(
    bugId: string,
    updates: Partial<
      Pick<
        Bug,
        | "title"
        | "description"
        | "moduleId"
        | "requirementId"
        | "versionId"
        | "assigneeId"
        | "severity"
        | "priority"
        | "stepsToReproduce"
        | "expectedResult"
        | "actualResult"
        | "environment"
        | "attachments"
      >
    >,
    userId: string
  ): Promise<Bug> {
    const bug = await this.bugRepository.findOne({
      where: { id: bugId },
    });

    if (!bug) {
      throw new Error("Bug not found");
    }

    const changedFields: Record<string, { old: any; new: any }> = {};

    const keys = Object.keys(updates) as (keyof typeof updates)[];
    for (const key of keys) {
      if (bug[key] !== updates[key]) {
        changedFields[key] = {
          old: bug[key],
          new: updates[key],
        };
      }
    }

    Object.assign(bug, updates);

    const savedBug = await this.bugRepository.save(bug);

    if (Object.keys(changedFields).length > 0) {
      await this.createHistory(
        bugId,
        bug.status,
        bug.status,
        "Bug updated",
        userId,
        changedFields
      );
    }

    return savedBug;
  }

  async updateBugStatus(
    bugId: string,
    newStatus: BugStatus,
    userId: string,
    comment?: string
  ): Promise<Bug> {
    const bug = await this.bugRepository.findOne({
      where: { id: bugId },
    });

    if (!bug) {
      throw new Error("Bug not found");
    }

    if (!this.canTransition(bug.status, newStatus)) {
      throw new Error(
        `Cannot transition from ${bug.status} to ${newStatus}. Allowed transitions: ${this.getAllowedTransitions(
          bug.status
        ).join(", ")}`
      );
    }

    const oldStatus = bug.status;
    bug.status = newStatus;

    if (newStatus === BugStatus.RESOLVED) {
      bug.resolvedAt = new Date();
    }

    if (newStatus === BugStatus.CLOSED) {
      bug.closedAt = new Date();
    }

    const savedBug = await this.bugRepository.save(bug);

    await this.createHistory(
      bugId,
      oldStatus,
      newStatus,
      comment || `Status changed from ${oldStatus} to ${newStatus}`,
      userId
    );

    return savedBug;
  }

  async publishBugs(bugIds: string[], userId: string): Promise<Bug[]> {
    const bugs = await this.bugRepository.findBy({
      id: In(bugIds),
      isPublished: false,
    });

    if (bugs.length === 0) {
      throw new Error("No unpublished bugs found");
    }

    for (const bug of bugs) {
      bug.isPublished = true;
    }

    const savedBugs = await this.bugRepository.save(bugs);

    for (const bug of savedBugs) {
      await this.createHistory(
        bug.id,
        bug.status,
        bug.status,
        "Bug published",
        userId
      );
    }

    return savedBugs;
  }

  async deleteBug(bugId: string, userId: string): Promise<void> {
    const bug = await this.bugRepository.findOne({
      where: { id: bugId },
    });

    if (!bug) {
      throw new Error("Bug not found");
    }

    await this.bugHistoryRepository.delete({ bugId });
    await this.bugRepository.remove(bug);
  }

  async assignBug(
    bugId: string,
    assigneeId: string,
    userId: string
  ): Promise<Bug> {
    const bug = await this.bugRepository.findOne({
      where: { id: bugId },
    });

    if (!bug) {
      throw new Error("Bug not found");
    }

    const oldAssigneeId = bug.assigneeId;
    bug.assigneeId = assigneeId;

    if (bug.status === BugStatus.NEW && assigneeId) {
      bug.status = BugStatus.ASSIGNED;
    }

    const savedBug = await this.bugRepository.save(bug);

    await this.createHistory(
      bugId,
      oldAssigneeId ? bug.status : BugStatus.NEW,
      bug.status,
      `Assigned to user: ${assigneeId}`,
      userId,
      {
        assigneeId: {
          old: oldAssigneeId,
          new: assigneeId,
        },
      }
    );

    return savedBug;
  }

  private async createHistory(
    bugId: string,
    previousStatus: BugStatus | null,
    newStatus: BugStatus | null,
    comment: string,
    userId: string,
    changedFields?: Record<string, { old: any; new: any }>
  ): Promise<BugHistory> {
    const historyData = {
      bugId,
      previousStatus,
      newStatus,
      comment,
      userId,
      changedFields,
    } as any;

    const history = this.bugHistoryRepository.create(historyData);

    return this.bugHistoryRepository.save(history) as Promise<BugHistory>;
  }

  async getBugHistory(bugId: string): Promise<BugHistory[]> {
    return this.bugHistoryRepository.find({
      where: { bugId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
  }

  async countBugsByStatus(projectId?: string): Promise<Record<BugStatus, number>> {
    const qb = this.bugRepository
      .createQueryBuilder("bug")
      .select("bug.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("bug.status");

    if (projectId) {
      qb.where("bug.projectId = :projectId", { projectId });
    }

    const result = await qb.getRawMany();

    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.status] = parseInt(row.count);
    }

    return counts as Record<BugStatus, number>;
  }

  async countBugsBySeverity(projectId?: string): Promise<Record<BugSeverity, number>> {
    const qb = this.bugRepository
      .createQueryBuilder("bug")
      .select("bug.severity", "severity")
      .addSelect("COUNT(*)", "count")
      .groupBy("bug.severity");

    if (projectId) {
      qb.where("bug.projectId = :projectId", { projectId });
    }

    const result = await qb.getRawMany();

    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.severity] = parseInt(row.count);
    }

    return counts as Record<BugSeverity, number>;
  }
}

export const bugService = new BugService();
