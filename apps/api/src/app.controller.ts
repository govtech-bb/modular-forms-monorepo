import { Controller, Get } from "@nestjs/common";
import { DbService } from "./db.service";

@Controller()
export class AppController {
  constructor(private readonly db: DbService) {}

  @Get("health")
  health() {
    return { status: "ok" };
  }

  @Get("db-check")
  async dbCheck() {
    return this.db.check();
  }
}
