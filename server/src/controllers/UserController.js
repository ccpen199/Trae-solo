const User = require('../models/User');
const QualityCreditEngine = require('../engines/QualityCreditEngine');
const RevenueSettlementEngine = require('../engines/RevenueSettlementEngine');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class UserController {
  constructor() {
    this.qualityCreditEngine = new QualityCreditEngine();
    this.revenueSettlementEngine = new RevenueSettlementEngine();
  }

  generateToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  async register(req, res) {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username, email, and password are required'
        });
      }

      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this username or email already exists'
        });
      }

      const user = new User({
        username,
        email,
        password,
        role: role || 'questioner',
        profile: {
          nickname: username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          bio: '',
          expertise: []
        },
        creditScore: 100,
        creditLevel: 'bronze',
        activityWeight: 1.0,
        balance: 100,
        points: 500,
        status: 'active',
        isVerified: true,
        metadata: {
          questionCount: 0,
          answerCount: 0,
          acceptedAnswerCount: 0,
          voteReceived: 0,
          voteGiven: 0
        }
      });

      await user.save();

      const token = this.generateToken(user);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile: user.profile,
            creditScore: user.creditScore,
            creditLevel: user.creditLevel,
            balance: user.balance,
            points: user.points,
            status: user.status
          },
          token
        }
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to register user'
      });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required'
        });
      }

      const user = await User.findOne({
        $or: [{ username }, { email: username }]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: `Account is ${user.status}. Please contact support.`
        });
      }

      user.lastLoginAt = new Date();
      user.lastActiveAt = new Date();
      await user.save();

      const token = this.generateToken(user);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile: user.profile,
            creditScore: user.creditScore,
            creditLevel: user.creditLevel,
            activityWeight: user.activityWeight,
            balance: user.balance,
            points: user.points,
            status: user.status,
            metadata: user.metadata
          },
          token
        }
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to login'
      });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const userId = req.user._id;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      user.lastActiveAt = new Date();
      await user.save();

      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile,
          creditScore: user.creditScore,
          creditLevel: user.creditLevel,
          activityWeight: user.activityWeight,
          balance: user.balance,
          points: user.points,
          status: user.status,
          isVerified: user.isVerified,
          notificationPreferences: user.notificationPreferences,
          metadata: user.metadata,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user._id;
      const { profile, notificationPreferences } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (profile) {
        user.profile = {
          ...user.profile,
          ...profile
        };
      }

      if (notificationPreferences) {
        user.notificationPreferences = {
          ...user.notificationPreferences,
          ...notificationPreferences
        };
      }

      await user.save();

      res.status(200).json({
        success: true,
        data: {
          profile: user.profile,
          notificationPreferences: user.notificationPreferences
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update profile'
      });
    }
  }

  async getCreditHistory(req, res) {
    try {
      const userId = req.user._id;
      const {
        limit = 50,
        offset = 0,
        recordType,
        startDate,
        endDate
      } = req.query;

      const result = await this.qualityCreditEngine.getUserCreditHistory(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        recordType,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting credit history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get credit history'
      });
    }
  }

  async getCreditSummary(req, res) {
    try {
      const userId = req.user._id;

      const summary = await this.qualityCreditEngine.getUserCreditSummary(userId);

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting credit summary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get credit summary'
      });
    }
  }

  async getBalance(req, res) {
    try {
      const userId = req.user._id;

      const balance = await this.revenueSettlementEngine.getUserBalance(userId);

      res.status(200).json({
        success: true,
        data: balance
      });
    } catch (error) {
      console.error('Error getting balance:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get balance'
      });
    }
  }

  async getTransactions(req, res) {
    try {
      const userId = req.user._id;
      const {
        limit = 50,
        offset = 0,
        transactionType,
        status,
        startDate,
        endDate
      } = req.query;

      const result = await this.revenueSettlementEngine.getUserTransactions(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        transactionType,
        status,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get transactions'
      });
    }
  }

  async withdraw(req, res) {
    try {
      const userId = req.user._id;
      const { amount, paymentMethod, bankAccount, bankName, accountHolder } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid amount is required'
        });
      }

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          error: 'Payment method is required'
        });
      }

      const result = await this.revenueSettlementEngine.processWithdraw(
        userId,
        amount,
        paymentMethod,
        {
          bankAccount,
          bankName,
          accountHolder
        }
      );

      res.status(200).json({
        success: true,
        data: {
          transactionId: result.transaction.transactionId,
          amount: result.transaction.amount,
          newBalance: result.newBalance,
          estimatedProcessingTime: result.estimatedProcessingTime,
          status: result.transaction.status
        }
      });
    } catch (error) {
      console.error('Error processing withdraw:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process withdraw'
      });
    }
  }

  async getTransactionStats(req, res) {
    try {
      const userId = req.user._id;
      const { startDate, endDate } = req.query;

      const stats = await this.revenueSettlementEngine.getTransactionStats(userId, {
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get transaction stats'
      });
    }
  }

  async updateExpertise(req, res) {
    try {
      const userId = req.user._id;
      const { expertise } = req.body;

      if (!Array.isArray(expertise)) {
        return res.status(400).json({
          success: false,
          error: 'Expertise must be an array'
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      user.profile.expertise = expertise;
      await user.save();

      await this.qualityCreditEngine.updateActivityWeight(userId);

      res.status(200).json({
        success: true,
        data: {
          expertise: user.profile.expertise,
          message: 'Expertise updated successfully. This may affect your expert matching score.'
        }
      });
    } catch (error) {
      console.error('Error updating expertise:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update expertise'
      });
    }
  }
}

module.exports = UserController;
