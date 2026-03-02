/**
 * Snippet para o exemplo "Mínimo wizard" na documentação
 * @see https://zormy.dev/en/docs/wizards
 */
export const minimumWizardCode = `import { z } from "zod";
import { field, createWizardConfig, createWizardComponents, useWizard } from "zormy";

// --- Fields ---

const NameField = field("name")
  .schema(z.string().min(3))
  .render(({ register, fieldState }) => (
    <div>
      <label>Name</label>
      <input {...register()} />
      {fieldState.error && <span>{fieldState.error.message}</span>}
    </div>
  ));

const EmailField = field("email")
  .schema(z.string().email())
  .render(({ register, fieldState }) => (
    <div>
      <label>Email</label>
      <input type="email" {...register()} />
      {fieldState.error && <span>{fieldState.error.message}</span>}
    </div>
  ));

// --- Wizard configuration ---

const wizardConfig = createWizardConfig({
  steps: ["personal", "contact"] as const,
  fields: {
    personal: [NameField],
    contact: [EmailField],
  },
});

const { Wizard, Step } = createWizardComponents(wizardConfig);

// --- Main component ---

function MyWizard() {
  const wizard = useWizard({
    ...wizardConfig,
    defaultValues: { name: "", email: "" },
    onSubmit: (data) => console.log(data),
  });

  return (
    <Wizard methods={wizard}>
      <Step step="personal">
        <NameField />
      </Step>

      <Step step="contact">
        <EmailField />
      </Step>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        {!wizard.isFirstStep && (
          <button
            type="button"
            onClick={wizard.back}
            className="secondary"
          >
            Back
          </button>
        )}
        {wizard.isLastStep ? (
          <button
            type="submit"
            className="primary"
          >
            Finish
          </button>
        ) : (
          <button
            type="button"
            onClick={wizard.next}
            className="primary"
          >
            Next
          </button>
        )}
      </div>
    </Wizard>
  );
}

export default MyWizard;
`;
