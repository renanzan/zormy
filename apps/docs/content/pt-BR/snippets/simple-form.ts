/**
 * Snippet para o exemplo "Formulário Simples" na documentação
 * @see https://zormy.dev/pt-BR/docs/forms
 * @see https://zormy.dev/pt-BR/docs/examples
 */
export const simpleFormCode = `import { z } from "zod";
import { useForm } from "react-hook-form";
import { field, Form, zormyResolver } from "zormy";

// --- Campos ---

const NameField = field("name")
  .schema(z.string().min(3, "Nome deve ter pelo menos 3 caracteres"))
  .render(({ register, fieldState }) => (
    <div>
      <label>Nome</label>
      <input {...register()} />
      {fieldState.error && (
        <span style={{ color: "red" }}>{fieldState.error.message}</span>
      )}
    </div>
  ));

const EmailField = field("email")
  .schema(z.string().email("Email inválido"))
  .render(({ register, fieldState }) => (
    <div>
      <label>Email</label>
      <input type="email" {...register()} />
      {fieldState.error && (
        <span style={{ color: "red" }}>{fieldState.error.message}</span>
      )}
    </div>
  ));

// --- Componente principal ---

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
      <button type="submit">Enviar</button>
    </Form>
  );
}

export default SimpleForm;`;
