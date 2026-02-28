import type { ComponentProps, FC } from "react";
import type { ZodType } from "zod";

/**
 * Configuração de um campo de formulário.
 * Contém metadados sobre a chave, schema e dependências do campo.
 *
 * @template Key - Tipo literal da chave do campo
 */
export type FieldConfig<Key extends string> = {
	/** Chave única que identifica o campo no formulário */
	key: Key;
	/** Schema Zod estático do campo (usado para metadados) */
	schema: ZodType;
	/**
	 * Lista de chaves dos campos dos quais este campo depende.
	 * Usado para validação cross-step e dependências dinâmicas.
	 */
	dependencies?: readonly string[];
};

/**
 * Componente de campo tipado para formulários.
 *
 * Um FieldComponent é um componente React funcional que também expõe metadados
 * sobre sua configuração (chave, schema, dependências) e permite extensão.
 *
 * @template Key - Tipo literal da chave do campo (ex: "name", "email")
 * @template Schema - Tipo do schema Zod do campo
 * @template Props - Props do componente React
 *
 * @example
 * ```tsx
 * const NameField: FieldComponent<"name", ZodString, { label: string }> = field("name")
 *   .schema(z.string())
 *   .render(({ register }, props) => (
 *     <Input label={props.label} {...register()} />
 *   ));
 *
 * // Uso:
 * <NameField label="Nome" />
 * ```
 */
export type FieldComponent<
	Key extends string,
	Schema extends ZodType,
	Props extends ComponentProps<any> = ComponentProps<any>,
> = FC<Props> & {
	/**
	 * Configuração do campo contendo metadados.
	 * Inclui chave, schema estático e dependências.
	 */
	config: FieldConfig<Key>;
	/**
	 * Obtém o schema Zod do campo.
	 * Se o schema for dinâmico (função), será gerado baseado nos valores do formulário.
	 *
	 * @param formValues - Valores atuais do formulário (opcional, usado para schemas dinâmicos)
	 * @returns Schema Zod do campo
	 */
	getZodSchema: (formValues?: Record<string, any>) => Schema;
	/**
	 * Estende o campo atual criando um novo campo com configurações modificadas.
	 * Útil para criar variações de um campo existente.
	 *
	 * @template NewKey - Nova chave do campo (opcional)
	 * @template NewSchema - Novo schema Zod (opcional)
	 * @template NewProps - Novas props do componente (opcional, apenas quando render é especificado)
	 *
	 * @param overrides - Configurações para sobrescrever
	 * @returns Novo FieldComponent com as configurações mescladas
	 *
	 * @example
	 * ```tsx
	 * const EmailFieldRequired = EmailField.extend({
	 *   schema: z.string().email().min(1, "Email obrigatório")
	 * });
	 *
	 * // Sobrescrevendo props padrão:
	 * const CustomPasswordField = PasswordField.extend({
	 *   props: {
	 *     label: { text: "Senha Atual", required: true }
	 *   }
	 * });
	 * ```
	 */
	extend: <
		NewKey extends string = Key,
		NewSchema extends ZodType = Schema,
		NewProps extends ComponentProps<any> = Props,
	>(overrides: {
		key?: NewKey;
		schema?: NewSchema;
		render?: (context: any, props: NewProps) => React.ReactNode;
		/**
		 * Props padrão para sobrescrever ou estender as props padrão existentes.
		 * As props passadas ao componente ainda terão prioridade sobre essas props padrão.
		 * Quando apenas props é especificado (sem render), o tipo Props original é preservado.
		 */
		props?: Partial<Props>;
	}) => FieldComponent<NewKey, NewSchema, NewProps>;
};

/**
 * Tipo base mínimo para qualquer componente de campo.
 *
 * Este é o tipo mínimo que todos os FieldComponents devem implementar.
 * É usado como constraint para permitir arrays heterogêneos de campos diferentes,
 * garantindo que todos tenham pelo menos uma key e um método para obter o schema.
 *
 * @example
 * ```ts
 * const fields: FieldComponentBase[] = [
 *   field("name").schema(z.string()).render(...),
 *   field("age").schema(z.number()).render(...)
 * ];
 * ```
 */
export type FieldComponentBase = {
	/** Configuração mínima do campo contendo pelo menos a chave */
	config: { key: string };
	/**
	 * Método para obter o schema Zod do campo.
	 * Pode ser estático ou dinâmico baseado em valores do formulário.
	 */
	getZodSchema: (formValues?: Record<string, any>) => ZodType;
};
