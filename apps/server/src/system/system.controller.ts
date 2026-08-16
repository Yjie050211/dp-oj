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
}
