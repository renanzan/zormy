/**
 * Testes de tipagem - Tipos Complexos
 *
 * Verifica tipagem correta com schemas complexos (objetos, arrays, unions).
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

import type { FieldValue } from "../../../src/fields/field/types/extractors";

describe("Type Safety - Tipos Complexos", () => {
	it("deve inferir tipo correto para schema de objeto", () => {
		const AddressField = field("address")
			.schema(
				z.object({
					street: z.string(),
					number: z.number(),
					zipCode: z.string(),
				})
			)
			.render(() => null);

		type AddressType = FieldValue<typeof AddressField>;
		const address: AddressType = {
			street: "Rua Teste",
			number: 123,
			zipCode: "12345-678",
		};
		expectTypeOf(address).toEqualTypeOf<{
			street: string;
			number: number;
			zipCode: string;
		}>();
	});

	it("deve inferir tipo correto para schema de array", () => {
		const TagsField = field("tags")
			.schema(z.array(z.string()))
			.render(() => null);

		type TagsType = FieldValue<typeof TagsField>;
		const tags: TagsType = ["tag1", "tag2", "tag3"];
		expectTypeOf(tags).toEqualTypeOf<string[]>();
	});

	it("deve inferir tipo correto para schema de union", () => {
		const ValueField = field("value")
			.schema(z.union([z.string(), z.number()]))
			.render(() => null);

		type ValueType = FieldValue<typeof ValueField>;
		// Verifica que o tipo é string | number
		expectTypeOf<ValueType>().toEqualTypeOf<string | number>();
		// Verifica que valores string e number são aceitos
		const stringValue: ValueType = "test";
		const numberValue: ValueType = 123;
		// Verifica que os valores atribuídos são compatíveis com o tipo
		const testString: string | number = stringValue;
		const testNumber: string | number = numberValue;
	});

	it("deve inferir tipo correto para schema de objeto aninhado", () => {
		const UserField = field("user")
			.schema(
				z.object({
					name: z.string(),
					address: z.object({
						street: z.string(),
						city: z.string(),
					}),
				})
			)
			.render(() => null);

		type UserType = FieldValue<typeof UserField>;
		const user: UserType = {
			name: "João",
			address: {
				street: "Rua Teste",
				city: "São Paulo",
			},
		};
		expectTypeOf(user).toEqualTypeOf<{
			name: string;
			address: {
				street: string;
				city: string;
			};
		}>();
	});

	it("deve inferir tipo correto para schema de array de objetos", () => {
		const ItemsField = field("items")
			.schema(
				z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						price: z.number(),
					})
				)
			)
			.render(() => null);

		type ItemsType = FieldValue<typeof ItemsField>;
		const items: ItemsType = [
			{ id: "1", name: "Item 1", price: 10.0 },
			{ id: "2", name: "Item 2", price: 20.0 },
		];
		expectTypeOf(items).toEqualTypeOf<
			Array<{
				id: string;
				name: string;
				price: number;
			}>
		>();
	});

	it("deve inferir tipo correto para schema com dependências e tipos complexos", () => {
		const CategoryField = field("category")
			.schema(z.enum(["electronics", "clothing", "books"]))
			.render(() => null);

		const ProductsField = field("products")
			.dependsOn(CategoryField)
			.schema((formValues) => {
				const category = formValues?.category;
				return z.array(
					z.object({
						name: z.string(),
						category: z.enum(["electronics", "clothing", "books"]),
						price: z.number(),
					})
				);
			})
			.render(({ getValues }) => {
				const category = getValues("category");
				// Verifica que o tipo é compatível com o enum esperado
				const testCategory: "electronics" | "clothing" | "books" | undefined = category;
				return null;
			});
	});
});
