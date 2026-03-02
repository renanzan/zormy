/**
 * Snippet para o exemplo "Criando um campo: `field(key)`" na documentação
 * @see https://zormy.dev/en/docs/fields
 */

export const fieldExampleCode = `import { z } from "zod";
import { useForm } from "react-hook-form";
import { field, Form, zormyResolver } from "zormy";

// --- Field ---

const NameField = field("name")
	.schema(z.string().min(3, "Minimum 3 characters"))
	.render(({ register, fieldState }) => (
		<div>
			<label>Name</label>
			<input {...register()} />
			{fieldState.error && <span className="error">{fieldState.error.message}</span>}
		</div>
	));

// --- Main component ---

function App() {
	const form = useForm({
		resolver: zormyResolver({ fields: [NameField] }),
		defaultValues: { name: "" },
	});

	return (
		<Form methods={form} onSubmit={form.handleSubmit((d) => console.log(d))}>
			<NameField />
			<button type="submit">Submit</button>
		</Form>
	);
}

export default App;`;
