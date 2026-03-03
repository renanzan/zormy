# Zormy — AI Spec

> Especificação para assistentes de IA: como usar o pacote **zormy** em projetos React.

## O que é

**Zormy** é uma biblioteca para formulários tipados e reutilizáveis em React. Combina:

- **React Hook Form** — controle de formulário
- **Zod** — validação e schemas
- **TypeScript** — inferência de tipos end-to-end

O Zormy propõe uma **nova forma de lidar com formulários**, inspirada no atomic design mas aplicada a formulários: **átomos** (campos primitivos ou abstratos), **moléculas** (grupos de campos, ex.: endereço), **organismos** (formulários/seções) e **templates** (wizards). Organizar o projeto com pastas contextuais (`fields/base/`, `fields/user/`, `forms/`, `wizards/`) e usar **abstractField** para reutilizar definições em campos complexos aproveita ao máximo a lib. Ver documentação: "Design de formulários" e "Dicas — Estrutura de projeto".

Conceitos principais:

- **Campos reutilizáveis**: criados com `field("key")` ou `abstractField()`, com `.schema()` e `.render()`.
- **Resolver**: `zormyResolver({ fields: [...] })` monta o schema Zod a partir dos campos e integra com react-hook-form.
- **Form**: componente `<Form methods={...}>` que fornece contexto (FormProvider).
- **Wizards**: fluxos multi-step com `createWizardConfig`, `createWizardComponents` e `useWizard`.

---

## Instalação e dependências

```bash
pnpm add zormy zod react-hook-form @hookform/resolvers
```

Peer dependencies: `react` (^18), `react-hook-form` (^7.71.1), `zod` (^3.25.28), `@hookform/resolvers` (^5.2.2).

---

## API principal (import de `zormy`)

| Exportação                                                  | Uso                                                                                       |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `field(key)`                                                | Builder para campo com chave fixa (ex: `"name"`, `"user.email"`)                          |
| `abstractField()`                                           | Builder para campo sem chave; usar `.extend({ key: "..." })` para obter um campo concreto |
| `zormyResolver({ fields })`                                 | Resolver para `useForm`; recebe array de campos e infere tipo do formulário               |
| `useZormy({ fields, ...useFormOptions })`                   | Hook que injeta `zormyResolver` e infere tipo a partir do array de campos (sem passar `resolver`) |
| `Form`                                                      | `<Form methods={form}>` ou `<Form fields={[...]} defaultValues? mode? />` — fornece contexto; com `fields` usa useZormy internamente |
| `useForm`                                                   | Re-export do react-hook-form (para tipagem consistente)                                   |
| `createWizardConfig({ steps: [{ name, fields }, ...], shouldIncludeStep? })` | Configuração do wizard (array de steps com nome e campos)                          |
| `createWizardComponents(config)`                             | Retorna `{ Wizard, Step }` tipados                                                       |
| `useWizard({ steps: [{ name, fields }, ...], defaultValues, onComplete?, ... })` | Hook do wizard (form + navegação entre steps)                                    |
| `useWizardContext`                                          | Acesso ao contexto do wizard                                                              |
| `useAutoSaveContext`, `AutoSaveStatus`                      | Auto-save no wizard                                                                       |
| `Controller`, `SubmitHandler`                               | Re-export do react-hook-form                                                              |

Tipos úteis: `FieldKey`, `FieldsToObject`, `FieldValue`.

---

## Padrão: formulário simples

1. Definir campos com `field("key").schema(zodSchema).render(...)`.
2. Criar o form: use `<Form fields={[...]} defaultValues? mode? onSubmit? />` (Form usa useZormy internamente) ou `useZormy({ fields, defaultValues })` + `<Form methods={form}>`.
3. Envolver a UI no Form e renderizar os campos como componentes.

```tsx
import { z } from "zod";
import { field, Form, useForm, zormyResolver } from "zormy";

const NameField = field("name")
	.schema(z.string().min(3, "Mín. 3 caracteres"))
	.render(({ register, fieldState }) => (
		<div>
			<input {...register()} />
			{fieldState.error && <span>{fieldState.error.message}</span>}
		</div>
	));

function MyForm() {
	const form = useForm({
		resolver: zormyResolver({ fields: [NameField] }),
		defaultValues: { name: "" },
	});
	return (
		<Form methods={form} onSubmit={form.handleSubmit((data) => console.log(data))}>
			<NameField />
			<button type="submit">Enviar</button>
		</Form>
	);
}
```

- **Importante**: o `resolver` deve usar exatamente os campos que serão renderizados; `defaultValues` deve cobrir todas as chaves dos campos (incluindo aninhadas, se houver).
- No `render`, use `register()` sem argumentos para usar a chave do campo; para sobrescrever: `register({ name: "outra.chave" })`.

---

## Campos aninhados (dot-notation)

Chaves com ponto são suportadas: o resolver monta um schema aninhado e os valores são acessados como `address.street`, etc.

```tsx
const StreetField = field("address.street")
	.schema(z.string().min(1))
	.render(({ register }) => <input {...register()} />);
// defaultValues: { address: { street: "" } }
```

---

## Campos com dependências (dinâmicos)

Use `.dependsOn(OutroCampo, ...)` ou `.dependsOn("chave")` (string) e depois `.schema()` com função que recebe `formValues` para schema condicional. Com string, `formValues` tem tipo `any` para essa chave; com Field, a tipagem é inferida.

```tsx
const PhoneField = field("phone")
	.dependsOn(NameField)
	.schema((formValues) => {
		const name = formValues?.name;
		return name?.length ? z.string().min(10, "Telefone obrigatório") : z.string().optional();
	})
	.render(({ register, fieldState, getValues }) => {
		const name = getValues("name");
		const required = Boolean(name?.length);
		return <input {...register()} required={required} />;
	});
```

O array passado para `zormyResolver({ fields })` deve incluir todos os campos usados (incluindo os de `dependsOn`).

---

## Campo abstrato (template)

Use quando vários campos compartilham schema e UI, mudando só a chave.

```tsx
const BaseText = abstractField()
	.schema(z.string().min(3))
	.render(({ register, fieldState }) => (
		<div>
			<input {...register()} />
			{fieldState.error && <span>{fieldState.error.message}</span>}
		</div>
	));

const NameField = BaseText.extend({ key: "name" });
const EmailField = BaseText.extend({ key: "email" });
```

---

## Wizard multi-step

1. Definir steps como array de `{ name, fields }`: cada item tem o nome do step e o array de campos.
2. `createWizardConfig({ steps: [{ name: "personal", fields: [NameField] }, { name: "contact", fields: [EmailField] }], shouldIncludeStep? })`.
3. `createWizardComponents(config)` → `{ Wizard, Step }`.
4. `useWizard({ steps: [...], defaultValues, onComplete?, onStepSubmit?, initialStep?, mode?, autoSave?, ... })`.
5. Renderizar: `<Wizard methods={wizard}>` e dentro `<Step step="personal">` etc.; usar `wizard.next`, `wizard.back` para navegação. Não passar `onComplete` no `<Wizard>` — o submit do form chama `wizard.next()` e o `onComplete` de `useWizard` recebe **todos os dados acumulados**.

Callbacks:
- **`onComplete(data)`** — chamado só ao finalizar o wizard (último step); `data` = todos os dados de todos os steps (acumulados internamente, pois só o step atual está montado).
- **`onStepSubmit(stepData, step, allDataSoFar)`** — chamado ao avançar de step (Próximo ou Finalizar); `stepData` = dados do step atual; `allDataSoFar` = dados acumulados até o momento.

```tsx
const stepsConfig = [
	{ name: "personal", fields: [NameField] },
	{ name: "contact", fields: [EmailField] },
];
const config = createWizardConfig({ steps: stepsConfig });
const { Wizard, Step } = createWizardComponents(config);

function MyWizard() {
	const wizard = useWizard({
		steps: stepsConfig,
		defaultValues: { name: "", email: "" },
		onStepSubmit: (stepData, step, allDataSoFar) => { /* opcional */ },
		onComplete: (data) => console.log(data),
	});
	return (
		<Wizard methods={wizard}>
			<Step step="personal">
				<NameField />
				<button type="button" onClick={wizard.next}>Próximo</button>
			</Step>
			<Step step="contact">
				<EmailField />
				<button type="button" onClick={wizard.back}>Voltar</button>
				<button type="submit">Finalizar</button>
			</Step>
		</Wizard>
	);
}
```

- `defaultValues` deve cobrir todas as chaves de todos os campos de todos os steps.
- Steps condicionais: use `shouldIncludeStep: (step, formValues) => boolean` em `createWizardConfig`.

---

## Form sem elemento `<form>`

Use `<Form methods={form} contextOnly>` e um único filho que receberá **apenas o contexto** (FormProvider). Props HTML passadas ao `Form` **não** são repassadas automaticamente ao filho (ex.: componente customizado ou Radix Slot).

---

## Estrutura de projeto sugerida

- **fields/base/** — Campos abstratos (`abstractField()`) reutilizáveis (ex.: BaseTextField, BaseSelectField).
- **fields/{domínio}/** — Campos concretos por domínio (user, address, etc.); moléculas como endereço exportam vários campos + opcionalmente um componente de seção.
- **forms/** — Formulários completos: array de campos + Form/useZormy.
- **wizards/{fluxo}/** — Por fluxo: `config.ts` com `createWizardConfig` (fora do componente) + componente do wizard com useWizard.
- Em apps por feature: `shared/fields/` para campos compartilhados; dentro de cada feature, `fields/` + forms/wizards locais.

---

## O que evitar

- Não passar para `zormyResolver` campos que não serão renderizados no formulário (ou o tipo e o schema podem ficar inconsistentes).
- Não misturar chaves flat e aninhadas de forma inconsistente em `defaultValues` (ex.: campo `"user.email"` exige `defaultValues.user.email`).
- Em wizards, não esquecer de incluir todos os campos de todos os steps em `defaultValues`.
- Para campos com `dependsOn`, sempre incluir os campos dependentes no array `fields` do resolver (e no wizard, no step correto).

---

## Estrutura de testes (manutenção)

Em `packages/zormy/__tests__/`:

- **`unit/`** — testes unitários por módulo: `unit/fields/`, `unit/wizard/`, `unit/utils/`, `unit/resolvers/`.
- **`types/`** — testes de tipo (`.test-d.ts`): `types/fields/`, `types/wizard/`.
- **`performance/`** — benchmarks e testes de re-render (mantido como está).
- **`integration/`** — reservado para testes end-to-end futuros (vários módulos).

Comandos: `pnpm test`, `pnpm test:typecheck`, `pnpm test:bench`.

---

## Resumo para geração de código

1. **Formulário simples**: `field("key").schema(z...).render(({ register, fieldState }) => ...)` → `zormyResolver({ fields: [...] })` → `useForm` → `<Form methods={form}>` + campos.
2. **Aninhado**: chave `"a.b.c"` e `defaultValues: { a: { b: { c: "" } } }`.
3. **Condicional**: `.dependsOn(OutroCampo).schema((formValues) => z...)` e incluir dependentes em `fields`.
4. **Template**: `abstractField().schema(...).render(...)` e `.extend({ key: "..." })`.
5. **Wizard**: `createWizardConfig` → `createWizardComponents` → `useWizard` → `<Wizard>` + `<Step step="...">` e botões com `nextStep`/`prevStep`.

Versão do pacote: ver `package.json`. Requer React 18+, TypeScript 5+ recomendado.
