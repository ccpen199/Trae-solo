import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Candidate } from "./Candidate";
import { User } from "./User";
import { Position } from "./Position";

export type InterviewType = "phone" | "video" | "onsite";
export type InterviewStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
export type InterviewRound = "first" | "second" | "third" | "final" | "hr";

@Entity()
export class Interview {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Candidate, (candidate) => candidate.interviews)
  @JoinColumn({ name: "candidateId" })
  candidate: Candidate;

  @Column()
  candidateId: number;

  @ManyToOne(() => User, (user) => user.interviews)
  @JoinColumn({ name: "interviewerId" })
  interviewer: User;

  @Column()
  interviewerId: number;

  @Column({ type: "int", nullable: true })
  positionId: number;

  @ManyToOne(() => Position, { nullable: true })
  @JoinColumn({ name: "positionId" })
  position: Position;

  @Column({
    type: "varchar",
    default: "video",
  })
  type: InterviewType;

  @Column({
    type: "varchar",
    default: "first",
  })
  round: InterviewRound;

  @Column({
    type: "varchar",
    default: "scheduled",
  })
  status: InterviewStatus;

  @Column()
  scheduledAt: Date;

  @Column({ type: "int", default: 60 })
  duration: number;

  @Column({ nullable: true })
  roomId: string;

  @Column({ nullable: true })
  meetingUrl: string;

  @Column({ type: "text", nullable: true })
  interviewQuestions: string;

  @Column({ type: "text", nullable: true })
  transcript: string;

  @Column({ type: "simple-json", nullable: true })
  transcriptData: Array<{
    speaker: string;
    timestamp: number;
    text: string;
    isKeyPoint: boolean;
    isFinal: boolean;
  }>;

  @Column({ type: "simple-json", nullable: true })
  behaviorMarkers: Array<{
    timestamp: number;
    marker: string;
    description: string;
    severity: "positive" | "neutral" | "negative";
  }>;

  @Column({ type: "simple-json", nullable: true })
  evaluation: {
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    culturalFitScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendation: "strong_hire" | "hire" | "no_hire" | "pass";
    notes: string;
    evaluatedAt: Date;
  };

  @Column({ type: "simple-json", nullable: true })
  recordingInfo: {
    hasRecording: boolean;
    recordingUrl: string;
    recordingDuration: number;
  };

  @Column({ type: "simple-array", nullable: true })
  sharedFiles: string[];

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @Column({ nullable: true })
  cancelledReason: string;

  @Column({ type: "text", nullable: true })
  feedback: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
