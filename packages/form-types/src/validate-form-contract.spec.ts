import { validateFormContract } from "./validate-form-contract";

const validRecipe = {
  formId: "passport-renewal",
  title: "Passport Renewal",
  version: "1.0.0",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  steps: [],
  processors: [
    { type: "email" as const, config: { recipientField: "personal.email" } },
  ],
};

/** Minimal recipe step using a component ref — satisfies recipeFormStepSchema. */
const validStep = {
  stepId: "personal-info",
  title: "Personal Information",
  elements: [{ ref: "components/text-input" }],
};

describe("validateFormContract", () => {
  it("accepts a well-formed recipe", () => {
    const result = validateFormContract(validRecipe);
    expect(result.ok).toBe(true);
  });

  it("rejects when a payment processor's customerEmailPath is a JSONLogic rule", () => {
    const broken = {
      ...validRecipe,
      processors: [
        {
          type: "payment" as const,
          config: {
            provider: "ezpay",
            department: "civil-registry",
            paymentCode: "BIRTH-CERT",
            amount: 25,
            description: "x",
            customerEmailPath: { var: "values.x" },
            customerNamePath: "personal.name",
          },
        },
      ],
    };
    const result = validateFormContract(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.issues.some((i) => i.path.includes("customerEmailPath")),
      ).toBe(true);
    }
  });

  it("rejects missing required fields with field-pathed issues", () => {
    const result = validateFormContract({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const paths = result.issues.map((i) => i.path);
      expect(paths).toEqual(expect.arrayContaining(["formId", "title"]));
    }
  });

  it("accepts a recipe with templatable rule in a dynamic field", () => {
    const withRule = {
      ...validRecipe,
      processors: [
        {
          type: "payment" as const,
          config: {
            provider: "ezpay",
            department: "civil-registry",
            paymentCode: "BIRTH-CERT",
            amount: {
              if: [
                { ">=": [{ age: [{ var: "values.applicant.dob" }] }, 60] },
                0,
                25,
              ],
            },
            description: "Senior tier",
            customerEmailPath: "applicant.email",
            customerNamePath: "applicant.name",
          },
        },
      ],
    };
    const result = validateFormContract(withRule);
    expect(result.ok).toBe(true);
  });

  describe("stepId kebab-case enforcement", () => {
    it("accepts a recipe whose step ID is valid kebab-case", () => {
      const recipe = {
        ...validRecipe,
        steps: [validStep],
      };
      const result = validateFormContract(recipe);
      expect(result.ok).toBe(true);
    });

    it.each([
      ["PascalCase", "MyStep"],
      ["snake_case", "my_step"],
      ["space-separated", "my step"],
      ["leading hyphen", "-step"],
      ["trailing hyphen", "step-"],
      ["all uppercase", "STEP"],
    ])("rejects a step ID that is %s (%s)", (_label, badId) => {
      const recipe = {
        ...validRecipe,
        steps: [{ ...validStep, stepId: badId }],
      };
      const result = validateFormContract(recipe);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues.some((i) => i.path.includes("stepId"))).toBe(true);
      }
    });
  });
});
