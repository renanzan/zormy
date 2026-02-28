import { z } from "zod";
import { describe, expect, it } from "vitest";

import {
	createNestedSchema,
	flattenToNested,
	getNestedValue,
	mergeNested,
	nestedToFlatten,
	setNestedValue,
} from "../../../src/resolver/helpers/nested-objects";

/**
 * Testes de utilitários para manipulação de objetos aninhados.
 *
 * Demonstra como trabalhar com estruturas aninhadas usando dot notation,
 * incluindo conversão entre formatos flat e nested.
 */
describe("nested-objects - manipulação de estruturas aninhadas", () => {
	describe("setNestedValue - definir valor em caminho aninhado", () => {
		it("deve definir valor em objeto aninhado usando dot notation", () => {
			const obj: Record<string, any> = {};
			setNestedValue(obj, "a.b.c", "value");

			expect(obj).toEqual({ a: { b: { c: "value" } } });
		});

		it("deve sobrescrever valor existente em caminho aninhado", () => {
			const obj = { a: { b: { c: "old" } } };
			setNestedValue(obj, "a.b.c", "new");

			expect(obj.a.b.c).toBe("new");
		});

		it("deve criar estrutura aninhada completa quando não existe", () => {
			const obj: Record<string, any> = {};
			setNestedValue(obj, "x.y.z", 123);

			expect(obj).toEqual({ x: { y: { z: 123 } } });
		});

		it("deve preservar outras propriedades ao criar estrutura aninhada", () => {
			const obj: Record<string, any> = { other: "value" };
			setNestedValue(obj, "nested.path", "new");

			expect(obj).toEqual({
				other: "value",
				nested: { path: "new" },
			});
		});
	});

	describe("getNestedValue - obter valor de caminho aninhado", () => {
		it("deve obter valor de objeto aninhado usando dot notation", () => {
			const obj = { a: { b: { c: "value" } } };
			expect(getNestedValue(obj, "a.b.c")).toBe("value");
		});

		it("deve retornar undefined para caminho inexistente", () => {
			const obj = { a: { b: { c: "value" } } };
			expect(getNestedValue(obj, "a.b.d")).toBeUndefined();
		});

		it("deve retornar undefined para objeto null", () => {
			const obj: any = { a: null };
			expect(getNestedValue(obj, "a.b")).toBeUndefined();
		});

		it("deve retornar undefined para caminho parcial inexistente", () => {
			const obj = { a: { b: {} } };
			expect(getNestedValue(obj, "a.b.c.d")).toBeUndefined();
		});

		it("deve retornar valor de nível único (sem aninhamento)", () => {
			const obj = { name: "John" };
			expect(getNestedValue(obj, "name")).toBe("John");
		});
	});

	describe("flattenToNested - converter objeto flat para aninhado", () => {
		it("deve converter objeto flat com chaves dot notation para estrutura aninhada", () => {
			const flat = { "a.b.c": "value1", "a.b.d": "value2" };
			const nested = flattenToNested(flat);

			expect(nested).toEqual({
				a: {
					b: {
						c: "value1",
						d: "value2",
					},
				},
			});
		});

		it("deve lidar com chaves sem pontos (preservar como propriedades de nível superior)", () => {
			const flat = { name: "John", "a.b": "value" };
			const nested = flattenToNested(flat);

			expect(nested).toEqual({
				name: "John",
				a: { b: "value" },
			});
		});

		it("deve mesclar múltiplos caminhos que compartilham prefixo", () => {
			const flat = {
				"user.name": "John",
				"user.email": "john@example.com",
				"address.street": "Main St",
			};
			const nested = flattenToNested(flat);

			expect(nested).toEqual({
				user: {
					name: "John",
					email: "john@example.com",
				},
				address: {
					street: "Main St",
				},
			});
		});

		it("deve lidar com objetos vazios", () => {
			const flat = {};
			const nested = flattenToNested(flat);

			expect(nested).toEqual({});
		});

		it("deve criar estrutura aninhada profunda (múltiplos níveis)", () => {
			const flat = {
				"level1.level2.level3.level4": "deep value",
			};
			const nested = flattenToNested(flat);

			expect(nested).toEqual({
				level1: {
					level2: {
						level3: {
							level4: "deep value",
						},
					},
				},
			});
		});
	});

	describe("nestedToFlatten - converter objeto aninhado para flat", () => {
		it("deve converter objeto aninhado para formato flat com dot notation", () => {
			const nested = {
				a: {
					b: {
						c: "value1",
						d: "value2",
					},
				},
			};
			const flat = nestedToFlatten(nested);

			expect(flat).toEqual({
				"a.b.c": "value1",
				"a.b.d": "value2",
			});
		});

		it("deve preservar valores primitivos no nível superior", () => {
			const nested = { name: "John", age: 30 };
			const flat = nestedToFlatten(nested);

			expect(flat).toEqual({ name: "John", age: 30 });
		});

		it("deve converter estrutura mista (flat + aninhada) corretamente", () => {
			const nested = {
				name: "John",
				user: {
					email: "john@example.com",
				},
			};
			const flat = nestedToFlatten(nested);

			expect(flat).toEqual({
				name: "John",
				"user.email": "john@example.com",
			});
		});

		it("deve lidar com objetos vazios", () => {
			const nested = {};
			const flat = nestedToFlatten(nested);

			expect(flat).toEqual({});
		});

		it("deve converter estrutura aninhada profunda", () => {
			const nested = {
				level1: {
					level2: {
						level3: {
							value: "deep",
						},
					},
				},
			};
			const flat = nestedToFlatten(nested);

			expect(flat).toEqual({
				"level1.level2.level3.value": "deep",
			});
		});
	});

	describe("mergeNested - mesclar objetos aninhados", () => {
		it("deve mesclar objetos aninhados combinando propriedades", () => {
			const obj1 = { a: { b: { c: "value1" } } };
			const obj2 = { a: { b: { d: "value2" } } };
			const merged = mergeNested(obj1, obj2);

			expect(merged).toEqual({
				a: {
					b: {
						c: "value1",
						d: "value2",
					},
				},
			});
		});

		it("deve sobrescrever valores primitivos quando mesclar", () => {
			const obj1 = { a: { b: "old" } };
			const obj2 = { a: { b: "new" } };
			const merged = mergeNested(obj1, obj2);

			expect(merged.a.b).toBe("new");
		});

		it("deve ignorar valores null/undefined ao mesclar", () => {
			const obj1 = { a: { b: "value" } };
			const merged = mergeNested(obj1, null, undefined);

			expect(merged).toEqual(obj1);
		});

		it("deve mesclar múltiplos objetos em sequência", () => {
			const obj1 = { a: { x: 1 } };
			const obj2 = { a: { y: 2 } };
			const obj3 = { a: { z: 3 } };
			const merged = mergeNested(obj1, obj2, obj3);

			expect(merged).toEqual({
				a: {
					x: 1,
					y: 2,
					z: 3,
				},
			});
		});

		describe("preservação de instâncias de classe", () => {
			/**
			 * Classe mock para simular instâncias de classe como FileEntry
			 * que devem ser preservadas durante o merge
			 */
			class MockFileEntry {
				constructor(
					public id: string,
					public name: string,
					public size: number,
					public url: string
				) {}

				getFormattedSize(): string {
					return `${this.size} bytes`;
				}

				isValid(): boolean {
					return !!this.id && !!this.url;
				}
			}

			/**
			 * Classe mock adicional para testar múltiplos tipos de instâncias
			 */
			class MockDateWrapper {
				constructor(public date: Date) {}

				getTimestamp(): number {
					return this.date.getTime();
				}
			}

			it("deve preservar instância de classe sem destruir seus métodos", () => {
				const fileEntry = new MockFileEntry("123", "test.jpg", 1024, "http://example.com/test.jpg");
				const obj1 = { profilePicture: fileEntry };
				const obj2 = { name: "John" };

				const merged = mergeNested(obj1, obj2);

				// Verifica que a instância foi preservada (mesma referência)
				expect(merged.profilePicture).toBe(fileEntry);
				// Verifica que é uma instância da classe
				expect(merged.profilePicture).toBeInstanceOf(MockFileEntry);
				// Verifica que os métodos ainda funcionam
				expect(merged.profilePicture.getFormattedSize()).toBe("1024 bytes");
				expect(merged.profilePicture.isValid()).toBe(true);
				// Verifica que as propriedades foram preservadas
				expect(merged.profilePicture.id).toBe("123");
				expect(merged.profilePicture.name).toBe("test.jpg");
				// Verifica que outros valores foram mesclados corretamente
				expect(merged.name).toBe("John");
			});

			it("deve preservar múltiplas instâncias de classe diferentes", () => {
				const fileEntry = new MockFileEntry("123", "test.jpg", 1024, "http://example.com/test.jpg");
				const dateWrapper = new MockDateWrapper(new Date("2024-01-01"));
				const obj1 = { file: fileEntry, date: dateWrapper };
				const obj2 = { name: "John" };

				const merged = mergeNested(obj1, obj2);

				// Verifica que ambas as instâncias foram preservadas
				expect(merged.file).toBe(fileEntry);
				expect(merged.file).toBeInstanceOf(MockFileEntry);
				expect(merged.date).toBe(dateWrapper);
				expect(merged.date).toBeInstanceOf(MockDateWrapper);
				// Verifica que os métodos ainda funcionam
				expect(merged.file.getFormattedSize()).toBe("1024 bytes");
				expect(merged.date.getTimestamp()).toBe(new Date("2024-01-01").getTime());
			});

			it("deve preservar instâncias de classe em objetos aninhados", () => {
				const fileEntry = new MockFileEntry("123", "test.jpg", 1024, "http://example.com/test.jpg");
				const obj1 = { user: { avatar: fileEntry, name: "John" } };
				const obj2 = { user: { email: "john@example.com" } };

				const merged = mergeNested(obj1, obj2);

				// Verifica que a instância foi preservada no objeto aninhado
				expect(merged.user.avatar).toBe(fileEntry);
				expect(merged.user.avatar).toBeInstanceOf(MockFileEntry);
				expect(merged.user.avatar.getFormattedSize()).toBe("1024 bytes");
				// Verifica que outros valores foram mesclados corretamente
				expect(merged.user.name).toBe("John");
				expect(merged.user.email).toBe("john@example.com");
			});

			it("deve preservar instância de classe mesmo quando sobrescrevendo objeto", () => {
				const fileEntry1 = new MockFileEntry("123", "old.jpg", 512, "http://example.com/old.jpg");
				const fileEntry2 = new MockFileEntry("456", "new.jpg", 2048, "http://example.com/new.jpg");
				const obj1 = { file: fileEntry1 };
				const obj2 = { file: fileEntry2 };

				const merged = mergeNested(obj1, obj2);

				// Quando há conflito, o último valor prevalece, mas deve ser preservado como instância
				expect(merged.file).toBe(fileEntry2);
				expect(merged.file).toBeInstanceOf(MockFileEntry);
				expect(merged.file.id).toBe("456");
				expect(merged.file.getFormattedSize()).toBe("2048 bytes");
			});

			it("deve preservar instâncias de classe e ainda mesclar objetos simples", () => {
				const fileEntry = new MockFileEntry("123", "test.jpg", 1024, "http://example.com/test.jpg");
				const obj1 = {
					file: fileEntry,
					metadata: { author: "John", version: 1 },
				};
				const obj2 = {
					metadata: { version: 2, license: "MIT" },
				};

				const merged = mergeNested(obj1, obj2);

				// Instância de classe deve ser preservada
				expect(merged.file).toBe(fileEntry);
				expect(merged.file).toBeInstanceOf(MockFileEntry);
				// Objetos simples devem ser mesclados
				expect(merged.metadata).toEqual({
					author: "John",
					version: 2,
					license: "MIT",
				});
			});

			it("deve preservar arrays de instâncias de classe", () => {
				const file1 = new MockFileEntry("1", "file1.jpg", 1024, "http://example.com/file1.jpg");
				const file2 = new MockFileEntry("2", "file2.jpg", 2048, "http://example.com/file2.jpg");
				const obj1 = { files: [file1, file2] };
				const obj2 = { name: "Documents" };

				const merged = mergeNested(obj1, obj2);

				// Arrays são preservados como estão (não são instâncias de classe)
				expect(Array.isArray(merged.files)).toBe(true);
				expect(merged.files).toHaveLength(2);
				// Mas as instâncias dentro do array devem ser preservadas
				expect(merged.files[0]).toBe(file1);
				expect(merged.files[0]).toBeInstanceOf(MockFileEntry);
				expect(merged.files[1]).toBe(file2);
				expect(merged.files[1]).toBeInstanceOf(MockFileEntry);
			});

			it("não deve confundir objetos simples com instâncias de classe", () => {
				// Objeto simples (não é instância de classe)
				const simpleObj = { id: "123", name: "test" };
				const obj1 = { data: simpleObj };
				const obj2 = { data: { name: "updated" } };

				const merged = mergeNested(obj1, obj2);

				// Objetos simples devem ser mesclados normalmente
				expect(merged.data).toEqual({ id: "123", name: "updated" });
				expect(merged.data).not.toBeInstanceOf(MockFileEntry);
			});
		});
	});

	describe("createNestedSchema - criar schema Zod aninhado", () => {
		it("deve criar schema aninhado a partir de shape flat com dot notation", () => {
			const shape = {
				"a.b.c": z.string(),
				"a.b.d": z.number(),
			};
			const schema = createNestedSchema(shape);

			expect(schema).toBeInstanceOf(z.ZodObject);

			const result = schema.safeParse({
				a: {
					b: {
						c: "test",
						d: 123,
					},
				},
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({
					a: {
						b: {
							c: "test",
							d: 123,
						},
					},
				});
			}
		});

		it("deve validar schema aninhado corretamente (aceita válidos e rejeita inválidos)", () => {
			const shape = {
				"user.name": z.string(),
				"user.age": z.number(),
			};
			const schema = createNestedSchema(shape);

			// Dados válidos
			const valid = schema.safeParse({
				user: {
					name: "John",
					age: 30,
				},
			});
			expect(valid.success).toBe(true);

			// Dados inválidos (age não é número)
			const invalid = schema.safeParse({
				user: {
					name: "John",
					age: "not a number",
				},
			});
			expect(invalid.success).toBe(false);
		});

		it("deve criar schema aninhado profundo (múltiplos níveis)", () => {
			const shape = {
				"level1.level2.level3": z.string(),
			};
			const schema = createNestedSchema(shape);

			const result = schema.safeParse({
				level1: {
					level2: {
						level3: "deep",
					},
				},
			});

			expect(result.success).toBe(true);
		});

		it("deve mesclar múltiplos caminhos que compartilham prefixo", () => {
			const shape = {
				"user.name": z.string(),
				"user.email": z.string().email(),
				"address.street": z.string(),
			};
			const schema = createNestedSchema(shape);

			const result = schema.safeParse({
				user: {
					name: "John",
					email: "john@example.com",
				},
				address: {
					street: "Main St",
				},
			});

			expect(result.success).toBe(true);
		});
	});
});
