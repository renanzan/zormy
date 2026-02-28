import type { ComponentProps, ReactNode } from "react";
import type { ZodType } from "zod";
import type { UseFieldReturn } from "../hooks/use-field";

/**
 * Função de renderização de um campo de formulário.
 *
 * Esta função é responsável por renderizar o campo no formulário,
 * recebendo o contexto do formulário (register, fieldState, etc.) e props customizadas.
 *
 * @template Key - Chave literal do campo
 * @template Schema - Schema Zod do campo
 * @template Props - Props do componente React
 * @template DepsTypes - Tipos inferidos dos campos dependentes
 *
 * @param context - Contexto do campo com métodos do react-hook-form e estado
 * @param props - Props customizadas passadas para o componente
 * @returns Elemento React renderizado
 *
 * @example
 * ```tsx
 * const renderNameField: RenderFieldHandler<"name", ZodString, { label: string }> = (
 *   context,
 *   props
 * ) => {
 *   return (
 *     <div>
 *       <label>{props.label}</label>
 *       <input {...context.register()} />
 *       {context.fieldState.error && (
 *         <span className="error">{context.fieldState.error.message}</span>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 */
export type RenderFieldHandler<
	Key extends string,
	Schema extends ZodType,
	Props extends ComponentProps<any>,
	DepsTypes = Record<string, never>,
> = (context: UseFieldReturn<Key, Schema, DepsTypes>, props: Props) => ReactNode;
