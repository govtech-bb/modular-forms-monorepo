import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RegistryService } from "./registry.service";
import { CustomComponent } from "./entities/custom-component.entity";
import { RegistryBuilderController } from "./builder/registry-builder.controller";
import { RegistryBuilderService } from "./builder/registry-builder.service";

@Module({
  imports: [TypeOrmModule.forFeature([CustomComponent])],
  controllers: [RegistryBuilderController],
  providers: [RegistryService, RegistryBuilderService],
  exports: [RegistryService],
})
export class RegistryModule {}
