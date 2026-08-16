import { Module } from "@nestjs/common";
import { JudgeController } from "./judge.controller";
import { RunService } from "./run.service";

@Module({
  controllers: [JudgeController],
  providers: [RunService],
})
export class JudgeModule {}
