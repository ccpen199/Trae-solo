require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '11084', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'insurance-system-jwt-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  db: {
    path: process.env.DB_PATH || './data/app.sqlite'
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:11085',
  
  roles: {
    POLICYHOLDER: 'policyholder',
    AGENT: 'agent',
    UNDERWRITER: 'underwriter',
    CLAIM_ADJUSTER: 'claim_adjuster',
    ADMIN: 'admin'
  },
  
  policyStatus: {
    DRAFT: 'draft',
    PENDING_APPROVAL: 'pending_approval',
    APPROVED: 'approved',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    LAPSED: 'lapsed',
    CLAIMED: 'claimed'
  },
  
  claimStatus: {
    PENDING: 'pending',
    IN_REVIEW: 'in_review',
    VALIDATING: 'validating',
    APPROVED: 'approved',
    PAYING: 'paying',
    COMPLETED: 'completed',
    REJECTED: 'rejected',
    ESCALATED: 'escalated'
  },
  
  timeLimits: {
    underwriting: {
      auto: 5,
      manual: 24
    },
    claim: {
      initial: 2,
      review: 48,
      payment: 24
    }
  }
};
