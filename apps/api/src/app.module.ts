import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { typeOrmModuleOptions } from "./database/typeorm.config";

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmModuleOptions)],
  controllers: [AppController],
})
export class AppModule {}
