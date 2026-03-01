import { z } from "zod";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import { Form } from "../../../src/components/Form";
import { useZormy } from "../../../src/form/hooks/useZormy";

describe("useZormy", () => {
	it("deve retornar instância de useForm com resolver injetado e métodos esperados", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(({ register }) => <input {...register()} />);

		function TestForm() {
			const form = useZormy({
				fields: [NameField],
				defaultValues: { name: "" },
			});
			expect(form.handleSubmit).toBeDefined();
			expect(form.formState).toBeDefined();
			expect(form.register).toBeDefined();
			return (
				<Form methods={form} onSubmit={() => {}}>
					<NameField />
					<button type="submit">Enviar</button>
				</Form>
			);
		}

		render(<TestForm />);
		expect(screen.getByRole("button", { name: /enviar/i })).toBeInTheDocument();
	});

	it("deve submeter dados válidos corretamente", async () => {
		const NameField = field("name")
			.schema(z.string().min(2, "Mínimo 2 caracteres"))
			.render(({ register }) => <input {...register()} aria-label="name" />);

		let submitted: { name: string } | undefined;
		function TestForm() {
			const form = useZormy({
				fields: [NameField],
				defaultValues: { name: "" },
				mode: "onSubmit",
			});
			return (
				<Form
					methods={form}
					onSubmit={(data) => {
						submitted = data;
					}}
				>
					<NameField />
					<button type="submit">Enviar</button>
				</Form>
			);
		}

		render(<TestForm />);
		const input = screen.getByLabelText("name");
		const submitBtn = screen.getByRole("button", { name: /enviar/i });

		fireEvent.change(input, { target: { value: "Ab" } });
		fireEvent.click(submitBtn);
		await waitFor(() => {
			expect(submitted).toEqual({ name: "Ab" });
		});
	});

	it("Form com fields (sem methods) deve submeter dados corretamente", async () => {
		const NameField = field("name")
			.schema(z.string().min(2, "Mínimo 2 caracteres"))
			.render(({ register, fieldState }) => (
				<div>
					<input {...register()} aria-label="name" />
					{fieldState.error && <span role="alert">{fieldState.error.message}</span>}
				</div>
			));

		let submitted: { name: string } | undefined;
		function TestForm() {
			return (
				<Form
					fields={[NameField]}
					defaultValues={{ name: "" }}
					mode="onSubmit"
					onSubmit={(data) => {
						submitted = data;
					}}
				>
					<NameField />
					<button type="submit">Enviar</button>
				</Form>
			);
		}

		render(<TestForm />);
		const input = screen.getByLabelText("name");
		const submitBtn = screen.getByRole("button", { name: /enviar/i });

		fireEvent.change(input, { target: { value: "Ab" } });
		fireEvent.click(submitBtn);
		await waitFor(() => {
			expect(submitted).toEqual({ name: "Ab" });
		});
	});
});
