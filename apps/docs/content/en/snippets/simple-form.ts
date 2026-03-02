/**
 * Snippet para o exemplo "Formulário Simples" na documentação
 * @see https://zormy.dev/en/docs/forms
 * @see https://zormy.dev/en/docs/examples
 */
export const simpleFormCode = `import { z } from "zod";
import { useForm } from "react-hook-form";
import { field, Form, zormyResolver } from "zormy";

// --- Fields ---

const NameField = field("name")
  .schema(z.string().min(3, "Name must be at least 3 characters long"))
  .render(({ register, fieldState }) => (
    <div>
      <label>Name</label>
      <input {...register()} />
      {fieldState.error && (
        <span style={{ color: "red" }}>{fieldState.error.message}</span>
      )}
    </div>
  ));

const EmailField = field("email")
  .schema(z.string().email("Invalid email"))
  .render(({ register, fieldState }) => (
    <div>
      <label>Email</label>
      <input type="email" {...register()} />
      {fieldState.error && (
        <span style={{ color: "red" }}>{fieldState.error.message}</span>
      )}
    </div>
  ));

// --- Main component ---

function SimpleForm() {
  const form = useForm({
    resolver: zormyResolver({ fields: [NameField, EmailField] }),
    defaultValues: { name: "", email: "" },
  });

  return (
    <Form
      methods={form}
      onSubmit={form.handleSubmit((data) =>
        alert(JSON.stringify(data, null, 2))
      )}
    >
      <NameField />
      <EmailField />
      <button type="submit">Submit</button>
    </Form>
  );
}

export default SimpleForm;`;
