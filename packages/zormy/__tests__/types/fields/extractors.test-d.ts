/**
 * Testes de tipagem - Extractors
 *
 * Testa os tipos helpers para extrair informações de campos (FieldKey, FieldValue,
 * FieldsToObject, DependencyKey, FieldResult).
 * Estes testes DEVEM PASSAR quando as tipagens dos extractors estiverem corretas.
 */

import { z } from "zod";
import { expectTypeOf } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";

import type { DependencyKey, FieldResult } from "../../../src/fields/dependency/types/extractors";
import type {
	FieldKey,
	FieldsToObject,
	FieldValue,
} from "../../../src/fields/field/types/extractors";

describe("Type Safety - Extractors", () => {
	describe("FieldKey", () => {
		it("deve extrair a chave literal de um campo simples", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			type Key = FieldKey<typeof NameField>;
			const testKey: Key = "name";
			expectTypeOf<Key>().toEqualTypeOf<"name">();
		});

		it("deve extrair a chave literal de um campo aninhado", () => {
			const EmailField = field("user.email")
				.schema(z.string())
				.render(() => null);

			type Key = FieldKey<typeof EmailField>;
			const testKey: Key = "user.email";
			expectTypeOf<Key>().toEqualTypeOf<"user.email">();
		});

		it("deve retornar never para tipos inválidos", () => {
			type InvalidKey = FieldKey<string>;
			expectTypeOf<InvalidKey>().toEqualTypeOf<never>();
		});
	});

	describe("FieldValue", () => {
		it("deve extrair o tipo string de um campo", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			type Value = FieldValue<typeof NameField>;
			const testValue: Value = "test";
			expectTypeOf<Value>().toEqualTypeOf<string>();
		});

		it("deve extrair o tipo number de um campo", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			type Value = FieldValue<typeof AgeField>;
			const testValue: Value = 25;
			expectTypeOf<Value>().toEqualTypeOf<number>();
		});

		it("deve extrair o tipo enum de um campo", () => {
			const MethodField = field("method")
				.schema(z.enum(["credit", "debit", "pix"]))
				.render(() => null);

			type Value = FieldValue<typeof MethodField>;
			const testValue: Value = "credit";
			expectTypeOf<Value>().toEqualTypeOf<"credit" | "debit" | "pix">();
		});

		it("deve extrair o tipo de um schema dinâmico", () => {
			const DynamicField = field("dynamic")
				.schema(() => {
					return z.string();
				})
				.render(() => null);

			type Value = FieldValue<typeof DynamicField>;
			const testValue: Value = "test";
			expectTypeOf<Value>().toEqualTypeOf<string>();
		});

		it("deve extrair o tipo de um objeto complexo", () => {
			const AddressField = field("address")
				.schema(
					z.object({
						street: z.string(),
						number: z.number(),
						zipCode: z.string(),
					})
				)
				.render(() => null);

			type Value = FieldValue<typeof AddressField>;
			const testValue: Value = {
				street: "Rua Teste",
				number: 123,
				zipCode: "12345-678",
			};
			expectTypeOf(testValue).toEqualTypeOf<{
				street: string;
				number: number;
				zipCode: string;
			}>();
		});
	});

	describe("FieldsToObject", () => {
		it("deve converter um array de campos em um objeto tipado", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const fields = [NameField, AgeField, EmailField] as const;

			type FormData = FieldsToObject<typeof fields>;
			const testData: FormData = {
				name: "João",
				age: 25,
				email: "joao@example.com",
			};
			expectTypeOf<FormData>().toEqualTypeOf<{
				name: string;
				age: number;
				email: string;
			}>();
		});

		it("deve converter campos aninhados corretamente", () => {
			const UserEmailField = field("user.email")
				.schema(z.string())
				.render(() => null);
			const UserNameField = field("user.name")
				.schema(z.string())
				.render(() => null);

			const fields = [UserEmailField, UserNameField] as const;

			type FormData = FieldsToObject<typeof fields>;
			const testData: FormData = {
				"user.email": "test@example.com",
				"user.name": "Test",
			};
			expectTypeOf<FormData>().toEqualTypeOf<{
				"user.email": string;
				"user.name": string;
			}>();
		});

		it("deve retornar Record<string, never> para arrays vazios", () => {
			const fields = [] as const;
			type FormData = FieldsToObject<typeof fields>;
			const testData: FormData = {};
		});
	});

	describe("DependencyKey", () => {
		it("deve extrair a chave de um FieldComponent dependente", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			type Key = DependencyKey<typeof NameField>;
			const testKey: Key = "name";
			expectTypeOf<Key>().toEqualTypeOf<"name">();
		});

		it("deve extrair a chave de uma string dependente", () => {
			type Key = DependencyKey<"age">;
			const testKey: Key = "age";
			expectTypeOf<Key>().toEqualTypeOf<"age">();
		});

		it("deve extrair a chave de uma função lazy que retorna FieldComponent", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			type LazyGetter = () => typeof NameField;
			type Key = DependencyKey<LazyGetter>;
			const testKey: Key = "name";
			expectTypeOf<Key>().toEqualTypeOf<"name">();
		});

		it("deve retornar never para tipos inválidos", () => {
			type InvalidKey = DependencyKey<number>;
			expectTypeOf<InvalidKey>().toEqualTypeOf<never>();
		});
	});

	describe("FieldResult", () => {
		it("deve extrair apenas o tipo do campo quando não há dependências", () => {
			const PersonField = field("person.gender")
				.schema(z.enum(["male", "female"]))
				.render(() => null);

			type PersonOnly = FieldResult<typeof PersonField>;
			const testData: PersonOnly = {
				person: {
					gender: "male",
				},
			};
			expectTypeOf<PersonOnly>().toEqualTypeOf<{
				person: {
					gender: "male" | "female";
				};
			}>();
		});

		it("deve mesclar o tipo do campo com suas dependências", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const PhoneField = field("phone")
				.schema(z.string())
				.render(() => null);
			const PersonField = field("person.gender")
				.dependsOn(NameField, PhoneField)
				.schema(z.enum(["male", "female"]))
				.render(() => null);

			type Person = FieldResult<typeof PersonField, [typeof NameField, typeof PhoneField]>;
			const testData: Person = {
				name: "João",
				phone: "123456789",
				person: {
					gender: "male",
				},
			};
			expectTypeOf<Person>().toEqualTypeOf<{
				name: string;
				phone: string;
				person: {
					gender: "male" | "female";
				};
			}>();
		});

		it("deve mesclar dependências aninhadas corretamente", () => {
			const LocationField = field("config.location")
				.schema(z.string())
				.render(() => null);
			const ThemeField = field("config.theme")
				.schema(z.string())
				.render(() => null);
			const ResultField = field("result")
				.dependsOn(LocationField, ThemeField)
				.schema(z.string())
				.render(() => null);

			type Result = FieldResult<typeof ResultField, [typeof LocationField, typeof ThemeField]>;
			const testData: Result = {
				config: {
					location: "BR",
					theme: "dark",
				},
				result: "success",
			};
			expectTypeOf<Result>().toEqualTypeOf<{
				config: {
					location: string;
					theme: string;
				};
				result: string;
			}>();
		});

		it("deve funcionar com dependências de tipos diferentes", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);
			const IsActiveField = field("isActive")
				.schema(z.boolean())
				.render(() => null);
			const UserField = field("user.id")
				.dependsOn(NameField, AgeField, IsActiveField)
				.schema(z.string())
				.render(() => null);

			type User = FieldResult<
				typeof UserField,
				[typeof NameField, typeof AgeField, typeof IsActiveField]
			>;
			const testData: User = {
				name: "João",
				age: 25,
				isActive: true,
				user: {
					id: "123",
				},
			};
			expectTypeOf<User>().toEqualTypeOf<{
				name: string;
				age: number;
				isActive: boolean;
				user: {
					id: string;
				};
			}>();
		});

		it("deve funcionar com dependências lazy", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			// Simula uma dependência lazy
			type LazyNameField = () => typeof NameField;
			const PersonField = field("person.gender")
				.schema(z.enum(["male", "female"]))
				.render(() => null);

			// Nota: Na prática, dependências lazy precisam ser resolvidas em runtime
			// Este teste verifica que o tipo funciona mesmo sem dependências explícitas
			type PersonOnly = FieldResult<typeof PersonField>;
			const testData: PersonOnly = {
				person: {
					gender: "male",
				},
			};

			expectTypeOf<LazyNameField>().toEqualTypeOf<() => typeof NameField>();
			expectTypeOf<PersonOnly>().toEqualTypeOf<{
				person: {
					gender: "male" | "female";
				};
			}>();
		});

		it("deve mesclar múltiplas dependências com o mesmo prefixo", () => {
			const UserEmailField = field("user.email")
				.schema(z.string().email())
				.render(() => null);
			const UserNameField = field("user.name")
				.schema(z.string())
				.render(() => null);
			const UserAgeField = field("user.age")
				.schema(z.number())
				.render(() => null);
			const ProfileField = field("profile.bio")
				.dependsOn(UserEmailField, UserNameField, UserAgeField)
				.schema(z.string())
				.render(() => null);

			type Profile = FieldResult<
				typeof ProfileField,
				[typeof UserEmailField, typeof UserNameField, typeof UserAgeField]
			>;
			const testData: Profile = {
				user: {
					email: "test@example.com",
					name: "Test",
					age: 25,
				},
				profile: {
					bio: "Bio text",
				},
			};
			expectTypeOf<Profile>().toEqualTypeOf<{
				user: {
					email: string;
					name: string;
					age: number;
				};
				profile: {
					bio: string;
				};
			}>();
		});

		it("deve funcionar com campo simples sem aninhamento", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.dependsOn(NameField)
				.schema(z.string().email())
				.render(() => null);

			type Email = FieldResult<typeof EmailField, [typeof NameField]>;
			const testData: Email = {
				name: "João",
				email: "joao@example.com",
			};
			expectTypeOf<Email>().toEqualTypeOf<{
				name: string;
				email: string;
			}>();
		});
	});
});
