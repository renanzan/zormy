import CheckoutForm from "./components/CheckoutForm";

import "./App.css";

function App() {
	return (
		<div className="app">
			<header className="app-header">
				<h1>Zormy - Exemplo de Formulário</h1>
				<p>Formulário de Checkout com múltiplos steps e validações complexas</p>
			</header>
			<main className="app-main">
				<CheckoutForm />
			</main>
		</div>
	);
}

export default App;
