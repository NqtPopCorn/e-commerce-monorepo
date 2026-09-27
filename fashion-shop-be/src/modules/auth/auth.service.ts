import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}
  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException("Email already exists");
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: await bcrypt.hash(dto.password, 12),
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });
    return this.sign(user);
  }
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    let isMatch = await bcrypt.compare(dto.password, user.password);
    // Hỗ trợ cả 2 mật khẩu cho admin mặc định: admin123 và admin123456
    if (
      !isMatch &&
      user.role === "ADMIN" &&
      user.email === "admin@fashionshop.com" &&
      (dto.password === "admin123" || dto.password === "admin123456")
    ) {
      isMatch = true;
    }

    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.sign(user);
  }
  private sign(user: { id: number; email: string; role: string }) {
    return {
      accessToken: this.jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
