/**
 * Snippet para o exemplo "Primeiro wizard" na documentação
 * @see https://zormy.dev/pt-BR/docs/get-started
 */
export const firstWizardCode = `import { z } from "zod";
import { createWizardConfig, createWizardComponents, useWizard, field } from "zormy";

// --- Campos ---

const NameField = field("name")
  .schema(z.string().min(3, "Nome deve ter pelo menos 3 caracteres"))
  .render(({ register, fieldState }) => (
		<div>
			<label>Nome</label>
			<input {...register()} />
			{fieldState.error && <span className="error">{fieldState.error.message}</span>}
		</div>
  ));

const EmailField = field("email")
  .schema(z.string().email("Email inválido"))
  .render(({ register, fieldState }) => (
		<div>
			<label>Email</label>
			<input {...register()} />
			{fieldState.error && <span className="error">{fieldState.error.message}</span>}
		</div>
  ));

// --- Configuração do wizard ---

const wizardConfig = createWizardConfig({
  steps: ["personal", "contact"] as const,
  fields: {
    personal: [NameField],
    contact: [EmailField],
  },
});

const { Wizard, Step } = createWizardComponents(wizardConfig);

// --- Componente principal ---

function MyWizard() {
  const wizard = useWizard({
    ...wizardConfig,
    defaultValues: { name: "", email: "" },
    onStepSubmit: (stepData, step, allDataSoFar) => {
      console.log("Step concluído:", step, "dados do step:", stepData, "tudo até agora:", allDataSoFar);
    },
    onComplete: (data) => console.log("Dados finais (wizard completo):", data),
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
            Voltar
          </button>
        )}

        {wizard.isLastStep ? (
          <button
						type="submit"
						className="primary"
					>
            Finalizar
          </button>
        ) : (
          <button
						type="button"
						onClick={wizard.next}
						className="primary"
					>
            Próximo
          </button>
        )}
      </div>
    </Wizard>
  );
}

export default MyWizard;
`;
