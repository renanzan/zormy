# Zormy

Sistema de formulários tipados e reutilizáveis para React, com validação Zod, campos aninhados e wizards multi-step.

## Instalação

```bash
pnpm add zormy zod react-hook-form @hookform/resolvers
```

Ou com npm/yarn:

```bash
npm install zormy zod react-hook-form @hookform/resolvers
```

## Uso rápido

### Formulário simples

```tsx
import { field, Form, formyResolver, useForm } from "zormy";
import { z } from "zod";

const NameField = field("name")
  .schema(z.string().min(3, "Mínimo 3 caracteres"))
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
    mode: "onChange", // ou "onBlur" | "onSubmit" | "onTouched" | "all"
  });

  return (
    <Form methods={form} onSubmit={form.handleSubmit((data) => console.log(data))}>
      <NameField />
      <button type="submit">Enviar</button>
    </Form>
  );
}
```

### Wizard multi-step

```tsx
import { createWizardConfig, createWizardComponents, useWizard, field } from "zormy";
import { z } from "zod";

const NameField = field("name").schema(z.string().min(3)).render(({ register, fieldState }) => (
  <div>
    <input {...register()} />
    {fieldState.error && <span>{fieldState.error.message}</span>}
  </div>
));

const EmailField = field("email").schema(z.string().email()).render(({ register, fieldState }) => (
  <div>
    <input type="email" {...register()} />
    {fieldState.error && <span>{fieldState.error.message}</span>}
  </div>
));

const config = createWizardConfig({
  steps: ["personal", "contact"] as const,
  fields: {
    personal: [NameField],
    contact: [EmailField],
  },
});

const { Wizard, Step } = createWizardComponents(config);

function MyWizard() {
  const wizard = useWizard({
    ...config,
    defaultValues: { name: "", email: "" },
    mode: "onChange", // opcional: modo de validação do wizard
    onSubmit: (data) => console.log(data),
  });

  return (
    <Wizard methods={wizard} onSubmit={wizard.handleSubmit()}>
      <Step step="personal"><NameField /></Step>
      <Step step="contact"><EmailField /></Step>
      <div>
        {!wizard.isFirstStep && <button type="button" onClick={wizard.back}>Voltar</button>}
        {wizard.isLastStep ? (
          <button type="submit">Finalizar</button>
        ) : (
          <button type="button" onClick={() => void wizard.next()}>Próximo</button>
        )}
      </div>
    </Wizard>
  );
}
```

## Recursos

- **TypeScript**: inferência de tipos a partir dos campos e do Zod
- **Validação**: schemas Zod estáticos ou dinâmicos (por valores do formulário)
- **Campos reutilizáveis**: `field("key")` e `abstractField()` com `.extend()`
- **Wizards**: steps, validação por etapa, steps condicionais, auto-save opcional
- **Resolver**: `formyResolver({ fields })` com suporte a chaves aninhadas (`"user.email"`)

## Documentação

Para guias completos, exemplos e API reference, consulte a [documentação do projeto](https://github.com/your-org/zormy) (ou o site de docs quando disponível).

## Peer dependencies

- `react` (catalog)
- `react-hook-form` ^7.71.1
- `zod` ^3.25.28
- `@hookform/resolvers` ^5.2.2

## Licença

Private / conforme o projeto.
