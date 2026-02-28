/**
 * Pacote Zormy - Sistema de formulários tipados e reutilizáveis para React.
 *
 * Oferece API declarativa para criar formulários com validação Zod,
 * suporte a campos aninhados (dot-notation), wizards multi-step e tipagem forte.
 *
 * Principais exportações:
 * - {@link field} e {@link abstractField}: builders para campos reutilizáveis
 * - {@link formyResolver}: resolver para react-hook-form baseado em campos
 * - {@link Form}: componente de formulário com contexto
 * - {@link useWizard}, {@link createWizardConfig}, {@link createWizardComponents}: wizards multi-step
 *
 * @packageDocumentation
 */

export { abstractField, field, useField } from "./fields";
export { formyResolver } from "./resolver/resolver";

export type { FieldKey, FieldsToObject, FieldValue } from "./fields/field/types/extractors";

export { Form } from "./components/Form";

export { createWizardComponents } from "./wizards/wizard/builder/components";
export { createWizardConfig } from "./wizards/wizard/builder/config";
export { useWizardContext } from "./wizards/wizard/context";
export { useWizard } from "./wizards/wizard/hooks/use-wizard";

export { useAutoSaveContext } from "./wizards/wizard/context";
export type { AutoSaveStatus } from "./wizards/wizard/hooks/use-auto-save";

export * from "./integrations/react-hook-form";
