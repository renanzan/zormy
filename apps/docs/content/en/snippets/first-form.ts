/**
 * Snippet para o exemplo "Primeiro formulário" na documentação
 * @see https://zormy.dev/en/docs/get-started
 * @see https://zormy.dev/en/docs/zod-integration
 */
export const firstFormCode = `import { z } from "zod";
import { useForm } from "react-hook-form";
import { field, Form, zormyResolver } from "zormy";

// --- Fields ---

const NameField = field("name")
	.schema(z.string().min(3, "Name must be at least 3 characters long"))
	.render(({ register, fieldState }) => (
		<div>
			<label>Name</label>
			<input {...register()}/>
			{fieldState.error && <span className="error">{fieldState.error.message}</span>}
		</div>
	));

// --- Main component ---

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
			
			<button type="submit">Submit</button>
		</Form>
	);
}

export default FirstForm;`;
