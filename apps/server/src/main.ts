import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api");
  // 单机自用：仅信任本机前端来源，避免恶意网页/局域网设备调用判题 API 执行代码
  app.enableCors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] });
  // 与业务侧 200KB 代码 / 1MB stdin 上限对齐（默认 100KB 会误杀合法请求）
  app.useBodyParser("json", { limit: "1mb" });
  const port = Number(process.env.PORT ?? 3000);
  // 仅监听回环地址，不对局域网开放
  await app.listen(port, "127.0.0.1");
  console.log("[dp-oj] server listening on http://127.0.0.1:" + port);
}

bootstrap().catch((err) => {
  console.error("[dp-oj] failed to start server:", err);
  process.exit(1);
});
