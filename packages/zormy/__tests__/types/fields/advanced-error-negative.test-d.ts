/**
 * Testes de tipagem - Erro Negativo Avançado
 *
 * Testa casos avançados de detecção de erros de tipo.
 * Estes testes DEVEM PASSAR (os erros devem existir onde marcados).
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

describe("Type Safety - Testes de Erro Negativo Avançado", () => {
	it("deve rejeitar acesso a campo não dependente mesmo com chave válida", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(() => null);

		const EmailField = field("email")
			.schema(z.string().email())
			.render(() => null);

		const PhoneField = field("phone")
			.dependsOn(NameField)
			.schema((formValues) => {
				const name = formValues?.name;
				if (name && name.length > 0) {
					return z.string().min(10);
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				// PhoneField depende apenas de NameField, não de EmailField
				// @ts-expect-error - "email" não é uma dependência de PhoneField
				const email = getValues("email");
				return null;
			});
	});
});
