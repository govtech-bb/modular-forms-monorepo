import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";
import { DataSource, DataSourceOptions } from "typeorm";

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
  entities: [
    join(process.cwd(), "apps/api/src/**/*.entity.ts"),
    join(process.cwd(), "dist/apps/api/**/*.entity.js"),
  ],
  migrations: [
    join(process.cwd(), "apps/api/src/database/migrations/*.ts"),
    join(process.cwd(), "dist/apps/api/database/migrations/*.js"),
  ],
};

export const typeOrmModuleOptions: TypeOrmModuleOptions = {
  ...dataSourceOptions,
  autoLoadEntities: true,
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
