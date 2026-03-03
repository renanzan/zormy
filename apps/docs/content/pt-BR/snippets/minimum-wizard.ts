/**
 * Snippet para o exemplo "Mínimo wizard" na documentação
 * @see https://zormy.dev/pt-BR/docs/wizards
 */
export const minimumWizardCode = `import { z } from "zod";
import { field, createWizardConfig, createWizardComponents, useWizard } from "zormy";

// --- Campos ---

const NameField = field("name")
  .schema(z.string().min(3))
  .render(({ register, fieldState }) => (
    <div>
      <label>Nome</label>
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

// --- Configuração do wizard ---

const wizardSteps = [
  { name: "personal", fields: [NameField] },
  { name: "contact", fields: [EmailField] },
] as const;

const wizardConfig = createWizardConfig({ steps: wizardSteps });
const { Wizard, Step } = createWizardComponents(wizardConfig);

// --- Componente principal ---

function MyWizard() {
  const wizard = useWizard({
    steps: wizardSteps,
    defaultValues: { name: "", email: "" },
    onComplete: (data) => console.log(data),
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
