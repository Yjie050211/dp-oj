import { Module } from "@nestjs/common";
import { JudgeQueueModule } from "../judge-queue/judge-queue.module";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";

@Module({
  imports: [JudgeQueueModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}
