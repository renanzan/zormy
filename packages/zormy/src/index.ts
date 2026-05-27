/**
 * Pacote Zormy - Sistema de formulários tipados e reutilizáveis para React.
 *
 * Oferece API declarativa para criar formulários com validação Zod,
 * suporte a campos aninhados (dot-notation), wizards multi-step e tipagem forte.
 *
 * Principais exportações:
 * - {@link field} e {@link abstractField}: builders para campos reutilizáveis
 * - {@link zormyResolver}: resolver para react-hook-form baseado em campos
 * - {@link Form}: componente de formulário com contexto
 * - {@link useZormy}: hook que integra campos ao useForm com zormyResolver
 * - {@link useWizard}, {@link createWizardConfig}, {@link createWizardComponents}: wizards multi-step
 *
 * @packageDocumentation
 */

export { abstractField, field, useField } from "./fields";
export { zormyResolver } from "./resolver/resolver";

export type { FieldKey, FieldsToObject, FieldValue } from "./fields/field/types/extractors";

export { Form } from "./components/Form";
export type { FormMethodsProps, FormProps } from "./components/Form";
export { useZormy } from "./form/hooks/useZormy";
export type { ZormyFormMethods } from "./form/types/form-methods";
export { createForm } from "./form/utils/create-form";

export { createWizardComponents } from "./wizards/wizard/builder/components";
export type {
	WizardNavBackProps,
	WizardNavNextProps,
	WizardNavProps,
} from "./components/WizardNav";
export { createWizardConfig } from "./wizards/wizard/builder/config";
export type { NonEmptyStepsConfig, StepDefinition } from "./wizards/wizard/types/wizard";
export { useWizardContext } from "./wizards/wizard/context";
export { useWizard } from "./wizards/wizard/hooks/use-wizard";
export { createWizard } from "./wizards/wizard/utils/create-wizard";

export { useAutoSaveContext } from "./wizards/wizard/context";
export type { AutoSaveStatus } from "./wizards/wizard/hooks/use-auto-save";

export * from "./integrations/react-hook-form";
