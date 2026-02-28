import { Fragment } from "react";
import { z } from "zod";
import { createWizardComponents, createWizardConfig, field, useWizard } from "zormy";

import { Checkbox, Input, Select } from "./fields";

import "./CheckoutForm.css";
import "./fields/fields.css";

// ============================================================================
// Campos do Formulário
// ============================================================================

// Step 1: Informações Pessoais
const NameField = field("name")
	.schema(z.string().min(3, "Nome deve ter pelo menos 3 caracteres"))
	.render(({ register, fieldState }) => (
		<Input
			{...register()}
			label="Nome Completo"
			error={fieldState.error?.message}
			required
			placeholder="Digite seu nome completo"
		/>
	));

const EmailField = field("email")
	.schema(z.string().email("E-mail inválido"))
	.render(({ register, fieldState }) => (
		<Input
			{...register()}
			type="email"
			label="E-mail"
			error={fieldState.error?.message}
			required
			placeholder="seu@email.com"
		/>
	));

const PhoneField = field("phone")
	.dependsOn(NameField)
	.schema((formValues) => {
		const name = formValues?.name;
		// Telefone obrigatório se nome foi preenchido
		if (name && name.length > 0) {
			return z
				.string()
				.min(10, "Telefone deve ter pelo menos 10 dígitos")
				.regex(/^[\d\s\-\(\)]+$/, "Telefone inválido");
		}
		return z.string().optional();
	})
	.render(({ register, fieldState, getValues }) => {
		const name = getValues("name");
		const isRequired = name && name.length > 0;
		return (
			<Input
				{...register()}
				type="tel"
				label="Telefone"
				error={fieldState.error?.message}
				required={!!isRequired}
				placeholder="(00) 00000-0000"
			/>
		);
	});

// Step 2: Endereço
const CepField = field("address.cep")
	.schema(z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"))
	.render(({ register, fieldState }) => (
		<Input
			{...register({ name: "address.cep" })}
			label="CEP"
			error={fieldState.error?.message}
			required
			placeholder="00000-000"
		/>
	));

const StreetField = field("address.street")
	.schema(z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"))
	.render(({ register, fieldState }) => (
		<Input
			{...register({ name: "address.street" })}
			label="Rua"
			error={fieldState.error?.message}
			required
			placeholder="Nome da rua"
		/>
	));

const NumberField = field("address.number")
	.schema(z.string().min(1, "Número é obrigatório"))
	.render(({ register, fieldState }) => (
		<Input
			{...register({ name: "address.number" })}
			label="Número"
			error={fieldState.error?.message}
			required
			placeholder="123"
		/>
	));

const ComplementField = field("address.complement")
	.schema(z.string().optional())
	.render(({ register }) => (
		<Input
			{...register({ name: "address.complement" })}
			label="Complemento"
			placeholder="Apto, Bloco, etc."
		/>
	));

const CityField = field("address.city")
	.schema(z.string().min(2, "Cidade é obrigatória"))
	.render(({ register, fieldState }) => (
		<Input
			{...register({ name: "address.city" })}
			label="Cidade"
			error={fieldState.error?.message}
			required
			placeholder="Nome da cidade"
		/>
	));

const StateField = field("address.state")
	.schema(z.string().length(2, "Estado deve ter 2 caracteres"))
	.render(({ register, fieldState }) => (
		<Select
			{...register({ name: "address.state" })}
			label="Estado"
			error={fieldState.error?.message}
			required
			options={[
				{ value: "SP", label: "São Paulo" },
				{ value: "RJ", label: "Rio de Janeiro" },
				{ value: "MG", label: "Minas Gerais" },
				{ value: "RS", label: "Rio Grande do Sul" },
				{ value: "PR", label: "Paraná" },
				{ value: "SC", label: "Santa Catarina" },
				{ value: "BA", label: "Bahia" },
				{ value: "GO", label: "Goiás" },
			]}
		/>
	));

// Step 3: Pagamento
const PaymentMethodField = field("payment.method")
	.schema(z.enum(["credit", "debit", "pix", "boleto"]))
	.render(({ register, fieldState }) => (
		<Select
			{...register({ name: "payment.method" })}
			label="Método de Pagamento"
			error={fieldState.error?.message}
			required
			options={[
				{ value: "credit", label: "Cartão de Crédito" },
				{ value: "debit", label: "Cartão de Débito" },
				{ value: "pix", label: "PIX" },
				{ value: "boleto", label: "Boleto" },
			]}
		/>
	));

const CardNumberField = field("payment.cardNumber")
	.dependsOn(PaymentMethodField)
	.schema((formValues) => {
		const method = formValues?.payment.method;
		if (method === "credit" || method === "debit") {
			return z
				.string()
				.regex(/^\d{13,19}$/, "Número do cartão inválido")
				.min(13, "Número do cartão deve ter entre 13 e 19 dígitos");
		}
		return z.string().optional();
	})
	.render(({ register, fieldState, getValues }) => {
		const method = getValues("payment.method");
		const isRequired = method === "credit" || method === "debit";
		if (!isRequired) return null;
		return (
			<Input
				{...register({ name: "payment.cardNumber" })}
				label="Número do Cartão"
				error={fieldState.error?.message}
				required={isRequired}
				placeholder="0000 0000 0000 0000"
			/>
		);
	});

const CardNameField = field("payment.cardName")
	.dependsOn(PaymentMethodField)
	.schema((formValues) => {
		const method = formValues?.payment.method;
		if (method === "credit" || method === "debit") {
			return z.string().min(3, "Nome no cartão é obrigatório");
		}
		return z.string().optional();
	})
	.render(({ register, fieldState, getValues }) => {
		const method = getValues("payment.method");
		const isRequired = method === "credit" || method === "debit";
		if (!isRequired) return null;
		return (
			<Input
				{...register({ name: "payment.cardName" })}
				label="Nome no Cartão"
				error={fieldState.error?.message}
				required={isRequired}
				placeholder="Nome como está no cartão"
			/>
		);
	});

const CardExpiryField = field("payment.cardExpiry")
	.dependsOn(PaymentMethodField)
	.schema((formValues) => {
		const method = formValues?.payment.method;
		if (method === "credit" || method === "debit") {
			return z
				.string()
				.regex(/^\d{2}\/\d{2}$/, "Data inválida (use MM/AA)")
				.min(5, "Data de validade é obrigatória");
		}
		return z.string().optional();
	})
	.render(({ register, fieldState, getValues }) => {
		const method = getValues("payment.method");
		const isRequired = method === "credit" || method === "debit";
		if (!isRequired) return null;
		return (
			<Input
				{...register({ name: "payment.cardExpiry" })}
				label="Validade"
				error={fieldState.error?.message}
				required={isRequired}
				placeholder="MM/AA"
				maxLength={5}
			/>
		);
	});

const CardCvvField = field("payment.cardCvv")
	.dependsOn(PaymentMethodField)
	.schema((formValues) => {
		const method = formValues?.payment.method;
		if (method === "credit" || method === "debit") {
			return z
				.string()
				.regex(/^\d{3,4}$/, "CVV inválido")
				.min(3, "CVV é obrigatório");
		}
		return z.string().optional();
	})
	.render(({ register, fieldState, getValues }) => {
		const method = getValues("payment.method");
		const isRequired = method === "credit" || method === "debit";
		if (!isRequired) return null;
		return (
			<Input
				{...register({ name: "payment.cardCvv" })}
				type="password"
				label="CVV"
				error={fieldState.error?.message}
				required={isRequired}
				placeholder="000"
				maxLength={4}
			/>
		);
	});

// Step 4: Confirmação
const TermsField = field("terms")
	.schema(z.boolean().refine((val) => val === true, "Você deve aceitar os termos"))
	.render(({ register, fieldState }) => (
		<Checkbox
			{...register({ name: "terms" })}
			label="Aceito os termos e condições"
			error={fieldState.error?.message}
		/>
	));

const NewsletterField = field("newsletter")
	.schema(z.boolean().optional())
	.render(({ register }) => (
		<Checkbox
			{...register({ name: "newsletter" })}
			label="Desejo receber ofertas e novidades por e-mail"
		/>
	));

// ============================================================================
// Configuração do Wizard
// (fica fora do componente para manter referências estáveis)
// ============================================================================

const steps = ["personal", "address", "payment", "confirmation"] as const;

const wizardConfig = createWizardConfig({
	steps,
	fields: {
		personal: [NameField, EmailField, PhoneField],
		address: [CepField, StreetField, NumberField, ComplementField, CityField, StateField],
		payment: [PaymentMethodField, CardNumberField, CardNameField, CardExpiryField, CardCvvField],
		confirmation: [TermsField, NewsletterField],
	},
});

const { Wizard, Step } = createWizardComponents(wizardConfig);

// ============================================================================
// Componente do Formulário
// ============================================================================

export default function CheckoutForm() {
	const wizard = useWizard({
		...wizardConfig,
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			address: {
				cep: "",
				street: "",
				number: "",
				complement: "",
				city: "",
				state: "",
			},
			payment: {
				method: "credit",
				cardNumber: "",
				cardName: "",
				cardExpiry: "",
				cardCvv: "",
			},
			terms: false,
			newsletter: false,
		},
		onSubmit: (data) => {
			console.log("Formulário submetido:", data);
			alert("Formulário enviado com sucesso! Verifique o console.");
		},
	});

	const stepLabels: Record<(typeof steps)[number], string> = {
		personal: "Informações Pessoais",
		address: "Endereço",
		payment: "Pagamento",
		confirmation: "Confirmação",
	};

	return (
		<Wizard methods={wizard} contextOnly>
			<div className="checkout-form">
				{/* Progress Steps */}
				<div className="checkout-progress">
					{steps.map((step, index) => {
						const stepIndex = wizard.steps.indexOf(step);
						const isActive = wizard.currentStep === step;
						const isCompleted = stepIndex < wizard.steps.indexOf(wizard.currentStep);
						const isAccessible = stepIndex <= wizard.steps.indexOf(wizard.currentStep);

						return (
							<div
								key={step}
								className={`checkout-step ${isActive ? "active" : ""} ${
									isCompleted ? "completed" : ""
								} ${!isAccessible ? "disabled" : ""}`}
								onClick={() => isAccessible && wizard.goToStep(step)}
							>
								<div className="checkout-step-number">{isCompleted ? "✓" : index + 1}</div>
								<div className="checkout-step-label">{stepLabels[step]}</div>
							</div>
						);
					})}
				</div>

				{/* Form Content */}
				<div className="checkout-content">
					<h2 className="checkout-step-title">{stepLabels[wizard.currentStep]}</h2>

					<div className="checkout-fields">
						<Step step="personal" as={Fragment}>
							<NameField />
							<EmailField />
							<PhoneField />
						</Step>

						<Step step="address" as={Fragment}>
							<CepField />
							<StreetField />
							<div className="checkout-row">
								<NumberField />
								<ComplementField />
							</div>
							<div className="checkout-row">
								<CityField />
								<StateField />
							</div>
						</Step>

						<Step step="payment" as={Fragment}>
							<PaymentMethodField />
							<CardNumberField />
							<CardNameField />
							<div className="checkout-row">
								<CardExpiryField />
								<CardCvvField />
							</div>
						</Step>

						<Step step="confirmation" as={Fragment}>
							<TermsField />
							<NewsletterField />
						</Step>
					</div>

					{/* Navigation Buttons */}
					<div className="checkout-actions">
						{wizard.canGoBack && (
							<button
								type="button"
								onClick={wizard.back}
								className="checkout-button checkout-button-secondary"
							>
								Voltar
							</button>
						)}
						<button
							type="button"
							onClick={wizard.next}
							className="checkout-button checkout-button-primary"
						>
							{wizard.isLastStep ? "Finalizar" : "Próximo"}
						</button>
					</div>
				</div>
			</div>
		</Wizard>
	);
}
