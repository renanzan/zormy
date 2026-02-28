/**
 * Módulo de campos do Zormy.
 *
 * Exporta builders (`field`, `abstractField`), factory (`createField`), hook `useField`
 * e tipos para criar campos de formulário reutilizáveis com schema Zod e renderização customizada.
 *
 * @example
 * ```ts
 * import { field, useField } from "zormy";
 * const NameField = field("name").schema(z.string()).render(({ register }) => <input {...register()} />);
 * ```
 */

export { abstractField, field } from "./field/builder/builder";
export { createField } from "./field/builder/factory";
export { useField } from "./field/hooks/use-field";

export type { FieldOptions } from "./field/builder/factory";
export type { RenderFieldHandler } from "./field/builder/handlers";
export type { UseFieldReturn } from "./field/hooks/use-field";
