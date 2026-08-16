import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { JudgeModule } from "./judge/judge.module";
import { ProblemsModule } from "./problems/problems.module";
import { SubmissionsModule } from "./submissions/submissions.module";
import { SystemModule } from "./system/system.module";

@Module({
  imports: [DatabaseModule, JudgeModule, ProblemsModule, SubmissionsModule, SystemModule],
})
export class AppModule {}
