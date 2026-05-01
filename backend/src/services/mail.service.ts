import nodemailer, { Transporter } from 'nodemailer';
import { config, isMock, isPreview } from '../config';
import { logger } from '../lib/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: nodemailer.Attachment[];
  headers?: Record<string, string>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  info?: unknown;
  error?: string;
  mockData?: unknown;
}

class MockMailService {
  private sentEmails: Map<string, EmailOptions> = new Map();
  
  async sendMail(options: EmailOptions): Promise<EmailResult> {
    const messageId = `<mock-${Date.now()}-${Math.random().toString(36).substring(7)}@mock.email>`;
    
    this.sentEmails.set(messageId, options);
    
    logger.debug(`[Mock Mail] Sent email to: ${options.to}, subject: ${options.subject}`);
    
    return {
      success: true,
      messageId,
      mockData: {
        sentAt: new Date().toISOString(),
        preview: `http://localhost:${config.port}/mock/email/${messageId}`,
      },
    };
  }
  
  getMockEmail(messageId: string): EmailOptions | undefined {
    return this.sentEmails.get(messageId);
  }
  
  getAllMockEmails(): Array<{ messageId: string; options: EmailOptions }> {
    const results: Array<{ messageId: string; options: EmailOptions }> = [];
    this.sentEmails.forEach((options, messageId) => {
      results.push({ messageId, options });
    });
    return results;
  }
  
  clearMockEmails(): void {
    this.sentEmails.clear();
    logger.debug('[Mock Mail] All mock emails cleared');
  }
}

class MailService {
  private transporter: Transporter | null = null;
  private mockService: MockMailService = new MockMailService();
  
  private getTransporter(): Transporter {
    if (!this.transporter) {
      if (isMock || isPreview) {
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.port === 465,
          auth: {
            user: config.smtp.user,
            pass: config.smtp.password,
          },
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateDelta: 1000,
          rateLimit: 10,
        });
      }
    }
    return this.transporter;
  }
  
  async verifyConnection(): Promise<boolean> {
    if (isMock || isPreview) {
      return true;
    }
    
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      return false;
    }
  }
  
  async sendMail(options: EmailOptions): Promise<EmailResult> {
    if (isMock || isPreview) {
      return this.mockService.sendMail(options);
    }
    
    try {
      const transporter = this.getTransporter();
      
      const mailOptions: nodemailer.SendMailOptions = {
        from: options.from || config.smtp.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments: options.attachments,
        headers: options.headers,
      };
      
      const info = await transporter.sendMail(mailOptions);
      
      logger.debug(`Email sent to: ${options.to}, messageId: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        info,
      };
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  getMockEmail(messageId: string): EmailOptions | undefined {
    return this.mockService.getMockEmail(messageId);
  }
  
  getAllMockEmails(): Array<{ messageId: string; options: EmailOptions }> {
    return this.mockService.getAllMockEmails();
  }
  
  clearMockEmails(): void {
    this.mockService.clearMockEmails();
  }
}

export const mailService = new MailService();
export default mailService;
