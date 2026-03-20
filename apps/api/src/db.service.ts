import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Client } from "pg";

@Injectable()
export class DbService implements OnModuleInit {
  private readonly logger = new Logger(DbService.name);

  async onModuleInit() {
    // Test DB connection on startup — result visible in CloudWatch logs
    const result = await this.check();
    if (result.connected) {
      this.logger.log(`DB connected — ${result.version}`);
    } else {
      this.logger.error(`DB connection failed — ${result.error}`);
    }
  }

  async check(): Promise<{ connected: boolean; version?: string; error?: string }> {
    const client = new Client({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: parseInt(process.env.DB_PORT || "5432"),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      const res = await client.query("SELECT version()");
      await client.end();
      return { connected: true, version: res.rows[0].version };
    } catch (err: any) {
      return { connected: false, error: err.message };
    }
  }
}
