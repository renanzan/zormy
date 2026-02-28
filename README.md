# Zormy

<div align="center">

**Sistema de formulários tipados e reutilizáveis para React**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Zod](https://img.shields.io/badge/Zod-3E63DD?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)
[![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)](https://react-hook-form.com/)

[Documentação](#-documentação) • [Instalação](#-instalação) • [Quick Start](#-quick-start) • [Exemplos](#-exemplos) • [Contribuindo](#-contribuindo)

</div>

---

## 📑 Índice

- [Sobre](#-sobre)
- [Características Principais](#-características-principais)
- [Instalação](#-instalação)
- [Quick Start](#-quick-start)
- [Documentação](#-documentação)
- [Exemplos](#-exemplos)
- [Estrutura do Projeto](#️-estrutura-do-projeto)
- [Testes](#-testes)
- [Desenvolvimento](#️-desenvolvimento)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)
- [Agradecimentos](#-agradecimentos)
- [Suporte](#-suporte)

---

## 📖 Sobre

**Zormy** é uma biblioteca moderna e poderosa para criar formulários tipados e reutilizáveis em React. Combinando a flexibilidade do React Hook Form, a robustez do Zod e a segurança de tipos do TypeScript, o Zormy oferece uma experiência de desenvolvimento excepcional com inferência automática de tipos end-to-end.

### Por que Zormy?

- 🎯 **TypeScript First**: Inferência automática de tipos em todo o fluxo de desenvolvimento
- 🔒 **Validação Declarativa**: Integração nativa com Zod para validação poderosa e reutilizável
- ♻️ **Campos Reutilizáveis**: Crie campos uma vez e reutilize em qualquer formulário
- 🧙 **Wizards Multi-Step**: Construa fluxos complexos com validação por etapa
- 🌳 **Campos Aninhados**: Suporte nativo para estruturas de dados complexas
- ⚡ **Dependências Dinâmicas**: Validação e renderização baseadas em outros campos

## ✨ Características Principais

### 🎨 Tipagem Forte

Inferência automática de tipos TypeScript em todo o fluxo:

- Tipos inferidos automaticamente dos schemas Zod
- IntelliSense completo no seu editor
- Erros de tipo detectados em tempo de compilação
- Zero configuração adicional necessária

### 🛡️ Validação com Zod

Integração nativa com Zod permite:

- Schemas estáticos ou dinâmicos
- Validação síncrona e assíncrona
- Mensagens de erro customizadas
- Transformações de dados
- Validação condicional baseada em outros campos

### 🔧 Campos Reutilizáveis

Crie campos uma vez e use em qualquer lugar:

```tsx
const EmailField = field("email")
	.schema(z.string().email("E-mail inválido"))
	.render(({ register, fieldState }) => (
		<div>
			<input type="email" {...register()} />
			{fieldState.error && <span>{fieldState.error.message}</span>}
		</div>
	));

// Reutilize em qualquer formulário
<EmailField />;
```

### 🧙 Wizards Multi-Step

Organize formulários complexos em steps:

- Validação por etapa
- Navegação intuitiva entre steps
- Steps condicionais
- Auto-save opcional
- Tipagem forte para cada step

### 🌳 Campos Aninhados

Suporte nativo para estruturas de dados aninhadas:

```tsx
const AddressField = field("address.street")
	.schema(z.string().min(5))
	.render(({ register }) => <input {...register({ name: "address.street" })} />);
```

### ⚡ Dependências Dinâmicas

Validação e renderização baseadas em outros campos:

```tsx
const PhoneField = field("phone")
	.dependsOn(NameField)
	.schema((formValues) => {
		const name = formValues?.name;
		if (name && name.length > 0) {
			return z.string().min(10, "Telefone obrigatório");
		}
		return z.string().optional();
	})
	.render(({ register, fieldState, getValues }) => {
		const name = getValues("name");
		const isRequired = name && name.length > 0;
		return <input {...register()} required={isRequired} />;
	});
```

## 🚀 Instalação

```bash
# Usando pnpm (recomendado)
pnpm add zormy zod react-hook-form

# Usando npm
npm install zormy zod react-hook-form

# Usando yarn
yarn add zormy zod react-hook-form
```

### Dependências Peer

Zormy requer as seguintes dependências peer:

- `react` (^18.0.0 ou superior)
- `react-hook-form` (^7.71.1 ou superior)
- `zod` (^3.25.28 ou superior)
- `@hookform/resolvers` (^5.2.2 ou superior)

### Requisitos

- **Node.js**: 18.0.0 ou superior
- **TypeScript**: 5.0.0 ou superior (recomendado para melhor experiência)
- **React**: 18.0.0 ou superior

## 📚 Quick Start

### Formulário Simples

```tsx
import { z } from "zod";
import { field, Form, formyResolver, useForm } from "zormy";

// 1. Defina o campo
const NameField = field("name")
	.schema(z.string().min(3, "Nome deve ter pelo menos 3 caracteres"))
	.render(({ register, fieldState }) => (
		<div>
			<label>Nome</label>
			<input {...register()} />
			{fieldState.error && <span style={{ color: "red" }}>{fieldState.error.message}</span>}
		</div>
	));

// 2. Use no formulário
function App() {
	const form = useForm({
		resolver: formyResolver({ fields: [NameField] }),
		defaultValues: { name: "" },
	});

	return (
		<Form methods={form} onSubmit={form.handleSubmit((data) => alert(JSON.stringify(data)))}>
			<NameField />
			<button type="submit">Enviar</button>
		</Form>
	);
}
```

### Wizard Multi-Step

```tsx
import { z } from "zod";
import { createWizardComponents, createWizardConfig, field, useWizard } from "zormy";

// 1. Defina os campos
const NameField = field("name")
	.schema(z.string().min(3))
	.render(({ register }) => <input {...register()} />);

const EmailField = field("email")
	.schema(z.string().email())
	.render(({ register }) => <input type="email" {...register()} />);

// 2. Configure o wizard
const config = createWizardConfig({
	steps: ["personal", "contact"] as const,
	fields: {
		personal: [NameField],
		contact: [EmailField],
	},
});

// 3. Crie os componentes
const { Wizard, Step } = createWizardComponents(config);

// 4. Use no componente
function MyWizard() {
	const wizard = useWizard({
		...config,
		defaultValues: { name: "", email: "" },
	});

	return (
		<Wizard wizard={wizard}>
			<Step step="personal">
				<h2>Informações Pessoais</h2>
				<NameField />
				<button onClick={wizard.nextStep}>Próximo</button>
			</Step>

			<Step step="contact">
				<h2>Contato</h2>
				<EmailField />
				<button onClick={wizard.prevStep}>Anterior</button>
				<button onClick={wizard.nextStep}>Próximo</button>
			</Step>
		</Wizard>
	);
}
```

## 📖 Documentação

Para documentação completa, exemplos avançados e referência da API, visite nossa [documentação oficial](https://zormy.dev) (quando disponível).

### Recursos da Documentação

- 📘 [Get Started](https://zormy.dev/get-started) - Guia rápido para começar
- 🎯 [Exemplos](https://zormy.dev/examples) - Exemplos práticos e interativos
- 🔗 [Zod Integration](https://zormy.dev/zod-integration) - Guia completo de validação
- 📚 [API Reference](https://zormy.dev/api-reference) - Referência completa da API
- 🎮 [Playground](https://zormy.dev/playground) - Experimente em tempo real

## 💡 Exemplos

### Campos com Dependências

```tsx
const PhoneField = field("phone")
	.dependsOn(NameField)
	.schema((formValues) => {
		const name = formValues?.name;
		if (name && name.length > 0) {
			return z.string().min(10, "Telefone obrigatório");
		}
		return z.string().optional();
	})
	.render(({ register, fieldState, getValues }) => {
		const name = getValues("name");
		const isRequired = name && name.length > 0;
		return (
			<div>
				<input type="tel" {...register()} required={isRequired} placeholder="(00) 00000-0000" />
				{fieldState.error && <span>{fieldState.error.message}</span>}
			</div>
		);
	});
```

### Campos Abstratos (Templates)

```tsx
// Crie um template reutilizável
const BaseTextField = abstractField()
	.schema(z.string().min(3))
	.render(({ register, fieldState }) => (
		<div>
			<input {...register()} />
			{fieldState.error && <span>{fieldState.error.message}</span>}
		</div>
	));

// Estenda com chaves específicas
const NameField = BaseTextField.extend({ key: "name" });
const EmailField = BaseTextField.extend({ key: "email" });
```

### Wizard com Auto-Save

```tsx
const wizard = useWizard({
	...config,
	defaultValues: { name: "", email: "" },
	autoSave: {
		enabled: true,
		debounceMs: 1000,
		onSave: async (values) => {
			await saveToServer(values);
		},
	},
});
```

### Steps Condicionais

```tsx
const config = createWizardConfig({
	steps: ["basic", "advanced", "summary"] as const,
	fields: {
		basic: [NameField, EmailField],
		advanced: [PhoneField, AddressField],
		summary: [TermsField],
	},
	shouldIncludeStep: (step, formValues) => {
		if (step === "advanced") {
			return formValues["email"]?.includes("@company.com");
		}
		return true;
	},
});
```

## 🏗️ Estrutura do Projeto

```
zormy/
├── packages/
│   └── zormy/          # Pacote principal da biblioteca
│       ├── src/
│       │   ├── fields/          # Sistema de campos
│       │   ├── wizards/         # Sistema de wizards
│       │   ├── resolver/        # Resolver para React Hook Form
│       │   ├── components/      # Componentes React
│       │   └── integrations/    # Integrações externas
│       └── __tests__/           # Testes unitários
├── apps/
│   ├── example/        # Aplicação de exemplo
│   ├── docs/           # Documentação
│   └── test-build/     # Testes de build
└── README.md
```

## 🧪 Testes

```bash
# Executar testes
pnpm test

# Executar testes em modo watch
pnpm test:watch

# Executar testes com cobertura
pnpm test:coverage
```

## 🛠️ Desenvolvimento

### Pré-requisitos

- Node.js 18+
- pnpm 10.18.1+

### Setup Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/zormy.git
cd zormy

# Instale as dependências
pnpm install

# Execute os testes
pnpm test

# Execute o exemplo
pnpm dev

# Execute a documentação
pnpm dev:docs
```

### Scripts Disponíveis

- `pnpm build` - Compila o pacote principal
- `pnpm dev` - Executa a aplicação de exemplo
- `pnpm dev:docs` - Executa a documentação
- `pnpm test` - Executa os testes
- `pnpm lint` - Verifica o código com ESLint
- `pnpm format` - Formata o código com Prettier

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia nosso [guia de contribuição](CONTRIBUTING.md) antes de enviar pull requests.

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes

- Siga os padrões de código existentes
- Adicione testes para novas funcionalidades
- Atualize a documentação quando necessário
- Mantenha os commits descritivos e organizados

## 📝 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [React Hook Form](https://react-hook-form.com/) - Biblioteca de formulários incrível
- [Zod](https://zod.dev/) - Validação de schemas TypeScript-first
- [TypeScript](https://www.typescriptlang.org/) - Tipagem estática poderosa

## 📞 Suporte

- 📧 Email: [seu-email@exemplo.com](mailto:seu-email@exemplo.com)
- 💬 Issues: [GitHub Issues](https://github.com/seu-usuario/zormy/issues)
- 📖 Documentação: [Documentação Oficial](https://zormy.dev)

## ⭐ Estrelas

Se este projeto foi útil para você, considere dar uma estrela ⭐ no GitHub!

---

<div align="center">

Feito com ❤️ pela comunidade Zormy

[Voltar ao topo](#zormy)

</div>
