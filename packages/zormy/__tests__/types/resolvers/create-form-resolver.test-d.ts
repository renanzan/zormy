import { z } from "zod";
import { useForm } from "react-hook-form";
import { describe, it } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import { zormyResolver } from "../../../src/resolver/resolver";

describe("Type Safety - zormyResolver para react-hook-form", () => {
	describe("resolver para campos flat", () => {
		it("deve criar resolver para campos simples sem aninhamento", async () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			class People {
				constructor(
					public name: string,
					public age: number
				) {}
			}

			const PeopleField = field("people")
				.schema(z.instanceof(People).optional())
				.render(() => null);

			const methods = useForm({
				resolver: zormyResolver({
					fields: [NameField, EmailField, PeopleField],
				}),
				defaultValues: {
					name: "John",
					email: "john@example.com",
					people: new People("John", 20),
				},
			});
		});
	});
});
