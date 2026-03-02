import z from "zod";
import { useForm } from "react-hook-form";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Form } from "../../../src/components/Form";
import { field } from "../../../src/fields/field/builder/builder";
import { zormyResolver } from "../../../src/resolver/resolver";

import type { FieldsToObject } from "../../../src/fields/field/types/extractors";

/**
 * Formulário de teste usando dependsOn.
 */
const HasPasswordField = field("hasPassword")
	.schema(z.boolean())
	.render(({ register }) => (
		<div data-testid="has-password-field">
			<label>
				<input data-testid="has-password-input" type="checkbox" {...register()} />
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
			<div data-testid="password-field">
				<label htmlFor="password">Senha</label>

				<input data-testid="password-input" id="password" type="password" {...register()} />

				{fieldState.error && (
					<span data-testid="password-error" style={{ color: "red" }}>
						{fieldState.error.message}
					</span>
				)}
			</div>
		);
	});

const dependentFields = [HasPasswordField, PasswordField];

function DependentFieldsForm({
	onSubmit,
}: {
	onSubmit?: (data: FieldsToObject<typeof dependentFields>) => void;
}) {
	const form = useForm({
		resolver: zormyResolver({ fields: dependentFields }),
		defaultValues: { hasPassword: false, password: "" },
	});

	return (
		<Form methods={form} onSubmit={onSubmit || (() => {})}>
			<HasPasswordField />
			<PasswordField />
			<button data-testid="submit-button" type="submit">
				Enviar
			</button>
		</Form>
	);
}

describe("field.dependsOn", () => {
	it("não renderiza o campo de senha se hasPassword estiver falso", () => {
		render(<DependentFieldsForm />);
		// checkbox está desmarcado e campo de senha não aparece
		expect(screen.getByTestId("has-password-field")).toBeInTheDocument();
		expect(screen.queryByTestId("password-field")).not.toBeInTheDocument();
	});

	it("renderiza campo senha quando hasPassword for true", async () => {
		render(<DependentFieldsForm />);
		const checkbox = screen.getByTestId("has-password-input");
		fireEvent.click(checkbox);

		// O campo Senha deve aparecer
		expect(await screen.findByTestId("password-field")).toBeInTheDocument();
	});

	it("não exige senha se hasPassword for false (submit sem senha deve passar)", async () => {
		const onSubmit = vi.fn();
		render(<DependentFieldsForm onSubmit={onSubmit} />);
		fireEvent.click(screen.getByTestId("submit-button"));

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith(
				{ hasPassword: false, password: "" },
				expect.anything()
			);
		});
	});

	it("exige senha >= 8 caracteres quando hasPassword for true", async () => {
		render(<DependentFieldsForm />);
		const checkbox = screen.getByTestId("has-password-input");
		fireEvent.click(checkbox);

		const senhaInput = await screen.findByTestId("password-input");
		fireEvent.change(senhaInput, { target: { value: "123" } });
		fireEvent.click(screen.getByTestId("submit-button"));

		// Deve mostrar erro
		expect(await screen.findByTestId("password-error")).toHaveTextContent(
			"Senha deve ter pelo menos 8 caracteres"
		);
	});

	it("aceita senha válida quando hasPassword for true", async () => {
		const onSubmit = vi.fn();
		render(<DependentFieldsForm onSubmit={onSubmit} />);
		const checkbox = screen.getByTestId("has-password-input");
		fireEvent.click(checkbox);
		const senhaInput = await screen.findByTestId("password-input");
		fireEvent.change(senhaInput, { target: { value: "abcdefgh" } });

		fireEvent.click(screen.getByTestId("submit-button"));

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith(
				{ hasPassword: true, password: "abcdefgh" },
				expect.anything()
			);
		});
	});

	it("campo com múltiplas dependências", async () => {
		const EnableMFAField = field("enableMFA")
			.dependsOn(HasPasswordField, PasswordField)
			.schema((formValues) => {
				const password = formValues?.password;
				const hasPassword = formValues?.hasPassword;

				if (hasPassword && (!password || password?.length < 10)) {
					return z
						.boolean()
						.refine((v) => v === true, { message: "Senha fraca, por favor, ative o MFA" });
				}

				return z.boolean().optional();
			})
			.render(({ watch, register, fieldState }) => {
				const hasPassword = watch("hasPassword");

				if (!hasPassword) return null;

				return (
					<div data-testid="enable-mfa-field">
						<label>
							<input data-testid="enable-mfa-input" type="checkbox" {...register()} />
							Ativar MFA?
						</label>

						{fieldState.error && (
							<span data-testid="enable-mfa-error" style={{ color: "red" }}>
								{fieldState.error.message}
							</span>
						)}
					</div>
				);
			});

		const onSubmit = vi.fn();

		render(
			<Form
				fields={[HasPasswordField, PasswordField, EnableMFAField]}
				defaultValues={{ hasPassword: false, password: "", enableMFA: false }}
				onSubmit={onSubmit}
			>
				<HasPasswordField />
				<PasswordField />
				<EnableMFAField />

				<button data-testid="submit-button" type="submit">
					Enviar
				</button>
			</Form>
		);

		const checkbox = screen.getByTestId("has-password-input");
		fireEvent.click(checkbox);

		const senhaInput = await screen.findByTestId("password-input");
		fireEvent.change(senhaInput, { target: { value: "12345678" } });

		fireEvent.click(screen.getByTestId("submit-button"));

		const errorMessage = await screen.findByText("Senha fraca, por favor, ative o MFA");
		expect(errorMessage).toBeInTheDocument();

		// Simula o usuário marcando o enableMFA depois do erro (MFA obrigatório)
		const enableMFAInput = await screen.findByTestId("enable-mfa-input");
		fireEvent.click(enableMFAInput);

		fireEvent.click(screen.getByTestId("submit-button"));

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith(
				{ hasPassword: true, password: "12345678", enableMFA: true },
				expect.anything()
			);
		});
	});

	it("dependsOn aceita string (chave) em vez de Field", async () => {
		const PasswordByKeyField = field("password")
			.dependsOn("hasPassword")
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
					<div data-testid="password-by-key-field">
						<label htmlFor="pwd-by-key">Senha</label>
						<input
							data-testid="password-by-key-input"
							id="pwd-by-key"
							type="password"
							{...register()}
						/>
						{fieldState.error && (
							<span data-testid="password-by-key-error">{fieldState.error.message}</span>
						)}
					</div>
				);
			});

		const onSubmit = vi.fn();
		render(
			<Form
				fields={[HasPasswordField, PasswordByKeyField]}
				defaultValues={{ hasPassword: false, password: "" }}
				onSubmit={onSubmit}
			>
				<HasPasswordField />
				<PasswordByKeyField />
				<button data-testid="submit-button" type="submit">
					Enviar
				</button>
			</Form>
		);

		// Sem senha: submit passa
		fireEvent.click(screen.getByTestId("submit-button"));
		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith(
				{ hasPassword: false, password: "" },
				expect.anything()
			);
		});
		onSubmit.mockClear();

		// Com senha marcada mas senha curta: deve mostrar erro
		fireEvent.click(screen.getByTestId("has-password-input"));
		const input = await screen.findByTestId("password-by-key-input");
		fireEvent.change(input, { target: { value: "123" } });
		fireEvent.click(screen.getByTestId("submit-button"));
		expect(await screen.findByTestId("password-by-key-error")).toHaveTextContent(
			"Senha deve ter pelo menos 8 caracteres"
		);

		// Senha válida: submit passa
		fireEvent.change(input, { target: { value: "12345678" } });
		fireEvent.click(screen.getByTestId("submit-button"));
		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith(
				{ hasPassword: true, password: "12345678" },
				expect.anything()
			);
		});
	});
});
