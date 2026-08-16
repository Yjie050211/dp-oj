import { Controller, Get } from "@nestjs/common";
import { EnvCheckService } from "./env-check.service";

@Controller("system")
export class SystemController {
  constructor(private readonly envCheck: EnvCheckService) {}

  /** GET /api/system/health —— 判题机环境自检（M0 验收接口） */
  @Get("health")
  health() {
    return this.envCheck.health();
  }

  /** GET /api/system/languages —— 判题语言与工具链可用性（M3） */
  @Get("languages")
  languages() {
    return this.envCheck.languages();
  }
}
