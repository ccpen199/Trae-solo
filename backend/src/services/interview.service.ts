import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../database/data-source";
import { Interview, InterviewStatus } from "../entities/Interview";
import { Candidate } from "../entities/Candidate";

export interface InterviewRoom {
  roomId: string;
  interviewId: number;
  candidateId: number;
  interviewerId: number;
  participants: Array<{ userId: number; name: string; role: string; connected: boolean }>;
  startTime?: Date;
  endTime?: Date;
  status: "waiting" | "in_progress" | "ended";
  iceCandidates: Array<{ userId: number; candidate: any }>;
  offers: Array<{ from: number; to: number; offer: any }>;
  answers: Array<{ from: number; to: number; answer: any }>;
}

export class InterviewService {
  private static activeRooms: Map<string, InterviewRoom> = new Map();

  public static async createInterview(
    candidateId: number,
    interviewerId: number,
    positionId: number,
    scheduledAt: Date,
    type: "phone" | "video" | "onsite",
    round: "first" | "second" | "third" | "final" | "hr",
    duration: number = 60
  ): Promise<Interview> {
    const interviewRepository = AppDataSource.getRepository(Interview);

    const roomId = uuidv4();
    const meetingUrl = `/interview/${roomId}`;

    const interview = interviewRepository.create({
      candidateId,
      interviewerId,
      positionId,
      type,
      round,
      scheduledAt,
      duration,
      roomId,
      meetingUrl,
      status: "scheduled",
    });

    await interviewRepository.save(interview);

    const candidateRepository = AppDataSource.getRepository(Candidate);
    await candidateRepository.update(candidateId, { stage: "interview_scheduled" });

    return interview;
  }

  public static async startInterview(interviewId: number): Promise<InterviewRoom> {
    const interviewRepository = AppDataSource.getRepository(Interview);
    const interview = await interviewRepository.findOne({ where: { id: interviewId } });

    if (!interview) {
      throw new Error("面试不存在");
    }

    interview.status = "in_progress";
    interview.startedAt = new Date();
    await interviewRepository.save(interview);

    const room: InterviewRoom = {
      roomId: interview.roomId || uuidv4(),
      interviewId,
      candidateId: interview.candidateId,
      interviewerId: interview.interviewerId,
      participants: [],
      status: "in_progress",
      iceCandidates: [],
      offers: [],
      answers: [],
    };

    this.activeRooms.set(room.roomId, room);

    return room;
  }

  public static async endInterview(interviewId: number): Promise<Interview> {
    const interviewRepository = AppDataSource.getRepository(Interview);
    const interview = await interviewRepository.findOne({ where: { id: interviewId } });

    if (!interview) {
      throw new Error("面试不存在");
    }

    interview.status = "completed";
    interview.endedAt = new Date();
    await interviewRepository.save(interview);

    if (interview.roomId) {
      this.activeRooms.delete(interview.roomId);
    }

    return interview;
  }

  public static getRoom(roomId: string): InterviewRoom | undefined {
    return this.activeRooms.get(roomId);
  }

  public static addParticipant(roomId: string, userId: number, name: string, role: string): void {
    const room = this.activeRooms.get(roomId);
    if (room) {
      const existing = room.participants.find((p) => p.userId === userId);
      if (existing) {
        existing.connected = true;
      } else {
        room.participants.push({ userId, name, role, connected: true });
      }
    }
  }

  public static removeParticipant(roomId: string, userId: number): void {
    const room = this.activeRooms.get(roomId);
    if (room) {
      const participant = room.participants.find((p) => p.userId === userId);
      if (participant) {
        participant.connected = false;
      }
    }
  }

  public static addIceCandidate(roomId: string, userId: number, candidate: any): void {
    const room = this.activeRooms.get(roomId);
    if (room) {
      room.iceCandidates.push({ userId, candidate });
    }
  }

  public static addOffer(roomId: string, from: number, to: number, offer: any): void {
    const room = this.activeRooms.get(roomId);
    if (room) {
      room.offers.push({ from, to, offer });
    }
  }

  public static addAnswer(roomId: string, from: number, to: number, answer: any): void {
    const room = this.activeRooms.get(roomId);
    if (room) {
      room.answers.push({ from, to, answer });
    }
  }

  public static async saveTranscript(
    interviewId: number,
    transcriptData: Array<{ speaker: string; timestamp: number; text: string; isKeyPoint: boolean }>
  ): Promise<void> {
    const interviewRepository = AppDataSource.getRepository(Interview);
    const interview = await interviewRepository.findOne({ where: { id: interviewId } });

    if (!interview) {
      throw new Error("面试不存在");
    }

    interview.transcriptData = transcriptData;
    interview.transcript = transcriptData.map((t) => `[${new Date(t.timestamp * 1000).toISOString().substr(11, 8)}] ${t.speaker}: ${t.text}`).join("\n");

    await interviewRepository.save(interview);
  }

  public static async addBehaviorMarker(
    interviewId: number,
    timestamp: number,
    marker: string,
    description: string,
    severity: "positive" | "neutral" | "negative"
  ): Promise<void> {
    const interviewRepository = AppDataSource.getRepository(Interview);
    const interview = await interviewRepository.findOne({ where: { id: interviewId } });

    if (!interview) {
      throw new Error("面试不存在");
    }

    if (!interview.behaviorMarkers) {
      interview.behaviorMarkers = [];
    }

    interview.behaviorMarkers.push({ timestamp, marker, description, severity });
    await interviewRepository.save(interview);
  }

  public static async submitEvaluation(
    interviewId: number,
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
    }
  ): Promise<Interview> {
    const interviewRepository = AppDataSource.getRepository(Interview);
    const interview = await interviewRepository.findOne({ where: { id: interviewId } });

    if (!interview) {
      throw new Error("面试不存在");
    }

    interview.evaluation = {
      ...evaluation,
      evaluatedAt: new Date(),
    };

    await interviewRepository.save(interview);

    const candidateRepository = AppDataSource.getRepository(Candidate);
    const candidate = await candidateRepository.findOne({ where: { id: interview.candidateId } });

    if (candidate) {
      if (evaluation.recommendation === "strong_hire" || evaluation.recommendation === "hire") {
        if (interview.round === "first") {
          candidate.stage = "second_interview";
        } else if (interview.round === "second" || interview.round === "third") {
          candidate.stage = "background_check";
        } else if (interview.round === "final" || interview.round === "hr") {
          candidate.stage = "offer";
        }
      } else if (evaluation.recommendation === "no_hire") {
        candidate.stage = "rejected";
      }
      await candidateRepository.save(candidate);
    }

    return interview;
  }

  public static generateInterviewQuestions(position: any, round: string): string[] {
    const baseQuestions = [
      "请简单介绍一下你自己？",
      "为什么对这个职位感兴趣？",
      "请分享一个你最有成就感的项目经历？",
      "你在工作中遇到的最大挑战是什么？如何解决的？",
      "你对我们公司有什么了解？",
    ];

    const technicalQuestions = [
      "请描述一下你的技术栈和擅长的领域？",
      "请解释一个你最近学习的新技术？",
      "如何处理技术债务？",
    ];

    const softQuestions = [
      "如何处理团队中的冲突？",
      "描述一次你需要快速学习新技能的经历？",
      "你的职业规划是什么？",
    ];

    const finalQuestions = [
      "你对薪资的期望是什么？",
      "最快什么时候可以入职？",
      "你还有什么问题想问我们？",
    ];

    let questions = [...baseQuestions];

    if (round === "first" || round === "second") {
      questions = [...questions, ...technicalQuestions];
    }

    if (round === "hr" || round === "final") {
      questions = [...questions, ...softQuestions, ...finalQuestions];
    }

    return questions;
  }
}
