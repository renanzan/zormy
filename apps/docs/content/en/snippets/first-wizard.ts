/**
 * Snippet para o exemplo "Primeiro wizard" na documentação
 * @see https://zormy.dev/en/docs/get-started
 */
export const firstWizardCode = `import { z } from "zod";
import { createWizardConfig, createWizardComponents, useWizard, field } from "zormy";

// --- Fields ---

const NameField = field("name")
  .schema(z.string().min(3, "Name must be at least 3 characters long"))
  .render(({ register, fieldState }) => (
		<div>
			<label>Name</label>
			<input {...register()} />
			{fieldState.error && <span className="error">{fieldState.error.message}</span>}
		</div>
  ));

const EmailField = field("email")
  .schema(z.string().email("Invalid email"))
  .render(({ register, fieldState }) => (
		<div>
			<label>Email</label>
			<input {...register()} />
			{fieldState.error && <span className="error">{fieldState.error.message}</span>}
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
    onStepSubmit: (stepData, step, allDataSoFar) => {
      console.log("Step completed:", step, "step data:", stepData, "all so far:", allDataSoFar);
    },
    onComplete: (data) => console.log("Final data (wizard complete):", data),
  });

  return (
    <Wizard methods={wizard}>
      <Step step="personal">
        <NameField />
      </Step>

      <Step step="contact">
        <EmailField />
      </Step>

      <div className="mt-4 flex gap-2">
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
