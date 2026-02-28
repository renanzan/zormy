import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import { useField } from "../../../src/fields/field/hooks/use-field";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

/**
 * Testes do hook useField (uso direto e via campo).
 * Cobre erro fora de FormProvider e ramos de register/watch.
 */
describe("useField", () => {
	it("deve lançar quando usado fora de FormProvider", () => {
		const ComponentThatUsesUseField = () => {
			(useField as (key: string) => unknown)("name");
			return null;
		};
		expect(() => render(<ComponentThatUsesUseField />)).toThrow(
			/useField deve ser usado dentro de um FormProvider/
		);
	});

	it("deve suportar register com name customizado e watch com/sem argumento", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(({ register, watch }) => {
				// Exercita register com opções (name override) e watch(undefined), watch(key), watch(outro path)
				const all = watch();
				const nameVal = watch("name");
				const other = watch("other" as any);
				return (
					<div>
						<input {...register()} data-testid="default-name" />
						<input {...register({ name: "customName" })} data-testid="custom-name" />
						<span data-testid="all">{typeof all === "object" ? "object" : ""}</span>
						<span data-testid="name-val">{nameVal === undefined || nameVal === "" ? "empty" : String(nameVal)}</span>
						<span data-testid="other">{other !== undefined ? "set" : "unset"}</span>
					</div>
				);
			});

		const TestForm = () => {
			const methods = useForm({
				defaultValues: { name: "", customName: "", other: "" },
			});
			return (
				<FormProvider {...methods}>
					<NameField />
				</FormProvider>
			);
		};

		render(<TestForm />);
		expect(screen.getByTestId("default-name")).toBeInTheDocument();
		expect(screen.getByTestId("custom-name")).toBeInTheDocument();
		expect(screen.getByTestId("all").textContent).toBe("object");
		expect(screen.getByTestId("name-val").textContent).toBe("empty");
	});
});
