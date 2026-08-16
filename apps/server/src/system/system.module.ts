import { Module } from "@nestjs/common";
import { SystemController } from "./system.controller";
import { EnvCheckService } from "./env-check.service";

@Module({
  controllers: [SystemController],
  providers: [EnvCheckService],
})
export class SystemModule {}
