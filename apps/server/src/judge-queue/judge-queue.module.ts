import { Global, Module } from "@nestjs/common";
import { JudgeQueueService } from "./judge-queue.service";

@Global()
@Module({
  providers: [JudgeQueueService],
  exports: [JudgeQueueService],
})
export class JudgeQueueModule {}
