import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { ProblemsModule } from "./problems/problems.module";
import { SystemModule } from "./system/system.module";

@Module({
  imports: [DatabaseModule, ProblemsModule, SystemModule],
})
export class AppModule {}
