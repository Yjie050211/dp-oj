import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ProblemsService } from "./problems.service";

@Controller("problems")
export class ProblemsController {
  constructor(private readonly problems: ProblemsService) {}

  /** GET /api/problems —— 题目列表 */
  @Get()
  list() {
    return this.problems.list();
  }

  /** GET /api/problems/:slug —— 题目详情（含题面 Markdown 与样例） */
  @Get(":slug")
  detail(@Param("slug") slug: string) {
    const p = this.problems.getBySlug(slug);
    if (!p) throw new NotFoundException("题目不存在: " + slug);
    return p;
  }
}
