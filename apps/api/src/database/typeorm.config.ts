import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSource, DataSourceOptions } from "typeorm";
import {
  FormComponentEntity,
  FormDefinitionEntity,
  FormSubmissionEntity,
} from "./entities";

const host = process.env.DB_HOST || "localhost";
const port = Number(process.env.DB_PORT || 5432);
const username = process.env.DB_USERNAME || "postgres";
const password = process.env.DB_PASSWORD || "postgres";
const database = process.env.DB_DATABASE || "postgres";

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host,
  port,
  username,
  password,
  database,
  entities: [FormDefinitionEntity, FormComponentEntity, FormSubmissionEntity],
  migrations: [__dirname + "/migrations/**/*{.js,.ts}"],
};

export const typeOrmModuleOptions: TypeOrmModuleOptions = {
  ...dataSourceOptions,
  autoLoadEntities: true,
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
