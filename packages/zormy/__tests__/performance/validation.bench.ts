import { z } from "zod";
import { bench, describe } from "vitest";

import { field } from "../../src/fields/field/builder/builder";
import { zormyResolver } from "../../src/resolver/resolver";

/**
 * Benchmark da validação Zod via zormyResolver (Zormy + RHF).
 *
 * Objetivo: medir Execution Time e Ops/sec do custo da validação Zod na lib.
 * Execute com: pnpm test -- --bench __tests__/performance/validation.bench.ts
 * ou: pnpm exec vitest bench --run
 */
describe("validação Zod (zormyResolver)", () => {
	const NameField = field("name")
		.schema(z.string().min(2, "Mínimo 2 caracteres"))
		.render(() => null);

	const EmailField = field("email")
		.schema(z.string().email("Email inválido"))
		.render(() => null);

	const AgeField = field("age")
		.schema(z.number().min(18, "Maior de idade").max(120))
		.render(() => null);

	const fields = [NameField, EmailField, AgeField] as const;
	const resolver = zormyResolver({ fields });

	const validData = {
		name: "João Silva",
		email: "joao@example.com",
		age: 25,
	};

	const invalidData = {
		name: "J",
		email: "invalido",
		age: 10,
	};

	bench("validação com dados válidos (1000x em sequência)", async () => {
		for (let i = 0; i < 1000; i++) {
			await resolver({ ...validData, name: validData.name + i }, {} as never, {} as never);
		}
	});

	bench("validação com dados inválidos (1000x em sequência)", async () => {
		for (let i = 0; i < 1000; i++) {
			await resolver({ ...invalidData, age: invalidData.age + i }, {} as never, {} as never);
		}
	});

	bench("uma chamada de validação válida", async () => {
		await resolver(validData, {} as never, {} as never);
	});

	bench("uma chamada de validação inválida", async () => {
		await resolver(invalidData, {} as never, {} as never);
	});
});
