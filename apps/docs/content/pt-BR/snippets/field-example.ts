/**
 * Snippet para o exemplo "Criando um campo: `field(key)`" na documentação
 * @see https://zormy.dev/pt-BR/docs/fields
 */

export const fieldExampleCode = `import { z } from "zod";
import { useForm } from "react-hook-form";
import { field, Form, zormyResolver } from "zormy";

// --- Campo ---

const NameField = field("name")
	.schema(z.string().min(3, "Mínimo 3 caracteres"))
	.render(({ register, fieldState }) => (
		<div>
			<label>Nome</label>
			<input {...register()} />
			{fieldState.error && <span className="error">{fieldState.error.message}</span>}
		</div>
	));

// --- Componente principal ---

function App() {
	const form = useForm({
		resolver: zormyResolver({ fields: [NameField] }),
		defaultValues: { name: "" },
	});

	return (
		<Form methods={form} onSubmit={form.handleSubmit((d) => console.log(d))}>
			<NameField />
			<button type="submit">Enviar</button>
		</Form>
	);
}

export default App;`;
