/**
 * Snippet para o exemplo "Campos com Dependências" na documentação
 * @see https://zormy.dev/en/docs/examples
 */
export const dependentFieldsCode = `import { z } from "zod";
import { useForm } from "react-hook-form";
import { field, Form, zormyResolver } from "zormy";

// --- Fields ---

const HasPasswordField = field("hasPassword")
  .schema(z.boolean())
  .render(({ register }) => (
    <div>
      <label>
        <input type="checkbox" {...register()} />
        Has password?
      </label>
    </div>
  ));

const PasswordField = field("password")
  .dependsOn(HasPasswordField)
  .schema((formValues) => {
    const hasPassword = formValues?.hasPassword;
    if (hasPassword) {
      return z.string().min(8, "Password must be at least 8 characters long");
    }
    return z.string().optional();
  })
  .render(({ register, fieldState, watch }) => {
    const hasPassword = watch("hasPassword");
    if (!hasPassword) return null;
    return (
      <div>
        <label>Password</label>
        <input type="password" {...register()} />
        {fieldState.error && (
          <span style={{ color: "red" }}>{fieldState.error.message}</span>
        )}
      </div>
    );
  });

// --- Main component ---

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
      <button type="submit">Submit</button>
    </Form>
  );
}

export default DependentFieldsForm;`;
