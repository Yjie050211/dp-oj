import { Body, Controller, Post } from "@nestjs/common";
import { RunService } from "./run.service";

@Controller("judge")
export class JudgeController {
  constructor(private readonly runService: RunService) {}

  /** POST /api/judge/run —— 即时测试（自定义输入运行，不判对错） */
  @Post("run")
  run(@Body() body: { languageId: string; code: string; stdin: string }) {
    return this.runService.run(body);
  }
}
