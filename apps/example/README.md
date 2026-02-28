# Zormy - Aplicação de Exemplo

Esta é a aplicação de desenvolvimento e teste da biblioteca Zormy. Ela serve como ambiente para testar a biblioteca em um cenário real antes de publicar.

## Tecnologias

- **Vite** - Build tool e dev server
- **React** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Zormy** - Biblioteca de formulários (importada via workspace)

## Funcionalidades

### Formulário de Checkout Completo

O exemplo implementa um formulário de checkout com múltiplos steps:

1. **Informações Pessoais**
   - Nome completo (validação mínima de 3 caracteres)
   - E-mail (validação de formato)
   - Telefone (obrigatório apenas se nome foi preenchido - validação condicional)

2. **Endereço**
   - CEP (validação de formato)
   - Rua
   - Número
   - Complemento (opcional)
   - Cidade
   - Estado (select com estados brasileiros)

3. **Pagamento**
   - Método de pagamento (Cartão de Crédito, Débito, PIX, Boleto)
   - Campos de cartão (apenas se método for crédito ou débito):
     - Número do cartão
     - Nome no cartão
     - Validade
     - CVV

4. **Confirmação**
   - Aceite de termos (obrigatório)
   - Newsletter (opcional)

### Características Demonstradas

- ✅ **Múltiplos Steps**: Navegação entre steps com validação por etapa
- ✅ **Validações Condicionais**: Campos que aparecem/validam baseado em outros campos
- ✅ **Validações Cruzadas**: Dependências entre campos (ex: telefone depende do nome)
- ✅ **Campos Aninhados**: Uso de dot notation para objetos aninhados (address.cep, payment.method)
- ✅ **Tipagem Forte**: IntelliSense completo com sugestões baseadas no schema Zod
- ✅ **HMR Funcional**: Hot Module Replacement funciona enquanto você desenvolve a lib

## Como Usar

### Instalar Dependências

```bash
pnpm install
```

### Executar em Desenvolvimento

```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`

### Build para Produção

```bash
pnpm build
```

### Preview do Build

```bash
pnpm preview
```

## Estrutura do Projeto

```
apps/example/
├── src/
│   ├── components/
│   │   ├── fields/          # Componentes de campos reutilizáveis
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   └── fields.css
│   │   └── CheckoutForm.tsx  # Formulário principal
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Importação da Lib

A lib é importada diretamente do workspace usando o alias configurado no `vite.config.ts`:

```typescript
import { field, useWizard, WizardProvider } from "zormy";
```

Durante o desenvolvimento, o Vite resolve para o source da lib (`packages/zormy/src`), garantindo que o HMR funcione corretamente.

## Exemplos de Uso

### Campo Simples

```typescript
const NameField = field("name")
  .schema(z.string().min(3, "Nome deve ter pelo menos 3 caracteres"))
  .render(({ register, fieldState }) => (
    <Input
      {...register()}
      label="Nome Completo"
      error={fieldState.error?.message}
      required
    />
  ));
```

### Campo com Dependência

```typescript
const PhoneField = field("phone")
  .dependsOn(NameField)
  .schema((formValues) => {
    const name = formValues?.name;
    if (name && name.length > 0) {
      return z.string().min(10, "Telefone deve ter pelo menos 10 dígitos");
    }
    return z.string().optional();
  })
  .render(({ register, fieldState, getValues }) => {
    const name = getValues("name");
    const isRequired = name && name.length > 0;
    return (
      <Input
        {...register()}
        label="Telefone"
        error={fieldState.error?.message}
        required={isRequired}
      />
    );
  });
```

### Campo Aninhado

```typescript
const CepField = field("address.cep")
  .schema(z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"))
  .render(({ register, fieldState }) => (
    <Input
      {...register({ name: "address.cep" })}
      label="CEP"
      error={fieldState.error?.message}
      required
    />
  ));
```

### Wizard Multi-Step

```typescript
const wizard = useWizard({
  steps: ["personal", "address", "payment", "confirmation"] as const,
  fields: {
    personal: [NameField, EmailField, PhoneField],
    address: [CepField, StreetField, ...],
    payment: [PaymentMethodField, CardNumberField, ...],
    confirmation: [TermsField, NewsletterField]
  },
  defaultValues: { /* valores iniciais */ },
  onSubmit: (data) => {
    console.log("Formulário completo:", data);
  }
});
```

## Testando Tipagem

O TypeScript fornece IntelliSense completo baseado nos schemas Zod definidos. Ao usar `getValues()`, `setValue()`, ou acessar `formValues` em schemas dinâmicos, você terá autocomplete e verificação de tipos.

## Notas

- Este é um ambiente de desenvolvimento, não uma aplicação de produção
- Serve como base para copiar código para documentação ou criar demos no StackBlitz
- O HMR está configurado para funcionar com mudanças na lib em tempo real
