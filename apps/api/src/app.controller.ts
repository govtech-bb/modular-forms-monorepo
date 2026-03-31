import { Controller, Get } from "@nestjs/common";
import { evaluateCondition } from "@govtech-bb/form-conditions";

@Controller()
export class AppController {
  @Get("health")
  health(): string {
    // Confirms the dependency graph works
    evaluateCondition();
    return "OK";
  }
}
