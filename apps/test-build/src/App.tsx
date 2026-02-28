import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { field, formyResolver } from "zormy";

import type { FieldsToObject } from "zormy";

// Teste básico: importar do pacote compilado
console.log("✅ Imports do zormy funcionando:", {
	field: typeof field,
	formyResolver: typeof formyResolver,
});

// Os tipos serão inferidos automaticamente dos campos

// Criar campos usando a API do zormy
const NameField = field("name")
	.schema(z.string().min(3, "Nome deve ter pelo menos 3 caracteres"))
	.render(({ register, fieldState }) => (
		<div className="form-group">
			<label htmlFor="name">Nome</label>
			<input id="name" type="text" {...register()} placeholder="Digite seu nome" />
			{fieldState.error && <div className="error">{fieldState.error.message}</div>}
		</div>
	));

const EmailField = field("email")
	.schema(z.string().email("Email inválido"))
	.render(({ register, fieldState }) => (
		<div className="form-group">
			<label htmlFor="email">Email</label>
			<input id="email" type="email" {...register()} placeholder="Digite seu email" />
			{fieldState.error && <div className="error">{fieldState.error.message}</div>}
		</div>
	));

const AgeField = field("age")
	.schema(
		z.preprocess(
			(value) => (!value ? undefined : Number(value)),
			z.number().min(18, "Idade mínima é 18 anos")
		)
	)
	.render(({ register, fieldState }) => (
		<div className="form-group">
			<label htmlFor="age">Idade</label>
			<input
				id="age"
				type="number"
				{...register({ valueAsNumber: true })}
				placeholder="Digite sua idade"
			/>
			{fieldState.error && <div className="error">{fieldState.error.message}</div>}
		</div>
	));

const fields = [NameField, EmailField, AgeField];

function App() {
	// Usar formyResolver com os campos criados
	const resolver = formyResolver({
		fields,
	});

	// O tipo será inferido automaticamente do resolver
	const methods = useForm({
		resolver,
		mode: "onBlur", // Valida ao perder o foco
		reValidateMode: "onChange", // Revalida ao mudar
		defaultValues: {
			name: "",
			email: "",
			age: undefined,
		},
	});

	const {
		handleSubmit,
		formState: { errors, isSubmitting },
	} = methods;

	const onSubmit = async (data: FieldsToObject<typeof fields>) => {
		console.log("✅ Dados do formulário:", data);
		alert(`Formulário enviado com sucesso!\n\n${JSON.stringify(data, null, 2)}`);
	};

	const onError = (errors: any) => {
		console.log("❌ Erros de validação:", errors);
	};

	return (
		<div>
			<h1>🧪 Teste de Build - Zormy</h1>
			<div className="info">
				<p>
					<strong>Este app testa os arquivos compilados do zormy</strong>
				</p>
				<p>Verifique o console do navegador para confirmar que os imports estão funcionando.</p>
				<p>
					Os arquivos estão sendo carregados de <code>packages/zormy/dist/</code>
				</p>
			</div>

			<h2>Formulário de Teste</h2>
			<FormProvider {...methods}>
				<form onSubmit={handleSubmit(onSubmit, onError)}>
					{/* Os campos do zormy usam useField internamente, não precisam de props */}
					<NameField />
					<EmailField />
					<AgeField />

					<button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Enviando..." : "Enviar"}
					</button>
				</form>
			</FormProvider>

			{Object.keys(errors).length > 0 && (
				<div className="error" style={{ marginTop: "1rem" }}>
					<strong>Erros no formulário:</strong>
					<ul>
						{Object.entries(errors).map(([key, error]: [string, any]) => (
							<li key={key}>
								<strong>{key}:</strong> {error?.message || "Erro de validação"}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

export default App;
