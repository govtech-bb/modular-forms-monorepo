/**
 * RegistryBuilderModule is intentionally not imported into AppModule directly.
 * Its controller and service are registered inside RegistryModule so they share
 * the same TypeORM feature registration and RegistryService provider.
 *
 * This file is kept as a reference / future extraction point.
 */
import { Module } from "@nestjs/common";
import { RegistryBuilderController } from "./registry-builder.controller";
import { RegistryBuilderService } from "./registry-builder.service";

@Module({
  controllers: [RegistryBuilderController],
  providers: [RegistryBuilderService],
})
export class RegistryBuilderModule {}
