import type { FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Retorno de `useForm` / `useZormy` aceito por `Form`, `Wizard`, `createForm`, etc.
 *
 * Usa os três genéricos de `UseFormReturn` de forma explícita para não depender do
 * default de `TTransformedValues` (varia entre versões do react-hook-form).
 */
export type ZormyFormMethods<TFieldValues extends FieldValues = FieldValues> =
	UseFormReturn<TFieldValues, any, TFieldValues | undefined>;
