import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly mailer: NestMailerService) {}

  async sendWelcomeEmail(to: string, username: string): Promise<void> {
    try {
      await this.mailer.sendMail({
        to,
        subject: 'Welcome to the Social App!',
        text: `Hi ${username}, thanks for joining. We are glad to have you here.`,
        html: `<p>Hi <strong>${username}</strong>,</p><p>Thanks for joining the Social App. We are glad to have you here.</p>`,
      });
    } catch (error) {
      // Registration should not fail just because the mail server is
      // unreachable in local/dev environments.
      this.logger.warn(
        `Could not send welcome email to ${to}: ${(error as Error).message}`,
      );
    }
  }
}
