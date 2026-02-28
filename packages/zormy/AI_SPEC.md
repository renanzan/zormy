# Zormy — AI Spec

> Especificação para assistentes de IA: como usar o pacote **zormy** em projetos React.

## O que é

**Zormy** é uma biblioteca para formulários tipados e reutilizáveis em React. Combina:

- **React Hook Form** — controle de formulário
- **Zod** — validação e schemas
- **TypeScript** — inferência de tipos end-to-end

Conceitos principais:

- **Campos reutilizáveis**: criados com `field("key")` ou `abstractField()`, com `.schema()` e `.render()`.
- **Resolver**: `formyResolver({ fields: [...] })` monta o schema Zod a partir dos campos e integra com react-hook-form.
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

| Exportação | Uso |
|------------|-----|
| `field(key)` | Builder para campo com chave fixa (ex: `"name"`, `"user.email"`) |
| `abstractField()` | Builder para campo sem chave; usar `.extend({ key: "..." })` para obter um campo concreto |
| `formyResolver({ fields })` | Resolver para `useForm`; recebe array de campos e infere tipo do formulário |
| `Form` | `<Form methods={form}>` — fornece contexto do formulário (e opcionalmente `<form>`) |
| `useForm` | Re-export do react-hook-form (para tipagem consistente) |
| `createWizardConfig({ steps, fields, shouldIncludeStep? })` | Configuração do wizard (steps e campos por step) |
| `createWizardComponents(config)` | Retorna `{ Wizard, Step }` tipados |
| `useWizard(config & { defaultValues, onSubmit?, ... })` | Hook do wizard (form + navegação entre steps) |
| `useWizardContext` | Acesso ao contexto do wizard |
| `useAutoSaveContext`, `AutoSaveStatus` | Auto-save no wizard |
| `Controller`, `SubmitHandler` | Re-export do react-hook-form |

Tipos úteis: `FieldKey`, `FieldsToObject`, `FieldValue`.

---

## Padrão: formulário simples

1. Definir campos com `field("key").schema(zodSchema).render(...)`.
2. Criar o form com `useForm({ resolver: formyResolver({ fields: [...] }), defaultValues })`.
3. Envolver a UI em `<Form methods={form}>` e renderizar os campos como componentes.

```tsx
import { z } from "zod";
import { field, Form, formyResolver, useForm } from "zormy";

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
    resolver: formyResolver({ fields: [NameField] }),
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

Use `.dependsOn(OutroCampo, ...)` e depois `.schema()` com função que recebe `formValues` para schema condicional.

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

O array passado para `formyResolver({ fields })` deve incluir todos os campos usados (incluindo os de `dependsOn`).

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

1. Definir `steps` (array de strings literais, ex: `["personal", "contact"] as const`).
2. Mapear cada step para um array de campos em `fields`: `{ personal: [NameField], contact: [EmailField] }`.
3. `createWizardConfig({ steps, fields, shouldIncludeStep? })`.
4. `createWizardComponents(config)` → `{ Wizard, Step }`.
5. `useWizard({ ...config, defaultValues, onSubmit?, initialStep?, mode?, autoSave?, ... })`.
6. Renderizar: `<Wizard wizard={wizard}>` e dentro `<Step step="personal">` etc.; usar `wizard.nextStep`, `wizard.prevStep` para navegação.

```tsx
const config = createWizardConfig({
  steps: ["personal", "contact"] as const,
  fields: { personal: [NameField], contact: [EmailField] },
});
const { Wizard, Step } = createWizardComponents(config);

function MyWizard() {
  const wizard = useWizard({
    ...config,
    defaultValues: { name: "", email: "" },
    onSubmit: (data) => console.log(data),
  });
  return (
    <Wizard wizard={wizard}>
      <Step step="personal">
        <NameField />
        <button type="button" onClick={wizard.nextStep}>Próximo</button>
      </Step>
      <Step step="contact">
        <EmailField />
        <button type="button" onClick={wizard.prevStep}>Voltar</button>
        <button type="submit">Enviar</button>
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

## O que evitar

- Não passar para `formyResolver` campos que não serão renderizados no formulário (ou o tipo e o schema podem ficar inconsistentes).
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

1. **Formulário simples**: `field("key").schema(z...).render(({ register, fieldState }) => ...)` → `formyResolver({ fields: [...] })` → `useForm` → `<Form methods={form}>` + campos.
2. **Aninhado**: chave `"a.b.c"` e `defaultValues: { a: { b: { c: "" } } }`.
3. **Condicional**: `.dependsOn(OutroCampo).schema((formValues) => z...)` e incluir dependentes em `fields`.
4. **Template**: `abstractField().schema(...).render(...)` e `.extend({ key: "..." })`.
5. **Wizard**: `createWizardConfig` → `createWizardComponents` → `useWizard` → `<Wizard>` + `<Step step="...">` e botões com `nextStep`/`prevStep`.

Versão do pacote: ver `package.json`. Requer React 18+, TypeScript 5+ recomendado.
