import { AnyFormApi, useStore } from "@tanstack/react-form";
import { FormValues } from "@web/types";

interface ApplicantNameDisplayProps {
  form: AnyFormApi;
}

export default function ApplicantNameDisplay({
  form,
}: ApplicantNameDisplayProps) {
  const formValues = useStore(
    form.store,
    (state: { values: FormValues }) => state.values,
  );

  const firstName = formValues["applicant-details_applicant-first-name"] as
    | string
    | undefined;
  const lastName = formValues["applicant-details_applicant-last-name"] as
    | string
    | undefined;

  if (!firstName && !lastName) {
    return null;
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <div data-applicant-name>
      <p>
        <strong>Applicant: </strong> {fullName}
      </p>
      <p>
        <strong>Date: </strong> {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
