export enum UserRole {
  ADMIN = "admin",
  TEST_LEAD = "test_lead",
  TESTER = "tester",
  DEVELOPER = "developer",
  VIEWER = "viewer",
}

export enum BugStatus {
  NEW = "new",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  VERIFIED = "verified",
  REOPENED = "reopened",
  CLOSED = "closed",
  REJECTED = "rejected",
}

export enum BugSeverity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  TRIVIAL = "trivial",
}

export enum BugPriority {
  P1 = "p1",
  P2 = "p2",
  P3 = "p3",
  P4 = "p4",
}

export enum TestCaseStatus {
  DRAFT = "draft",
  REVIEW = "review",
  APPROVED = "approved",
  DEPRECATED = "deprecated",
}

export enum TestCasePriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum VersionStatus {
  PLANNING = "planning",
  DEVELOPMENT = "development",
  TESTING = "testing",
  RELEASED = "released",
  ARCHIVED = "archived",
}

export enum RequirementStatus {
  DRAFT = "draft",
  REVIEW = "review",
  APPROVED = "approved",
  IMPLEMENTED = "implemented",
  TESTED = "tested",
  RELEASED = "released",
}
