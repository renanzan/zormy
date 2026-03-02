/**
 * Snippet para o exemplo "Primeiro formulário" na documentação
 * @see https://zormy.dev/pt-BR/docs/get-started
 * @see https://zormy.dev/pt-BR/docs/zod-integration
 */
export const firstFormCode = `import { z } from "zod";
import { useForm } from "react-hook-form";
import { field, Form, zormyResolver } from "zormy";

// --- Campos ---

const NameField = field("name")
	.schema(z.string().min(3, "Nome deve ter pelo menos 3 caracteres"))
	.render(({ register, fieldState }) => (
		<div>
			<label>Nome</label>
			<input {...register()}/>
			{fieldState.error && <span className="error">{fieldState.error.message}</span>}
		</div>
	));

// --- Componente principal ---

function FirstForm() {
	const form = useForm({
		resolver: zormyResolver({ fields: [NameField] }),
		defaultValues: { name: "" },
	});

	return (
		<Form
			methods={form}
			onSubmit={form.handleSubmit((data) =>
				alert(JSON.stringify(data, null, 2))
			)}
		>
			<NameField />
			
			<button type="submit">Enviar</button>
		</Form>
	);
}

export default FirstForm;`;
