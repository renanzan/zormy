"use client";

import { createContext, useContext } from "react";

import type { FieldValues } from "react-hook-form";
import type { UseAutoSaveReturn } from "./hooks/use-auto-save";
import type { ExtractWizardFormData } from "./types/extractors";
import type { UseWizardFormReturn } from "./types/hooks";
import type { WizardConfig } from "./types/wizard";

/**
 * Tipo base para o contexto do wizard.
 * Aceita qualquer instância de UseWizardFormReturn com autoSave opcional.
 */
type WizardContextValue = UseWizardFormReturn<FieldValues, readonly string[]> & {
	autoSave?: UseAutoSaveReturn;
};

const WizardContext = createContext<WizardContextValue | null>(null);

/**
 * Props do WizardProvider.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 * @template Steps - Array de strings literais representando os steps
 */
type WizardProviderProps<TFieldValues extends FieldValues, Steps extends readonly string[]> = {
	/** Componentes filhos que terão acesso ao contexto */
	children: React.ReactNode;
	/** Valor do contexto do wizard (pode incluir autoSave se configurado) */
	value: UseWizardFormReturn<TFieldValues, Steps> & {
		autoSave?: UseAutoSaveReturn;
	};
};

/**
 * Provider que fornece o contexto do wizard para componentes filhos.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 * @template Steps - Array de strings literais representando os steps
 *
 * @param props - Props do provider
 * @returns Provider do contexto
 *
 * @example
 * ```tsx
 * const wizard = useWizard({ ... });
 *
 * <WizardProvider value={wizard}>
 *   <WizardStep />
 * </WizardProvider>
 * ```
 */
export function WizardProvider<TFieldValues extends FieldValues, Steps extends readonly string[]>({
	children,
	value,
}: WizardProviderProps<TFieldValues, Steps>) {
	return (
		<WizardContext.Provider value={value as unknown as WizardContextValue}>
			{children}
		</WizardContext.Provider>
	);
}

/**
 * Hook para acessar o contexto do wizard.
 *
 * Deve ser usado dentro de um WizardProvider.
 *
 * @template TConfig - Configuração opcional do wizard (WizardConfig) para tipagem forte
 *
 * @returns Contexto do wizard
 *
 * @throws {Error} Se não estiver dentro de um WizardProvider
 *
 * @example
 * ```tsx
 * const wizard = useWizardContext<typeof wizardConfig>();
 * wizard.next();
 * wizard.back();
 * ```
 */
export function useWizardContext<
	TConfig extends WizardConfig<any> | undefined = undefined,
>(): TConfig extends WizardConfig<any>
	? UseWizardFormReturn<ExtractWizardFormData<TConfig>, TConfig["steps"]> & {
			autoSave?: UseAutoSaveReturn;
		}
	: WizardContextValue {
	const context = useContext(WizardContext);

	if (!context) {
		throw new Error("useWizardContext deve ser usado dentro de um WizardProvider");
	}

	return context as any;
}

/**
 * Hook para acessar o autoSave do contexto do wizard.
 *
 * Deve ser usado dentro de um WizardProvider que tenha autoSave configurado.
 *
 * @returns AutoSave do wizard
 *
 * @throws {Error} Se não estiver dentro de um WizardProvider ou se autoSave não estiver configurado
 *
 * @example
 * ```tsx
 * const autoSave = useAutoSaveContext();
 * // Usa autoSave.status, autoSave.lastSaved, etc
 * ```
 */
export function useAutoSaveContext(): UseAutoSaveReturn {
	const context = useWizardContext();

	if (!context.autoSave) {
		throw new Error("useAutoSaveContext requer que o wizard tenha autoSave configurado");
	}

	return context.autoSave;
}
