import { Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { SubmissionsService } from "./submissions.service";

@Controller("submissions")
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  /** POST /api/submissions —— 提交代码 */
  @Post()
  create(@Body() body: { problemSlug: string; languageId: string; code: string }) {
    return this.submissions.create(body);
  }

  /** GET /api/submissions —— 提交历史 */
  @Get()
  list() {
    return this.submissions.list();
  }

  /** GET /api/submissions/:id —— 轮询单次提交状态与结果 */
  @Get(":id")
  get(@Param("id", ParseIntPipe) id: number) {
    return this.submissions.get(id);
  }
}
