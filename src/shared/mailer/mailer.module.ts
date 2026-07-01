import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';

@Module({
  imports: [
    NestMailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('mail.host'),
          port: config.get<number>('mail.port'),
          secure: false,
          auth: {
            user: config.get<string>('mail.user'),
            pass: config.get<string>('mail.password'),
          },
          // Prevents the app from crashing in dev/CI when no real SMTP
          // credentials are configured.
          ignoreTLS: true,
        },
        defaults: {
          from: config.get<string>('mail.from'),
        },
      }),
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
