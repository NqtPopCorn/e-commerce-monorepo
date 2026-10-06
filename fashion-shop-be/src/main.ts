import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as path from "path";
import * as fs from "fs";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Phục vụ thư mục static uploads cho local-first storage
  const uploadDir = path.isAbsolute(process.env.UPLOAD_DIR || "uploads")
    ? process.env.UPLOAD_DIR || "uploads"
    : path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  app.useStaticAssets(uploadDir, {
    prefix: "/uploads/",
  });

  const config = new DocumentBuilder()
    .setTitle("Fashion Shop API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
