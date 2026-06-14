import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Position } from "./Position";
import { Resume } from "./Resume";
import { Interview } from "./Interview";
import { Approval } from "./Approval";

export type CandidateStage = "applied" | "screening" | "ai_screened" | "interview_invited" | "interview_scheduled" | "first_interview" | "second_interview" | "background_check" | "offer" | "hired" | "rejected" | "withdrawn";

@Entity()
export class Candidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: "int", nullable: true })
  age: number;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  education: string;

  @Column({ nullable: true })
  graduationSchool: string;

  @Column({ nullable: true })
  major: string;

  @Column({ type: "int", nullable: true })
  yearsOfExperience: number;

  @Column({ nullable: true })
  currentCompany: string;

  @Column({ nullable: true })
  currentPosition: string;

  @Column({ nullable: true })
  expectedSalaryMin: number;

  @Column({ nullable: true })
  expectedSalaryMax: number;

  @Column({
    type: "varchar",
    default: "applied",
  })
  stage: CandidateStage;

  @Column({ type: "simple-array", nullable: true })
  skillTags: string[];

  @Column({ type: "simple-json", nullable: true })
  aiScreeningResult: {
    keywordMatchScore: number;
    experienceMatchScore: number;
    stabilityScore: number;
    overallScore: number;
    riskLevel: "low" | "medium" | "high";
    summary: string;
    screenedAt: Date;
    matchedKeywords: Array<{ keyword: string; found: boolean; weight: number }>;
    experienceAnalysis: {
      matchedRoles: string[];
      relevantYears: number;
      gap: string;
    };
    stabilityAnalysis: {
      jobChanges: number;
      avgTenure: number;
      trend: string;
    };
  };

  @Column({ type: "simple-json", nullable: true })
  talentProfile: {
    projectExperience: Array<{ name: string; role: string; duration: string; description: string }>;
    resignationReasons: string[];
    strengths: string[];
    weaknesses: string[];
  };

  @ManyToOne(() => Position, (position) => position.candidates)
  @JoinColumn({ name: "positionId" })
  position: Position;

  @Column()
  positionId: number;

  @Column({ type: "int", nullable: true })
  resumeId: number;

  @OneToMany(() => Resume, (resume) => resume.candidate)
  resumes: Resume[];

  @OneToMany(() => Interview, (interview) => interview.candidate)
  interviews: Interview[];

  @OneToMany(() => Approval, (approval) => approval.candidate)
  approvals: Approval[];

  @Column({ nullable: true })
  source: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "simple-json", nullable: true })
  onboardingChecklist: Array<{ item: string; completed: boolean; completedAt?: Date }>;

  @Column({ nullable: true })
  offerSentAt: Date;

  @Column({ nullable: true })
  offerAcceptedAt: Date;

  @Column({ nullable: true })
  onboardDate: Date;

  @Column({ type: "simple-json", nullable: true })
  backgroundCheck: {
    status: "pending" | "in_progress" | "completed" | "failed";
    startedAt?: Date;
    completedAt?: Date;
    reportUrl?: string;
    items: Array<{
      name: string;
      status: "pass" | "fail" | "pending";
      notes?: string;
      checkedAt?: Date;
    }>;
    overallResult?: "pass" | "fail" | "pending";
    notes?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
