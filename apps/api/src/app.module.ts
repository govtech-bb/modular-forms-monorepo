import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { DbService } from "./db.service";

@Module({
  controllers: [AppController],
  providers: [DbService],
})
export class AppModule {}
