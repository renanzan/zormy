/**
 * Utilitários para criação de resolvers dinâmicos para validação de steps.
 * Centraliza lógica de validação de schemas aninhados e conversão de erros.
 */

import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { flattenToNested, getNestedValue } from "../../../resolver/helpers/nested-objects";

import type {
	FieldErrors,
	FieldValues,
	Path,
	ResolverOptions,
	ResolverResult,
} from "react-hook-form";

/**
 * Extrai valores do step atual de um objeto de valores do formulário.
 *
 * @param values - Valores completos do formulário
 * @param stepFields - Campos do step atual
 * @returns Objeto flat com apenas os valores do step atual
 */
function extractStepValues(
	values: Record<string, unknown>,
	stepFields: string[]
): Record<string, unknown> {
	const stepValuesFlat: Record<string, unknown> = {};

	for (const field of stepFields) {
		const fieldPath = field as string;
		if (fieldPath.includes(".")) {
			// Para paths aninhados, extrai usando o path completo
			const value = getNestedValue(values, fieldPath);
			if (value !== undefined) {
				stepValuesFlat[fieldPath] = value;
			}
		} else {
			// Para paths flat, acessa diretamente
			const value = values[fieldPath];
			if (value !== undefined) {
				stepValuesFlat[fieldPath] = value;
			}
		}
	}

	return stepValuesFlat;
}

/**
 * Converte erros do Zod para o formato esperado pelo react-hook-form.
 * Cria estrutura aninhada de erros baseada nos paths dos erros do Zod.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 * @param zodErrors - Erros do Zod
 * @returns Objeto de erros no formato do react-hook-form
 */
function convertZodErrorsToFormErrors<TFieldValues extends FieldValues>(
	zodErrors: z.ZodError
): FieldErrors<TFieldValues> {
	const errors = {} as FieldErrors<TFieldValues>;

	for (const error of zodErrors.errors) {
		// O path do erro já está no formato aninhado (ex: ["proponentPerson", "person", "document"])
		// Precisamos criar a estrutura aninhada de erros
		let current: Record<string, unknown> = errors as Record<string, unknown>;
		for (let i = 0; i < error.path.length - 1; i++) {
			const key = error.path[i] as string;
			if (!current[key] || typeof current[key] !== "object") {
				current[key] = {};
			}
			current = current[key] as Record<string, unknown>;
		}
		const lastKey = error.path[error.path.length - 1] as string;
		current[lastKey] = {
			message: error.message,
			type: error.code,
		};
	}

	return errors;
}

/**
 * Valida valores aninhados usando um schema Zod.
 * Extrai apenas os valores do step atual e valida contra o schema.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 *
 * @param schema - Schema Zod para validação
 * @param values - Valores a serem validados
 * @param stepFields - Campos do step atual
 * @returns Resultado da validação no formato do react-hook-form
 */
function validateNestedStep<TFieldValues extends FieldValues>(
	schema: z.ZodObject<z.ZodRawShape>,
	values: TFieldValues,
	stepFields: Array<Path<TFieldValues>>
): ResolverResult<TFieldValues> {
	// Extrai apenas os valores do step atual
	const stepValuesFlat = extractStepValues(
		values as Record<string, unknown>,
		stepFields as string[]
	);

	// Converte para estrutura aninhada esperada pelo schema
	const stepValuesNested = flattenToNested(stepValuesFlat);

	// Valida apenas os valores do step atual
	const result = schema.safeParse(stepValuesNested);

	if (!result.success) {
		// Converte os erros para o formato esperado pelo react-hook-form
		const errors = convertZodErrorsToFormErrors<TFieldValues>(result.error);
		return {
			values: {} as Record<string, unknown>,
			errors,
		} as ResolverResult<TFieldValues>;
	}

	// Se passou na validação, retorna sucesso
	return {
		values: values,
		errors: {},
	} as ResolverResult<TFieldValues>;
}

/**
 * Cria um resolver dinâmico que valida apenas os campos do step atual.
 *
 * O resolver é recriado sempre que o step muda, garantindo que apenas os campos
 * do step atual sejam validados. Suporta schemas aninhados (com chaves contendo pontos).
 *
 * @template TFieldValues - Tipo dos valores do formulário
 * @template TSteps - Array de strings literais representando os steps
 *
 * @param schemaFactory - Função que cria o schema baseado no step e valores
 * @param currentStep - Step atual
 * @returns Resolver para react-hook-form
 *
 * @example
 * ```ts
 * const resolver = createDynamicStepResolver(
 *   ({ step, formValues }) => {
 *     if (step === "step1") return z.object({ name: z.string() });
 *     return z.object({ email: z.string().email() });
 *   },
 *   "step1"
 * );
 * ```
 */
export function createDynamicStepResolver<
	TFieldValues extends FieldValues,
	TSteps extends readonly string[],
>(
	schemaFactory: (context: { step: TSteps[number]; formValues?: TFieldValues }) => z.ZodTypeAny,
	currentStep: TSteps[number]
) {
	return async (
		values: TFieldValues,
		context: ResolverOptions<TFieldValues>,
		options: ResolverOptions<TFieldValues>
	): Promise<ResolverResult<TFieldValues>> => {
		// Sempre busca o schema mais recente baseado no step atual e valores
		const currentSchema = schemaFactory({
			step: currentStep,
			formValues: values,
		});

		// O zodResolver do react-hook-form valida os valores completos do formulário
		// Se o schema é aninhado (tem chaves com pontos), precisamos garantir que
		// os valores estejam na estrutura aninhada esperada pelo schema
		if (currentSchema instanceof z.ZodObject) {
			// Obtém as chaves do schema diretamente
			const stepFields = Object.keys(currentSchema.shape) as Array<Path<TFieldValues>>;
			const hasNestedKeys = stepFields.some(
				(field) => typeof field === "string" && field.includes(".")
			);

			if (hasNestedKeys) {
				// Para schemas aninhados, valida usando função auxiliar
				return validateNestedStep(currentSchema, values, stepFields);
			}
		}

		// Para schemas não aninhados ou quando não há chaves com pontos, usa o resolver padrão
		const resolver = zodResolver(currentSchema);
		return resolver(values, context, options);
	};
}
