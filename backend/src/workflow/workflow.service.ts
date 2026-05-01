import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Review, WorkflowInstance, WorkflowStep } from './entities/review.entity';
import { StartWorkflowDto, ProcessReviewDto } from './dto/workflow.dto';
import { ContentsService } from '../contents/contents.service';
import { AuditService } from '../audit/audit.service';
import {
  ReviewType,
  ReviewStatus,
  WorkflowStatus,
  ContentStatus,
  UserRole,
} from '../common/enums';

const THREE_REVIEW_THREE_PROOF_STEPS = [
  { stepNumber: 1, stepName: '初审', stepType: ReviewType.FIRST_REVIEW, assignedRole: 'CHIEF_EDITOR' },
  { stepNumber: 2, stepName: '一校', stepType: ReviewType.FIRST_PROOFREAD, assignedRole: 'EDITOR' },
  { stepNumber: 3, stepName: '二审', stepType: ReviewType.SECOND_REVIEW, assignedRole: 'CHIEF_EDITOR' },
  { stepNumber: 4, stepName: '二校', stepType: ReviewType.SECOND_PROOFREAD, assignedRole: 'EDITOR' },
  { stepNumber: 5, stepName: '三审', stepType: ReviewType.THIRD_REVIEW, assignedRole: 'CHIEF_EDITOR' },
  { stepNumber: 6, stepName: '三校', stepType: ReviewType.THIRD_PROOFREAD, assignedRole: 'EDITOR' },
];

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(WorkflowInstance)
    private workflowInstanceRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private workflowStepRepository: Repository<WorkflowStep>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private dataSource: DataSource,
    private contentsService: ContentsService,
    private auditService: AuditService,
  ) {}

  async startWorkflow(dto: StartWorkflowDto, userId: string, userRole: UserRole) {
    const { contentId } = dto;

    const content = await this.contentsService.findById(contentId, userId, userRole);

    if (content.status !== ContentStatus.DRAFT) {
      throw new ConflictException('Content is not in draft status');
    }

    const existingWorkflow = await this.workflowInstanceRepository.findOne({
      where: { contentId, status: WorkflowStatus.IN_PROGRESS },
    });

    if (existingWorkflow) {
      throw new ConflictException('Workflow is already in progress for this content');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const workflowInstance = this.workflowInstanceRepository.create({
        contentId,
        workflowType: 'THREE_REVIEW_THREE_PROOF',
        currentStep: 1,
        totalSteps: 6,
        status: WorkflowStatus.IN_PROGRESS,
      });

      const savedInstance = await queryRunner.manager.save(workflowInstance);

      const steps: WorkflowStep[] = [];
      for (const stepConfig of THREE_REVIEW_THREE_PROOF_STEPS) {
        const step = this.workflowStepRepository.create({
          workflowInstanceId: savedInstance.id,
          stepNumber: stepConfig.stepNumber,
          stepName: stepConfig.stepName,
          stepType: stepConfig.stepType,
          assignedRole: stepConfig.assignedRole,
          status: stepConfig.stepNumber === 1 ? ReviewStatus.IN_PROGRESS : ReviewStatus.PENDING,
          startedAt: stepConfig.stepNumber === 1 ? new Date() : null,
        });
        steps.push(step);
      }

      await queryRunner.manager.save(steps);

      await queryRunner.commitTransaction();

      await this.contentsService.updateStatus(
        contentId,
        { status: ContentStatus.PENDING_REVIEW },
        userId,
        userRole,
      );

      await this.auditService.logAction({
        userId,
        action: 'WORKFLOW_START',
        resourceType: 'WORKFLOW',
        resourceId: savedInstance.id,
        resourceTitle: content.title,
        newValue: {
          workflowId: savedInstance.id,
          contentId,
          status: WorkflowStatus.IN_PROGRESS,
        },
      });

      return savedInstance;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getActiveWorkflow(contentId: string) {
    const workflow = await this.workflowInstanceRepository.findOne({
      where: { contentId, status: WorkflowStatus.IN_PROGRESS },
      relations: ['content'],
    });

    if (!workflow) {
      return null;
    }

    const steps = await this.workflowStepRepository.find({
      where: { workflowInstanceId: workflow.id },
      order: { stepNumber: 'ASC' },
      relations: ['assignee', 'review'],
    });

    return { ...workflow, steps };
  }

  async getWorkflowHistory(contentId: string) {
    return this.workflowInstanceRepository.find({
      where: { contentId },
      order: { startedAt: 'DESC' },
      relations: ['content'],
    });
  }

  async getPendingReviews(userId: string, userRole: UserRole) {
    const queryBuilder = this.workflowStepRepository
      .createQueryBuilder('step')
      .leftJoinAndSelect('step.workflowInstance', 'workflow')
      .leftJoinAndSelect('workflow.content', 'content')
      .leftJoinAndSelect('content.author', 'author')
      .where('step.status = :status', { status: ReviewStatus.IN_PROGRESS });

    if (userRole === UserRole.CHIEF_EDITOR) {
      queryBuilder.andWhere('step.assignedRole = :role', { role: 'CHIEF_EDITOR' });
    } else {
      queryBuilder.andWhere(
        '(step.assignedRole = :role OR step.assigneeId = :userId)',
        { role: 'EDITOR', userId },
      );
    }

    return queryBuilder.orderBy('step.stepNumber', 'ASC').getMany();
  }

  async processReview(
    stepId: string,
    dto: ProcessReviewDto,
    userId: string,
    userRole: UserRole,
  ) {
    const step = await this.workflowStepRepository.findOne({
      where: { id: stepId },
      relations: ['workflowInstance'],
    });

    if (!step) {
      throw new NotFoundException(`Workflow step with ID ${stepId} not found`);
    }

    if (step.status !== ReviewStatus.IN_PROGRESS) {
      throw new ConflictException('This step is not currently in progress');
    }

    if (step.assignedRole === 'CHIEF_EDITOR' && userRole !== UserRole.CHIEF_EDITOR) {
      throw new ForbiddenException('You are not authorized to perform this review');
    }

    const workflow = step.workflowInstance;
    const content = await this.contentsService.findById(
      workflow.contentId,
      userId,
      userRole,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const review = this.reviewRepository.create({
        contentId: workflow.contentId,
        contentVersionId: null,
        reviewType: step.stepType,
        reviewerId: userId,
        status: dto.status,
        comment: dto.comment,
        annotations: dto.annotations,
        diffData: dto.diffData,
        reviewedAt: new Date(),
      });

      const savedReview = await queryRunner.manager.save(review);

      step.status = dto.status;
      step.completedAt = new Date();
      step.reviewId = savedReview.id;
      step.assigneeId = userId;
      await queryRunner.manager.save(step);

      if (dto.status === ReviewStatus.APPROVED) {
        if (step.stepNumber < workflow.totalSteps) {
          workflow.currentStep = step.stepNumber + 1;

          const nextStep = await this.workflowStepRepository.findOne({
            where: { workflowInstanceId: workflow.id, stepNumber: step.stepNumber + 1 },
          });

          if (nextStep) {
            nextStep.status = ReviewStatus.IN_PROGRESS;
            nextStep.startedAt = new Date();
            await queryRunner.manager.save(nextStep);
          }

          await queryRunner.manager.save(workflow);
        } else {
          workflow.status = WorkflowStatus.COMPLETED;
          workflow.completedAt = new Date();
          await queryRunner.manager.save(workflow);

          await this.contentsService.updateStatus(
            workflow.contentId,
            { status: ContentStatus.APPROVED },
            userId,
            userRole,
          );
        }
      } else if (dto.status === ReviewStatus.REJECTED) {
        workflow.status = WorkflowStatus.REJECTED;
        await queryRunner.manager.save(workflow);

        await this.contentsService.updateStatus(
          workflow.contentId,
          { status: ContentStatus.REJECTED },
          userId,
          userRole,
        );
      } else if (dto.status === ReviewStatus.NEEDS_REVISION) {
        await this.contentsService.updateStatus(
          workflow.contentId,
          { status: ContentStatus.NEEDS_REVISION },
          userId,
          userRole,
        );
      }

      await queryRunner.commitTransaction();

      await this.auditService.logAction({
        userId,
        action: 'REVIEW_PROCESS',
        resourceType: 'REVIEW',
        resourceId: savedReview.id,
        resourceTitle: content.title,
        newValue: {
          step: step.stepNumber,
          stepName: step.stepName,
          status: dto.status,
          comment: dto.comment,
        },
      });

      return { step, review: savedReview };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getReviewHistory(contentId: string) {
    return this.reviewRepository.find({
      where: { contentId },
      order: { createdAt: 'DESC' },
      relations: ['reviewer'],
    });
  }
}
