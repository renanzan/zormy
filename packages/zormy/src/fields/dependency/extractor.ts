import type { FieldComponent } from "../field/types/field";
import type { Dependency } from "./types/dependency";

/**
 * Extrai a chave de uma dependência individual.
 * Suporta FieldComponent, string ou função lazy que retorna FieldComponent.
 *
 * @param dependency - Dependência (FieldComponent, string ou função lazy)
 * @returns Chave da dependência ou null se não for possível extrair
 *
 * @example
 * ```ts
 * extractDependencyKey(FieldComponent) // "fieldKey"
 * extractDependencyKey("fieldKey") // "fieldKey"
 * extractDependencyKey(() => FieldComponent) // "fieldKey" ou null se lazy
 * ```
 */
function extractDependencyKey(dependency: Dependency): string | null {
	if (typeof dependency === "string") {
		return dependency;
	}

	// FieldComponent é uma função (componente React) que também tem propriedade 'config'
	// Verifica se é uma função e se tem a propriedade 'config' antes de acessar
	if (typeof dependency === "function" && "config" in dependency) {
		// FieldComponent direto (função com propriedade config)
		try {
			const config = (dependency as FieldComponent<any, any, any>).config;
			if (config?.key) {
				return config.key;
			}
		} catch {
			// Se config não estiver disponível (dependência circular), retorna null
			return null;
		}
	}

	// Verifica se é um objeto (não função) com propriedade 'config'
	if (dependency && typeof dependency === "object" && "config" in dependency) {
		try {
			const config = (dependency as FieldComponent<any, any, any>).config;
			if (config?.key) {
				return config.key;
			}
		} catch {
			// Se config não estiver disponível (dependência circular), retorna null
			return null;
		}
	}

	// Lazy getter: função que retorna FieldComponent
	if (typeof dependency === "function" && !("config" in dependency)) {
		try {
			const fieldComponent = dependency();
			if (fieldComponent && typeof fieldComponent === "function" && "config" in fieldComponent) {
				const config = (fieldComponent as FieldComponent<any, any, any>).config;
				if (config?.key) {
					return config.key;
				}
			}
		} catch {
			// Se falhar (dependência circular), retorna null
			return null;
		}
	}

	return null;
}

/**
 * Extrai todas as chaves de um array de dependências.
 * Retorna apenas as chaves que foram possíveis de extrair.
 *
 * @param dependencies - Array de dependências
 * @returns Array de chaves extraídas
 *
 * @example
 * ```ts
 * extractDependencyKeys([FieldComponent, "fieldKey", () => LazyField])
 * // ["fieldKey1", "fieldKey", "lazyFieldKey"] ou menos se houver dependências circulares
 * ```
 */
export function extractDependencyKeys(dependencies: readonly Dependency[]): string[] {
	const keys: string[] = [];

	for (const dep of dependencies) {
		const key = extractDependencyKey(dep);
		if (key) {
			keys.push(key);
		}
	}

	return keys;
}
