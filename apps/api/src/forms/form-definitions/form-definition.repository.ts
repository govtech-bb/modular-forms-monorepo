import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "../../database/base.repository";
import { FormDefinitionEntity } from "../../database/entities/form-definition.entity";

@Injectable()
export class FormDefinitionRepository extends BaseRepository<FormDefinitionEntity> {
  constructor(dataSource: DataSource) {
    super(FormDefinitionEntity, dataSource.createEntityManager());
  }

  findRecipeByFormId(formId: string): Promise<FormDefinitionEntity | null> {
    return this.findOne({
      where: { formId },
      order: { createdAt: "DESC" },
    });
  }
}
