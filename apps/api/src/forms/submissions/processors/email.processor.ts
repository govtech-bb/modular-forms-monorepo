import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { EmailTemplateService } from "../../../email/email-template.service";
import {
  EmailBodyBuilder,
  type EmailTemplateContext,
  type MdaTemplateContext,
} from "../../../email/email-body.builder";
import type {
  ISubmissionProcessor,
  ProcessorOutput,
} from "./submission-processor.interface";
import type { SubmissionCreatedEvent } from "../submissions.types";

const CONFIRMATION_TEMPLATE = "submission-confirmation";
const MDA_TEMPLATE = "mda-notification";

/**
 * Sends submission emails via AWS SES v2.
 *
 * For each submission this processor attempts up to two sends:
 *
 *  1. **Citizen confirmation** — to the address resolved from
 *     `processors[].config.recipientField` (format `stepId.fieldId`), using
 *     the `submission-confirmation` template.
 *  2. **MDA notification** — to `contract.contactDetails.email`, using the
 *     `mda-notification` template. Alerts staff a new submission needs
 *     handling.
 *
 * **Failure isolation.** The two sends run concurrently via
 * `Promise.allSettled`. An MDA failure is logged but does **not** fail the
 * processor — the submission is already persisted and the citizen has
 * their confirmation. A citizen failure is rethrown so the listener marks
 * the processor failed and retries.
 *
 * **Opt-out.** Setting `processors[].config.notifyMda` to `false` suppresses
 * the MDA send even when `contactDetails.email` is configured.
 *
 * **Subject overrides.** `config.subject` overrides the citizen subject;
 * `config.mdaSubject` overrides the MDA subject. Both have sensible defaults.
 *
 * **Context build failure.** When `EmailBodyBuilder.build()` throws (DB
 * unavailable, contract gone), template rendering is skipped entirely and
 * both sends fall back to a generic inline HTML body. The MDA send is
 * additionally skipped in this case because the MDA address lives on the
 * contract — if we can't load the contract we don't know where to send it.
 */
@Injectable()
export class EmailProcessor implements ISubmissionProcessor {
  readonly type = "email" as const;
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly client: SESv2Client;
  private readonly from: string;
  private readonly configurationSet: string | undefined;

  constructor(
    config: ConfigService,
    private readonly templateService: EmailTemplateService,
    private readonly emailBodyBuilder: EmailBodyBuilder,
  ) {
    this.from = config.get<string>("email.from") ?? "noreply@gov.bb";
    this.configurationSet = config.get<string>("email.configurationSet");
    this.client = new SESv2Client({
      region: config.get<string>("email.region") ?? "us-east-1",
    });
  }

  async process(payload: SubmissionCreatedEvent): Promise<ProcessorOutput> {
    const cfg = (payload.processors.find((p) => p.type === "email")?.config ??
      {}) as Record<string, unknown>;

    const citizenTo = this.resolveCitizenAddress(payload, cfg);
    const notifyMdaEnabled = this.isMdaNotifyEnabled(payload, cfg);

    if (!citizenTo && !notifyMdaEnabled) {
      this.logger.warn(
        `[email] No recipients configured for submission ${payload.submissionId} — skipping`,
      );
      return { kind: "completed" };
    }

    // Build template context once. If it fails we still attempt the citizen
    // send via the inline-HTML fallback, and the MDA send is skipped (we
    // need the contract to know the MDA address).
    let ctx: EmailTemplateContext | null = null;
    try {
      ctx = await this.emailBodyBuilder.build(payload);
    } catch (err) {
      this.logger.warn(
        `[email] Could not build template context for form "${payload.formId}" — falling back to generic body`,
        err,
      );
    }

    const sendCitizen = citizenTo
      ? this.sendCitizenConfirmation(payload, ctx, cfg, citizenTo)
      : Promise.resolve();

    const mdaTo = notifyMdaEnabled ? ctx?.contactDetails?.email : undefined;
    if (notifyMdaEnabled && !mdaTo) {
      this.logger.warn(
        `[email] No contactDetails.email on contract "${payload.formId}" — skipping MDA notification for submission ${payload.submissionId}`,
      );
    }
    const sendMda =
      mdaTo && ctx
        ? this.sendMdaNotification(payload, ctx, cfg, mdaTo, citizenTo)
        : Promise.resolve();

    const [citizenResult, mdaResult] = await Promise.allSettled([
      sendCitizen,
      sendMda,
    ]);

    if (mdaResult.status === "rejected") {
      this.logger.error(
        `[email] MDA notification failed for submission ${payload.submissionId} — continuing`,
        mdaResult.reason as Error,
      );
    }

    if (citizenResult.status === "rejected") {
      throw citizenResult.reason;
    }

    return { kind: "completed" };
  }

  /** Returns the citizen email address resolved from `recipientField`, or
   * `undefined` if the field is unconfigured or its value can't be found.
   * Logs the reason so operators can distinguish the two cases.
   */
  private resolveCitizenAddress(
    payload: SubmissionCreatedEvent,
    cfg: Record<string, unknown>,
  ): string | undefined {
    const recipientField = cfg["recipientField"] as string | undefined;
    if (!recipientField) {
      this.logger.warn(
        `[email] No recipientField configured for submission ${payload.submissionId} — skipping citizen confirmation`,
      );
      return undefined;
    }

    // recipientField format: "stepId.fieldId". Repeatable steps are not
    // supported here.
    const [stepId, fieldId] = recipientField.split(".");
    const stepValues = payload.values[stepId];
    const to =
      stepValues && !Array.isArray(stepValues)
        ? (stepValues[fieldId] as string | undefined)
        : undefined;

    if (!to) {
      this.logger.warn(
        `[email] Could not resolve recipient at "${recipientField}" for submission ${payload.submissionId} — skipping citizen confirmation`,
      );
      return undefined;
    }

    return to;
  }

  /** Whether the MDA send should be attempted at all. The actual address is
   * resolved later from the built context. */
  private isMdaNotifyEnabled(
    payload: SubmissionCreatedEvent,
    cfg: Record<string, unknown>,
  ): boolean {
    if (cfg["notifyMda"] === false) {
      this.logger.debug(
        `[email] MDA notification disabled by config for submission ${payload.submissionId}`,
      );
      return false;
    }
    return true;
  }

  private async sendCitizenConfirmation(
    payload: SubmissionCreatedEvent,
    ctx: EmailTemplateContext | null,
    cfg: Record<string, unknown>,
    to: string,
  ): Promise<void> {
    const subject =
      (cfg["subject"] as string | undefined) ??
      "Your form submission has been received";

    const htmlBody = await this.resolveHtmlBody(payload, {
      template: CONFIRMATION_TEMPLATE,
      data: ctx,
    });

    await this.client.send(
      new SendEmailCommand({
        FromEmailAddress: this.from,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: {
              Text: { Data: this.buildTextBody(payload), Charset: "UTF-8" },
              Html: { Data: htmlBody, Charset: "UTF-8" },
            },
          },
        },
        EmailTags: [
          { Name: "submissionId", Value: payload.submissionId },
          { Name: "recipient", Value: "citizen" },
        ],
        ...(this.configurationSet && {
          ConfigurationSetName: this.configurationSet,
        }),
      }),
    );

    this.logger.log(
      `[email] Citizen confirmation sent to ${to} for submission ${payload.submissionId}`,
    );
  }

  private async sendMdaNotification(
    payload: SubmissionCreatedEvent,
    ctx: EmailTemplateContext,
    cfg: Record<string, unknown>,
    mdaEmail: string,
    submitterEmail: string | undefined,
  ): Promise<void> {
    const subject =
      (cfg["mdaSubject"] as string | undefined) ??
      `New submission received: ${ctx.formTitle}`;

    const mdaContext: MdaTemplateContext = { ...ctx, submitterEmail };
    const htmlBody = await this.resolveHtmlBody(payload, {
      template: MDA_TEMPLATE,
      data: mdaContext,
    });

    await this.client.send(
      new SendEmailCommand({
        FromEmailAddress: this.from,
        Destination: { ToAddresses: [mdaEmail] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: {
              Text: {
                Data: this.buildMdaTextBody(payload, ctx, submitterEmail),
                Charset: "UTF-8",
              },
              Html: { Data: htmlBody, Charset: "UTF-8" },
            },
          },
        },
        EmailTags: [
          { Name: "submissionId", Value: payload.submissionId },
          { Name: "recipient", Value: "mda" },
        ],
        ...(this.configurationSet && {
          ConfigurationSetName: this.configurationSet,
        }),
      }),
    );

    this.logger.log(
      `[email] MDA notification sent to ${mdaEmail} for submission ${payload.submissionId}`,
    );
  }

  /**
   * Renders the requested template with the supplied data. When `data` is
   * `null` (context build failed upstream) or the template returns null /
   * throws, falls back to a generic inline HTML body so a delivery is
   * always made.
   */
  private async resolveHtmlBody(
    payload: SubmissionCreatedEvent,
    spec: { template: string; data: object | null },
  ): Promise<string> {
    if (spec.data === null) {
      // Caller already logged the upstream failure; just use the safe path.
      return this.buildHtmlBody(payload);
    }
    try {
      const rendered = this.templateService.render(
        spec.template,
        spec.data as Record<string, unknown>,
      );
      if (rendered !== null) return rendered;
      this.logger.warn(
        `[email] Template render returned null for "${spec.template}"`,
      );
    } catch (err) {
      this.logger.warn(
        `[email] Could not render "${spec.template}" for form "${payload.formId}" — falling back to generic body`,
        err,
      );
    }
    return this.buildHtmlBody(payload);
  }

  private buildTextBody(payload: SubmissionCreatedEvent): string {
    return [
      "Your submission has been received.",
      "",
      `Reference: ${payload.submissionId}`,
      `Form:      ${payload.formId}`,
      `Submitted: ${payload.meta.submittedAt}`,
    ].join("\n");
  }

  private buildMdaTextBody(
    payload: SubmissionCreatedEvent,
    ctx: EmailTemplateContext,
    submitterEmail: string | undefined,
  ): string {
    return [
      `New submission received: ${ctx.formTitle}`,
      "",
      `Reference: ${payload.submissionId}`,
      `Submitted: ${payload.meta.submittedAt}`,
      ...(submitterEmail ? [`Submitter: ${submitterEmail}`] : []),
    ].join("\n");
  }

  private buildHtmlBody(payload: SubmissionCreatedEvent): string {
    return `
      <p>Submission received.</p>
      <table>
        <tr><th>Reference</th><td>${payload.submissionId}</td></tr>
        <tr><th>Form</th><td>${payload.formId}</td></tr>
        <tr><th>Submitted</th><td>${payload.meta.submittedAt}</td></tr>
      </table>
    `.trim();
  }
}
