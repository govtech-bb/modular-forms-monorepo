import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RegistryService } from "./registry.service";
import { CustomComponent } from "./entities/custom-component.entity";
import { RegistryBuilderController } from "./builder/registry-builder.controller";
import { RegistryBuilderService } from "./builder/registry-builder.service";
import { FormDefinitionEntity } from "../database/entities/form-definition.entity";
import { FormDefinitionRepository } from "../forms/form-definitions/form-definition.repository";

@Module({
  imports: [TypeOrmModule.forFeature([CustomComponent, FormDefinitionEntity])],
  controllers: [RegistryBuilderController],
  providers: [
    RegistryService,
    RegistryBuilderService,
    FormDefinitionRepository,
  ],
  exports: [RegistryService],
})
export class RegistryModule {}
