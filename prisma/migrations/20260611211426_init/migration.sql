-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'JOB_SEEKER',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);

-- CreateTable
CREATE TABLE "JobSeeker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "birthDate" DATETIME,
    "gender" TEXT,
    "location" TEXT,
    "currentTitle" TEXT,
    "expectedSalary" INTEGER,
    "workYears" REAL,
    "highestDegree" TEXT,
    "major" TEXT,
    "school" TEXT,
    "jobStatus" TEXT,
    "tags" TEXT,
    "skills" TEXT,
    "summary" TEXT,
    CONSTRAINT "JobSeeker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "isHr" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Employer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Employer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "banner" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "foundedYear" INTEGER,
    "headquarters" TEXT,
    "benefits" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "description" TEXT,
    "cultureValues" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT,
    "responsibilities" TEXT,
    "city" TEXT,
    "district" TEXT,
    "address" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryType" TEXT,
    "tags" TEXT,
    "keywords" TEXT,
    "certificateRequirement" TEXT,
    "experienceMin" REAL,
    "experienceMax" REAL,
    "educationMin" TEXT,
    "jobType" TEXT,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "clicksCount" INTEGER NOT NULL DEFAULT 0,
    "applicationsCount" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deadline" DATETIME,
    CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobSeekerId" TEXT NOT NULL,
    "resumeFile" TEXT,
    "resumeText" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "summary" TEXT,
    "parsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Resume_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "JobSeeker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resumeId" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "major" TEXT,
    "degree" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "description" TEXT,
    "gpa" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Education_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkExperience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resumeId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "achievements" TEXT,
    "skillsUsed" TEXT,
    "salary" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "WorkExperience_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectExperience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "description" TEXT,
    "technologies" TEXT,
    "link" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProjectExperience_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "issueDate" DATETIME,
    "expireDate" DATETIME,
    "credentialId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Certificate_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "jobSeekerId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "source" TEXT,
    "coverLetter" TEXT,
    "aiScore" REAL,
    "aiMatchReason" TEXT,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "viewedAt" DATETIME,
    "viewedBy" TEXT,
    CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobApplication_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "JobSeeker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobApplication_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VideoInterview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT,
    "jobSeekerId" TEXT NOT NULL,
    "employerId" TEXT,
    "interviewType" TEXT NOT NULL DEFAULT 'LIVE_VIDEO',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "title" TEXT,
    "scheduledAt" DATETIME,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "roomUrl" TEXT,
    "streamUrl" TEXT,
    "recordingUrl" TEXT,
    "recordingSize" INTEGER,
    "recordingTime" REAL,
    "notes" TEXT,
    "rating" INTEGER,
    "aiAnalysis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    CONSTRAINT "VideoInterview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VideoInterview_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "JobSeeker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterviewSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interviewId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "bookedBy" TEXT,
    CONSTRAINT "InterviewSlot_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "VideoInterview" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterviewRecording" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interviewId" TEXT NOT NULL,
    "recordingUrl" TEXT NOT NULL,
    "duration" REAL,
    "size" INTEGER,
    "format" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterviewRecording_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "VideoInterview" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiveStream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverImage" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "pushUrl" TEXT,
    "pushKey" TEXT,
    "playUrl" TEXT,
    "scheduledAt" DATETIME,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "duration" INTEGER,
    "peakViewers" INTEGER NOT NULL DEFAULT 0,
    "totalViewers" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalDanmakus" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "recorded" BOOLEAN NOT NULL DEFAULT false,
    "recordingUrl" TEXT,
    "category" TEXT,
    "jobCount" INTEGER NOT NULL DEFAULT 0,
    "danmakuEnabled" BOOLEAN NOT NULL DEFAULT true,
    "danmakuModerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LiveStream_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LiveStream_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiveDanmaku" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "liveId" TEXT NOT NULL,
    "userId" TEXT,
    "userType" TEXT,
    "username" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiveDanmaku_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "LiveStream" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiveJobMount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "liveId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "applyCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiveJobMount_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "LiveStream" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LiveJobMount_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiveInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "liveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT,
    "position" TEXT,
    "matchScore" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    "endedAt" DATETIME,
    "duration" INTEGER,
    CONSTRAINT "LiveInvite_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "LiveStream" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VRTour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "panoramaUrl" TEXT NOT NULL,
    "tourData" TEXT,
    "hotspots" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VRTour_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamVlog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "videoUrl" TEXT NOT NULL,
    "duration" INTEGER,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "author" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamVlog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CultureTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CultureTag_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ViewRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewerId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "companyId" TEXT,
    "duration" REAL,
    "heatmapPoints" TEXT,
    "viewDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ViewRecord_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ViewRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobHeatmap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "clicksCount" INTEGER NOT NULL DEFAULT 0,
    "applyCount" INTEGER NOT NULL DEFAULT 0,
    "avgViewTime" REAL,
    "heatmapData" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobHeatmap_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobHeatmap_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HrActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "hrId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HrActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalaryData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobTitle" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "industry" TEXT,
    "experience" TEXT,
    "education" TEXT,
    "p10Salary" REAL,
    "p25Salary" REAL,
    "p50Salary" REAL,
    "p75Salary" REAL,
    "p90Salary" REAL,
    "avgSalary" REAL,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "dataSource" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SalaryReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "p25Salary" REAL,
    "p50Salary" REAL,
    "p75Salary" REAL,
    "avgSalary" REAL,
    "percentileChart" TEXT,
    "comparisonData" TEXT,
    "suggestions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalaryReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalaryReport_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobFair" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "banner" TEXT,
    "type" TEXT NOT NULL DEFAULT 'ONLINE',
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "tags" TEXT,
    "categories" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "venue" TEXT,
    "city" TEXT,
    "maxBooths" INTEGER NOT NULL DEFAULT 50,
    "totalBooths" INTEGER NOT NULL DEFAULT 0,
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "totalApplicants" INTEGER NOT NULL DEFAULT 0,
    "totalCheckins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobFair_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FairBooth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobFairId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "boothNumber" TEXT NOT NULL,
    "boothName" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "banner" TEXT,
    "themeColor" TEXT,
    "layoutConfig" TEXT,
    "liveStreamId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "totalVisitors" INTEGER NOT NULL DEFAULT 0,
    "totalResumes" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FairBooth_jobFairId_fkey" FOREIGN KEY ("jobFairId") REFERENCES "JobFair" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FairBooth_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BoothVisitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boothId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "visitorName" TEXT,
    "visitTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" REAL NOT NULL DEFAULT 0,
    "viewedJobIds" TEXT,
    "downloadedDocs" TEXT,
    "hasSharedResume" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "BoothVisitor_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "FairBooth" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckInRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobFairId" TEXT NOT NULL,
    "jobSeekerId" TEXT NOT NULL,
    "checkInType" TEXT NOT NULL,
    "qrCode" TEXT,
    "scannedBy" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckInRecord_jobFairId_fkey" FOREIGN KEY ("jobFairId") REFERENCES "JobFair" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CheckInRecord_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "JobSeeker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResumeCollection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boothId" TEXT NOT NULL,
    "jobId" TEXT,
    "jobSeekerId" TEXT NOT NULL,
    "resumeId" TEXT,
    "resumeText" TEXT,
    "source" TEXT NOT NULL DEFAULT 'BOOTH',
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiScreenScore" REAL,
    "aiScreenResult" TEXT,
    "matchedJobIds" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    CONSTRAINT "ResumeCollection_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "FairBooth" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResumeCollection_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobSeekerId" TEXT NOT NULL,
    "overallScore" REAL NOT NULL DEFAULT 0,
    "level" TEXT,
    "careerLevel" TEXT,
    "industryTags" TEXT,
    "skillTags" TEXT,
    "communicationScore" REAL,
    "technicalScore" REAL,
    "experienceScore" REAL,
    "educationScore" REAL,
    "growthScore" REAL,
    "careerTrajectory" TEXT,
    "salaryExpectationBand" TEXT,
    "preferredLocations" TEXT,
    "preferredIndustries" TEXT,
    "preferredRoles" TEXT,
    "lastUpdated" DATETIME NOT NULL,
    CONSTRAINT "CandidateProfile_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "JobSeeker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileDimension" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "evidence" TEXT,
    "sources" TEXT,
    "lastUpdated" DATETIME NOT NULL,
    CONSTRAINT "ProfileDimension_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileBehavior" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileBehavior_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "matchReasons" TEXT,
    "source" TEXT NOT NULL DEFAULT 'AI',
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "isApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobRecommendation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobRecommendation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIScreeningTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT,
    "resumeText" TEXT,
    "requirements" TEXT,
    "keywords" TEXT,
    "minExperience" REAL,
    "requiredCerts" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "result" TEXT,
    "overallScore" REAL,
    "keywordScore" REAL,
    "experienceScore" REAL,
    "educationScore" REAL,
    "certScore" REAL,
    "skillScore" REAL,
    "matchedKeywords" TEXT,
    "missingKeywords" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIScreeningTask_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_FairBoothToJob" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_FairBoothToJob_A_fkey" FOREIGN KEY ("A") REFERENCES "FairBooth" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FairBoothToJob_B_fkey" FOREIGN KEY ("B") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_email_idx" ON "User"("role", "email");

-- CreateIndex
CREATE UNIQUE INDEX "JobSeeker_userId_key" ON "JobSeeker"("userId");

-- CreateIndex
CREATE INDEX "JobSeeker_location_workYears_idx" ON "JobSeeker"("location", "workYears");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_userId_key" ON "Employer"("userId");

-- CreateIndex
CREATE INDEX "Employer_companyId_isHr_idx" ON "Employer"("companyId", "isHr");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_industry_verified_idx" ON "Company"("industry", "verified");

-- CreateIndex
CREATE INDEX "Job_companyId_status_idx" ON "Job"("companyId", "status");

-- CreateIndex
CREATE INDEX "Job_city_salaryMin_idx" ON "Job"("city", "salaryMin");

-- CreateIndex
CREATE INDEX "Resume_jobSeekerId_isDefault_idx" ON "Resume"("jobSeekerId", "isDefault");

-- CreateIndex
CREATE INDEX "Education_resumeId_sortOrder_idx" ON "Education"("resumeId", "sortOrder");

-- CreateIndex
CREATE INDEX "WorkExperience_resumeId_sortOrder_idx" ON "WorkExperience"("resumeId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProjectExperience_resumeId_sortOrder_idx" ON "ProjectExperience"("resumeId", "sortOrder");

-- CreateIndex
CREATE INDEX "Certificate_resumeId_sortOrder_idx" ON "Certificate"("resumeId", "sortOrder");

-- CreateIndex
CREATE INDEX "JobApplication_jobId_status_idx" ON "JobApplication"("jobId", "status");

-- CreateIndex
CREATE INDEX "JobApplication_jobSeekerId_status_idx" ON "JobApplication"("jobSeekerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobId_jobSeekerId_key" ON "JobApplication"("jobId", "jobSeekerId");

-- CreateIndex
CREATE INDEX "VideoInterview_jobSeekerId_status_idx" ON "VideoInterview"("jobSeekerId", "status");

-- CreateIndex
CREATE INDEX "VideoInterview_status_scheduledAt_idx" ON "VideoInterview"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "InterviewSlot_interviewId_isBooked_idx" ON "InterviewSlot"("interviewId", "isBooked");

-- CreateIndex
CREATE INDEX "LiveStream_companyId_status_idx" ON "LiveStream"("companyId", "status");

-- CreateIndex
CREATE INDEX "LiveStream_status_scheduledAt_idx" ON "LiveStream"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "LiveDanmaku_liveId_status_idx" ON "LiveDanmaku"("liveId", "status");

-- CreateIndex
CREATE INDEX "LiveDanmaku_liveId_createdAt_idx" ON "LiveDanmaku"("liveId", "createdAt");

-- CreateIndex
CREATE INDEX "LiveJobMount_liveId_sortOrder_idx" ON "LiveJobMount"("liveId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "LiveJobMount_liveId_jobId_key" ON "LiveJobMount"("liveId", "jobId");

-- CreateIndex
CREATE INDEX "LiveInvite_liveId_status_idx" ON "LiveInvite"("liveId", "status");

-- CreateIndex
CREATE INDEX "VRTour_companyId_status_idx" ON "VRTour"("companyId", "status");

-- CreateIndex
CREATE INDEX "TeamVlog_companyId_status_idx" ON "TeamVlog"("companyId", "status");

-- CreateIndex
CREATE INDEX "CultureTag_companyId_idx" ON "CultureTag"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CultureTag_companyId_name_key" ON "CultureTag"("companyId", "name");

-- CreateIndex
CREATE INDEX "ViewRecord_viewerId_targetType_idx" ON "ViewRecord"("viewerId", "targetType");

-- CreateIndex
CREATE INDEX "ViewRecord_targetType_targetId_idx" ON "ViewRecord"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ViewRecord_viewDate_idx" ON "ViewRecord"("viewDate");

-- CreateIndex
CREATE UNIQUE INDEX "JobHeatmap_jobId_key" ON "JobHeatmap"("jobId");

-- CreateIndex
CREATE INDEX "JobHeatmap_companyId_idx" ON "JobHeatmap"("companyId");

-- CreateIndex
CREATE INDEX "HrActivity_companyId_hrId_idx" ON "HrActivity"("companyId", "hrId");

-- CreateIndex
CREATE INDEX "HrActivity_action_createdAt_idx" ON "HrActivity"("action", "createdAt");

-- CreateIndex
CREATE INDEX "SalaryData_jobTitle_city_idx" ON "SalaryData"("jobTitle", "city");

-- CreateIndex
CREATE INDEX "SalaryData_industry_experience_idx" ON "SalaryData"("industry", "experience");

-- CreateIndex
CREATE INDEX "SalaryReport_companyId_reportType_idx" ON "SalaryReport"("companyId", "reportType");

-- CreateIndex
CREATE INDEX "JobFair_companyId_status_idx" ON "JobFair"("companyId", "status");

-- CreateIndex
CREATE INDEX "JobFair_type_startDate_idx" ON "JobFair"("type", "startDate");

-- CreateIndex
CREATE INDEX "FairBooth_jobFairId_status_idx" ON "FairBooth"("jobFairId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FairBooth_jobFairId_boothNumber_key" ON "FairBooth"("jobFairId", "boothNumber");

-- CreateIndex
CREATE INDEX "BoothVisitor_boothId_visitorId_idx" ON "BoothVisitor"("boothId", "visitorId");

-- CreateIndex
CREATE INDEX "CheckInRecord_jobFairId_timestamp_idx" ON "CheckInRecord"("jobFairId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInRecord_jobFairId_jobSeekerId_key" ON "CheckInRecord"("jobFairId", "jobSeekerId");

-- CreateIndex
CREATE INDEX "ResumeCollection_boothId_status_idx" ON "ResumeCollection"("boothId", "status");

-- CreateIndex
CREATE INDEX "ResumeCollection_status_aiScreenScore_idx" ON "ResumeCollection"("status", "aiScreenScore");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_jobSeekerId_key" ON "CandidateProfile"("jobSeekerId");

-- CreateIndex
CREATE INDEX "CandidateProfile_overallScore_idx" ON "CandidateProfile"("overallScore");

-- CreateIndex
CREATE INDEX "ProfileDimension_profileId_dimension_idx" ON "ProfileDimension"("profileId", "dimension");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileDimension_profileId_dimension_key" ON "ProfileDimension"("profileId", "dimension");

-- CreateIndex
CREATE INDEX "ProfileBehavior_profileId_actionType_idx" ON "ProfileBehavior"("profileId", "actionType");

-- CreateIndex
CREATE INDEX "ProfileBehavior_timestamp_idx" ON "ProfileBehavior"("timestamp");

-- CreateIndex
CREATE INDEX "JobRecommendation_profileId_score_idx" ON "JobRecommendation"("profileId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "JobRecommendation_profileId_jobId_key" ON "JobRecommendation"("profileId", "jobId");

-- CreateIndex
CREATE INDEX "UserActivity_userId_action_idx" ON "UserActivity"("userId", "action");

-- CreateIndex
CREATE INDEX "UserActivity_createdAt_idx" ON "UserActivity"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AIScreeningTask_jobId_status_idx" ON "AIScreeningTask"("jobId", "status");

-- CreateIndex
CREATE INDEX "AIScreeningTask_status_createdAt_idx" ON "AIScreeningTask"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_FairBoothToJob_AB_unique" ON "_FairBoothToJob"("A", "B");

-- CreateIndex
CREATE INDEX "_FairBoothToJob_B_index" ON "_FairBoothToJob"("B");
