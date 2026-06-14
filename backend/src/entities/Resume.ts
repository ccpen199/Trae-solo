import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Candidate } from "./Candidate";

@Entity()
export class Resume {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Candidate, (candidate) => candidate.resumes)
  @JoinColumn({ name: "candidateId" })
  candidate: Candidate;

  @Column()
  candidateId: number;

  @Column({ nullable: true })
  fileName: string;

  @Column({ nullable: true })
  filePath: string;

  @Column({ type: "int", default: 0 })
  fileSize: number;

  @Column({ nullable: true })
  fileType: string;

  @Column({ type: "text", nullable: true })
  parsedContent: string;

  @Column({ type: "simple-json", nullable: true })
  parsedData: {
    education: Array<{ school: string; degree: string; major: string; startDate: string; endDate: string }>;
    workExperience: Array<{ company: string; position: string; startDate: string; endDate: string; description: string }>;
    projects: Array<{ name: string; role: string; description: string }>;
    skills: string[];
    certifications: string[];
  };

  @Column({ type: "simple-json", nullable: true })
  analysisResult: {
    keywordMatches: string[];
    missingKeywords: string[];
    jobFitScore: number;
    experienceRelevance: number;
    educationMatch: boolean;
    salaryExpectationMatch: boolean;
    summary: string;
  };

  @Column({ default: false })
  isParsed: boolean;

  @Column({ default: false })
  isAnalyzed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
