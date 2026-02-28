import { useCallback, useEffect, useRef, useState } from "react";

import type { UseWizardFormReturn } from "../types/hooks";

/**
 * Compara dois valores usando deep equality.
 * Trata objetos, arrays e valores primitivos.
 */
function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a == null || b == null) return a === b;
	if (typeof a !== typeof b) return false;

	if (typeof a === "object") {
		if (Array.isArray(a) !== Array.isArray(b)) return false;

		if (Array.isArray(a) && Array.isArray(b)) {
			if (a.length !== b.length) return false;
			return a.every((item, index) => deepEqual(item, b[index]));
		}

		const keysA = Object.keys(a as object);
		const keysB = Object.keys(b as object);

		if (keysA.length !== keysB.length) return false;

		return keysA.every((key) =>
			deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
		);
	}

	return false;
}

/**
 * Verifica se há mudanças reais comparando valores atuais com valores de referência.
 */
function hasRealChanges(
	currentValues: Record<string, unknown>,
	referenceValues: Record<string, unknown> | undefined
): boolean {
	if (!referenceValues) {
		return Object.keys(currentValues).length > 0;
	}
	for (const key in currentValues) {
		if (!deepEqual(currentValues[key], referenceValues[key])) return true;
	}
	for (const key in referenceValues) {
		if (!(key in currentValues) && referenceValues[key] !== undefined) return true;
	}
	return false;
}

/**
 * Calcula hasChanges e próximo status com base em valores atuais vs referência.
 */
function computeChangeState(
	currentValues: Record<string, unknown>,
	referenceValues: Record<string, unknown> | undefined,
	isSaving: boolean,
	currentStatus: AutoSaveStatus,
	hasSavedValuesBefore: boolean
): { hasChanges: boolean; nextStatus: AutoSaveStatus } {
	const hasChangesValue = hasRealChanges(currentValues, referenceValues);
	let nextStatus = currentStatus;
	if (hasChangesValue && !isSaving && currentStatus === "saved") nextStatus = "idle";
	else if (
		!hasChangesValue &&
		!isSaving &&
		hasSavedValuesBefore &&
		currentStatus === "idle"
	)
		nextStatus = "saved";
	return { hasChanges: hasChangesValue, nextStatus };
}

/**
 * Estados possíveis do indicador de salvamento automático
 */
export type AutoSaveStatus =
	| "idle" // Aguardando alterações
	| "saving" // Salvando dados
	| "saved" // Dados salvos com sucesso
	| "error"; // Erro ao salvar

/**
 * Hook para monitorar o estado de salvamento automático baseado no wizard e chamadas da API.
 *
 * Este hook monitora:
 * - Mudanças no formulário (dirtyFields)
 * - Estado de salvamento (idle, saving, saved, error)
 * - Última vez que foi salvo com sucesso
 *
 * O hook expõe métodos para atualizar o status quando chamadas de API são feitas.
 *
 * @internal Para uso interno do formy.
 * @param wizard - Instância do wizard que contém o estado do formulário
 * @returns Objeto com status, lastSaved, hasChanges e métodos para controlar o salvamento
 */
export const useAutoSave = <
	TFieldValues extends Record<string, unknown>,
	Steps extends readonly string[],
>(
	wizard: UseWizardFormReturn<TFieldValues, Steps>
) => {
	const [status, setStatus] = useState<AutoSaveStatus>("idle");
	const [lastSaved, setLastSaved] = useState<Date | undefined>();
	const [hasChanges, setHasChanges] = useState(false);
	const isSavingRef = useRef(false);
	const savedValuesRef = useRef<Record<string, unknown> | null>(null);
	const statusRef = useRef(status);
	statusRef.current = status;

	// Única fonte de verdade: watch() + comparação com referência (saved ou defaultValues).
	// Detecta mudanças reais e alterna status entre idle e saved conforme o usuário edita ou desfaz.
	useEffect(() => {
		const syncState = () => {
			const currentValues = wizard.getValues();
			const referenceValues = savedValuesRef.current ?? wizard.formState.defaultValues;
			const currentStatus = statusRef.current;
			const { hasChanges: nextHasChanges, nextStatus } = computeChangeState(
				currentValues,
				referenceValues,
				isSavingRef.current,
				currentStatus,
				savedValuesRef.current != null
			);
			setHasChanges(nextHasChanges);
			if (nextStatus !== currentStatus) setStatus(nextStatus);
		};

		syncState();
		const subscription = wizard.watch(syncState);
		return () => subscription.unsubscribe();
	}, [wizard]);

	/**
	 * Marca o início de uma operação de salvamento.
	 * Deve ser chamado antes de iniciar uma chamada de API.
	 */
	const startSaving = useCallback(() => {
		if (isSavingRef.current) return;
		isSavingRef.current = true;
		setStatus("saving");
	}, []);

	/**
	 * Marca o sucesso de uma operação de salvamento.
	 * Deve ser chamado após uma chamada de API bem-sucedida.
	 */
	const markSaved = useCallback(() => {
		isSavingRef.current = false;
		const currentValues = wizard.getValues();
		try {
			savedValuesRef.current = structuredClone(currentValues);
		} catch {
			savedValuesRef.current = JSON.parse(JSON.stringify(currentValues));
		}
		setStatus("saved");
		setLastSaved(new Date());
		setHasChanges(false);
	}, [wizard]);

	/**
	 * Marca um erro em uma operação de salvamento.
	 * Deve ser chamado após uma chamada de API com erro.
	 */
	const markError = useCallback(() => {
		isSavingRef.current = false;
		setStatus("error");
		// Após 3 segundos, volta para idle para tentar novamente
		setTimeout(() => {
			setStatus("idle");
		}, 3000);
	}, []);

	/**
	 * Wrapper para executar uma operação de salvamento com controle automático de status.
	 * Gerencia o ciclo de vida do salvamento (saving -> saved/error).
	 * Relança o erro após marcá-lo como error para permitir que o chamador trate o erro se necessário.
	 *
	 * @param saveFn - Função assíncrona que executa o salvamento
	 * @throws O erro original se a operação de salvamento falhar
	 */
	const executeSave = useCallback(
		async (saveFn: () => Promise<void>) => {
			if (isSavingRef.current) return;

			startSaving();
			try {
				await saveFn();
				markSaved();
			} catch (error) {
				console.error("Erro ao salvar:", error);
				markError();
				// Relança o erro para permitir que o chamador trate o erro se necessário
				// O status de erro já foi atualizado internamente
				throw error;
			}
		},
		[startSaving, markSaved, markError]
	);

	return {
		status,
		lastSaved,
		hasChanges,
		startSaving,
		markSaved,
		markError,
		executeSave,
	};
};

export type UseAutoSaveReturn = ReturnType<typeof useAutoSave>;
