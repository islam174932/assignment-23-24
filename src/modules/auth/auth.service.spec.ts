import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailerService } from '../../shared/mailer/mailer.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailerService: jest.Mocked<MailerService>;

  const fakeUser = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    email: 'jane@example.com',
    username: 'jane',
    password: 'hashed-password',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmailWithPassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('signed.jwt.token'),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    mailerService = module.get(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('creates the user with a hashed password and returns an access token', async () => {
      usersService.create.mockResolvedValue(fakeUser as any);

      const result = await authService.register({
        username: 'jane',
        email: 'jane@example.com',
        password: 'plain-password',
      });

      expect(usersService.create).toHaveBeenCalledTimes(1);
      const createArg = usersService.create.mock.calls[0][0];
      expect(createArg.email).toBe('jane@example.com');
      expect(createArg.password).not.toBe('plain-password');

      const passwordIsHashed = await bcrypt.compare(
        'plain-password',
        createArg.password,
      );
      expect(passwordIsHashed).toBe(true);

      expect(mailerService.sendWelcomeEmail).toHaveBeenCalledWith(
        'jane@example.com',
        'jane',
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: fakeUser.id,
        email: fakeUser.email,
      });
      expect(result).toEqual({
        accessToken: 'signed.jwt.token',
        user: {
          id: fakeUser.id,
          email: fakeUser.email,
          username: fakeUser.username,
        },
      });
    });
  });

  describe('login', () => {
    it('returns an access token when credentials are valid', async () => {
      const hashedPassword = await bcrypt.hash('plain-password', 10);
      usersService.findByEmailWithPassword.mockResolvedValue({
        ...fakeUser,
        password: hashedPassword,
      } as any);

      const result = await authService.login({
        email: 'jane@example.com',
        password: 'plain-password',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.email).toBe('jane@example.com');
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'ghost@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      usersService.findByEmailWithPassword.mockResolvedValue({
        ...fakeUser,
        password: hashedPassword,
      } as any);

      await expect(
        authService.login({
          email: 'jane@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
