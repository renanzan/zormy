/**
 * Snippet para o exemplo "Campos com Dependências" na documentação
 * @see https://zormy.dev/pt-BR/docs/examples
 */
export const dependentFieldsCode = `import { z } from "zod";
import { useForm } from "react-hook-form";
import { field, Form, zormyResolver } from "zormy";

// --- Campos ---

const HasPasswordField = field("hasPassword")
  .schema(z.boolean())
  .render(({ register }) => (
    <div>
      <label>
        <input type="checkbox" {...register()} />
        Possui senha?
      </label>
    </div>
  ));

const PasswordField = field("password")
  .dependsOn(HasPasswordField)
  .schema((formValues) => {
    const hasPassword = formValues?.hasPassword;
    if (hasPassword) {
      return z.string().min(8, "Senha deve ter pelo menos 8 caracteres");
    }
    return z.string().optional();
  })
  .render(({ register, fieldState, watch }) => {
    const hasPassword = watch("hasPassword");
    if (!hasPassword) return null;
    return (
      <div>
        <label>Senha</label>
        <input type="password" {...register()} />
        {fieldState.error && (
          <span style={{ color: "red" }}>{fieldState.error.message}</span>
        )}
      </div>
    );
  });

// --- Componente principal ---

function DependentFieldsForm() {
  const form = useForm({
    resolver: zormyResolver({ fields: [HasPasswordField, PasswordField] }),
    defaultValues: { hasPassword: false, password: "" },
  });

  return (
    <Form
      methods={form}
      onSubmit={form.handleSubmit((data) =>
        alert(JSON.stringify(data, null, 2))
      )}
    >
      <HasPasswordField />
      <PasswordField />
      <button type="submit">Enviar</button>
    </Form>
  );
}

export default DependentFieldsForm;`;
