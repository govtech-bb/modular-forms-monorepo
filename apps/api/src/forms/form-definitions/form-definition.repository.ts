import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "../../database/base.repository";
import { FormDefinitionEntity } from "../../database/entities/form-definition.entity";

function compareSemver(a: string, b: string): number {
  const parse = (v: string): [number, number, number] => {
    const parts = v.split(".").map(Number);
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  };
  const [aMajor, aMinor, aPatch] = parse(a);
  const [bMajor, bMinor, bPatch] = parse(b);
  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

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

  async findLatestVersionByFormId(formId: string): Promise<string | null> {
    const rows = await this.find({
      where: { formId },
      select: ["version"],
    });

    if (rows.length === 0) {
      return null;
    }

    const sorted = rows
      .map((r) => r.version)
      .sort((a, b) => compareSemver(a, b));

    return sorted[sorted.length - 1];
  }
}
