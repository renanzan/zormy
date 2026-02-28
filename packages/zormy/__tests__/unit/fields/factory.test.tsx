import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createField } from "../../../src/fields/field/builder/factory";

import type { ComponentProps } from "react";
import type { FieldOptions } from "../../../src/fields/field/builder/factory";

/**
 * Testes da factory de campos (createField).
 *
 * Estes testes demonstram como criar campos diretamente usando createField
 * sem o builder fluente, útil para casos mais complexos ou programáticos.
 */
describe("createField - factory para criar campos diretamente", () => {
	describe("criação básica", () => {
		it("deve criar campo usando createField diretamente", () => {
			const options: FieldOptions<"name", z.ZodString, ComponentProps<any>> = {
				key: "name",
				schema: z.string(),
				render: ({ register }) => <input {...register()} />,
			};

			const NameField = createField(options);

			expect(NameField.config.key).toBe("name");
			expect(NameField.config.schema).toBeInstanceOf(z.ZodString);
		});

		it("deve criar campo com schema dinâmico usando createField", () => {
			const AgeField = createField({
				key: "age",
				schema: (formValues) => {
					if (formValues?.isMinor) {
						return z.number().max(17);
					}
					return z.number().min(18);
				},
				render: ({ register }) => <input type="number" {...register()} />,
			});

			expect(AgeField.config.key).toBe("age");

			// Schema dinâmico deve funcionar
			const minorSchema = AgeField.getZodSchema({ isMinor: true });
			expect(minorSchema).toBeInstanceOf(z.ZodNumber);
		});

		it("deve permitir renderizar campo criado com createField", () => {
			const NameField = createField({
				key: "name",
				schema: z.string(),
				render: ({ register }) => <input {...register()} data-testid="name-input" />,
			});

			const TestForm = () => {
				const methods = useForm({ defaultValues: { name: "" } });
				return (
					<FormProvider {...methods}>
						<NameField />
					</FormProvider>
				);
			};

			render(<TestForm />);
			expect(screen.getByTestId("name-input")).toBeInTheDocument();
		});
	});

	describe("campos com dependências", () => {
		it("deve criar campo com dependências usando createField", () => {
			const NameField = createField({
				key: "name",
				schema: z.string(),
				render: ({ register }) => <input {...register()} />,
			});

			const EmailField = createField({
				key: "email",
				schema: (formValues) => {
					const name = formValues?.name;
					return name ? z.string().email() : z.string().optional();
				},
				render: ({ register }) => <input type="email" {...register()} />,
				dependencies: [NameField],
			});

			expect(EmailField.config.dependencies).toEqual(["name"]);
		});

		it("deve criar campo com múltiplas dependências usando createField", () => {
			const AgeField = createField({
				key: "age",
				schema: z.number(),
				render: ({ register }) => <input type="number" {...register()} />,
			});

			const EmailField = createField({
				key: "email",
				schema: z.string().email(),
				render: ({ register }) => <input type="email" {...register()} />,
			});

			const PhoneField = createField({
				key: "phone",
				schema: (formValues) => {
					const age = formValues?.age;
					const email = formValues?.email;
					return age && email ? z.string().optional() : z.string().min(1);
				},
				render: ({ register }) => <input {...register()} />,
				dependencies: [AgeField, EmailField],
			});

			expect(PhoneField.config.dependencies).toEqual(["age", "email"]);
		});

		it("deve criar campo com dependências usando strings", () => {
			const PhoneField = createField({
				key: "phone",
				schema: (formValues) => {
					const age = formValues?.age;
					return age < 18 ? z.string().min(1) : z.string().optional();
				},
				render: ({ register }) => <input {...register()} />,
				dependencies: ["age"],
			});

			expect(PhoneField.config.dependencies).toEqual(["age"]);
		});
	});

	describe("extensão de campos criados com createField", () => {
		it("deve estender campo criado com createField", () => {
			const BaseField = createField({
				key: "name",
				schema: z.string(),
				render: ({ register }) => <input {...register()} />,
			});

			const ExtendedField = BaseField.extend({
				key: "fullName",
				schema: z.string().min(3),
			});

			expect(ExtendedField.config.key).toBe("fullName");
			expect(ExtendedField.config.schema).toBeInstanceOf(z.ZodString);
		});
	});
});
