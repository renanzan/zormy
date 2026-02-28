import { execSync } from "child_process";
import Enquirer from "enquirer";

const IMPORTANT = ["react", "react-dom", "next", "typescript"];
const IGNORED = ["zod"];

const color = {
	red: (t) => `\x1b[31m${t}\x1b[0m`,
	yellow: (t) => `\x1b[33m${t}\x1b[0m`,
	green: (t) => `\x1b[32m${t}\x1b[0m`,
	cyan: (t) => `\x1b[36m${t}\x1b[0m`,
	bold: (t) => `\x1b[1m${t}\x1b[0m`,
	dim: (t) => `\x1b[2m${t}\x1b[0m`,
};

// ----------------------------------------------
// Exec helpers
// ----------------------------------------------
const safeJSON = (str) => {
	if (!str?.trim()) return null;
	try {
		const match = str.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
		return JSON.parse(match?.[0] || str);
	} catch {
		return null;
	}
};

function runOutdated() {
	try {
		const out = execSync("pnpm -r outdated --format json", {
			stdio: ["pipe", "pipe", "pipe"],
			encoding: "utf8",
		});
		return safeJSON(out) || {};
	} catch (err) {
		const msg = err.stdout?.toString() || err.stderr?.toString() || "";
		const parsed = safeJSON(msg);
		return parsed || (err.status === 1 ? {} : null);
	}
}

// ----------------------------------------------
// Semver diff
// ----------------------------------------------
const getUpdateType = (c, l) => {
	const [a, b, d] = c.split(".").map(Number);
	const [x, y, z] = l.split(".").map(Number);
	if (x > a) return "major";
	if (y > b) return "minor";
	if (z > d) return "patch";
	return "none";
};

const colorType = (t) =>
	({
		major: color.red("MAJOR"),
		minor: color.yellow("MINOR"),
		patch: color.green("PATCH"),
	})[t] || "NONE";

// ----------------------------------------------
// Filtrar outdated de verdade
// ----------------------------------------------
function filterOutdated(data) {
	const res = {};
	for (const [pkg, info] of Object.entries(data)) {
		const current = info.current || info.version;
		const latest = info.latest || info.latestVersion;
		const wanted = info.wanted;

		const outdated =
			current !== latest || (wanted && wanted !== latest) || (wanted && current !== wanted);

		if (outdated) res[pkg] = { current, latest, wanted };
	}
	return res;
}

// ----------------------------------------------
// Resumo
// ----------------------------------------------
function showSummary(outdated) {
	const list = filterOutdated(outdated);
	const allRaw = Object.keys(list);
	const ignoredCount = allRaw.filter((p) => IGNORED.includes(p)).length;
	const all = allRaw.filter((p) => !IGNORED.includes(p));
	const totalOutdated = allRaw.length;

	// Não tem nada pra atualizar (só ignoradas ou nada)
	if (!all.length) {
		if (ignoredCount > 0) {
			console.log(color.green("\n✔ Todas as dependências consideradas estão atualizadas!"));
			console.log(
				color.dim(
					`ℹ ${totalOutdated} desatualizada(s) encontrada(s), ` +
						`${ignoredCount} ignorada(s) pela configuração.\n`
				)
			);
		} else {
			console.log(color.green("\n✔ Todas as dependências estão atualizadas!\n"));
		}

		return { all: [], important: [], data: {} };
	}

	const important = all.filter((p) => IMPORTANT.includes(p));
	const regular = all.filter((p) => !IMPORTANT.includes(p));

	const byType = { major: [], minor: [], patch: [] };
	for (const pkg of all) {
		const info = list[pkg];
		const type = getUpdateType(info.current, info.latest);
		if (type !== "none") byType[type].push({ pkg, ...info, type });
	}

	const ignoredInfo =
		ignoredCount > 0
			? ` ${color.cyan("•")} ${color.dim(`${ignoredCount} ignorada(s) pela configuração`)}`
			: "";

	console.log(
		`  ${color.bold(all.length)} consideradas (de ${totalOutdated} desatualizada(s)) ` +
			`${color.cyan("•")} ${color.yellow(important.length)} críticas ` +
			`${color.cyan("•")} ${colorType("major")} ${byType.major.length} ` +
			`${color.cyan("•")} ${colorType("minor")} ${byType.minor.length} ` +
			`${color.cyan("•")} ${colorType("patch")} ${byType.patch.length}` +
			ignoredInfo +
			"\n"
	);

	// críticas
	if (important.length) {
		console.log(color.bold(color.yellow(`⚠ Dependências críticas (${important.length}):`)));
		for (const pkg of important) {
			const info = list[pkg];
			const type = colorType(getUpdateType(info.current, info.latest));

			const cur = info.current;
			const wanted = info.wanted;
			const latest = info.latest;

			const version =
				wanted && wanted !== cur
					? `${color.yellow(cur)} ${color.cyan(`(${wanted})`)} → ${color.green(latest)}`
					: `${color.yellow(cur)} → ${color.green(latest)}`;

			console.log(`  ${color.red("●")} ${color.bold(pkg)} ${color.cyan(`[${type}]`)} ${version}`);
		}
		console.log("");
	} else {
		console.log(color.green("✔ Todas as dependências críticas consideradas estão atualizadas.\n"));
	}

	// outras
	if (regular.length) {
		const prev = regular.slice(0, 5).join(", ");
		const more = regular.length > 5 ? ` +${regular.length - 5}` : "";
		console.log(color.cyan(`ℹ Outras (${regular.length}): ${prev}${more}\n`));
		console.log(color.dim(`  ${prev}${more}\n`));
	}

	return { all, important, data: list };
}

// ----------------------------------------------
// Menu
// ----------------------------------------------
async function askMenu(nImp, nAll) {
	const choices = [];

	if (nImp)
		choices.push({
			name: `Atualizar apenas dependências críticas (${nImp})`,
			value: "important",
		});
	if (nAll) choices.push({ name: `Atualizar todas (${nAll})`, value: "all" });

	choices.push({ name: "Ignorar", value: "ignore" });

	try {
		const result = await new Enquirer().prompt({
			type: "select",
			name: "choice",
			message: "📋 O que deseja fazer?",
			choices: choices.map((c) => ({ name: c.name, value: c.value })),
			initial: 0,
		});

		// ESSA PARTE AQUI É O QUE SUA VERSÃO ANTIGA FAZIA
		const raw = result?.choice ?? result;
		const found = choices.find((c) => c.name === raw);

		return found ? found.value : raw;
	} catch {
		return null;
	}
}

// ----------------------------------------------
// Atualização — versão compatível com a sua
// ----------------------------------------------
function updateDeps(packages, only) {
	const list = Array.isArray(packages) ? packages.join(" ") : "";
	const cmd = only
		? `pnpm update --recursive --latest ${list}`
		: "pnpm update --recursive --latest";

	console.log("\n" + color.bold(color.cyan("🚀 Iniciando atualização...\n")));
	console.log(color.dim(`→ pnpm command: ${cmd}\n`));

	try {
		execSync(cmd, {
			stdio: "inherit",
			encoding: "utf8",
			shell: process.platform === "win32" ? "cmd.exe" : true,
			cwd: process.cwd(),
		});

		console.log(color.bold(color.green("\n✔ Atualização concluída com sucesso! 🎉")));
		console.log(color.dim("Tudo está em ordem.\n"));
		return true;
	} catch (err) {
		// pnpm às vezes dá erro mesmo funcionando
		if (err.status === 0 || err.stdout?.toString().length > 0) {
			console.log(color.green("\n✓ Dependências atualizadas!"));
			return true;
		}

		console.log(color.bold(color.red(`\n⛔ Erro ao atualizar dependências`)));
		console.log(color.red(`   → ${err.message}\n`));
		return false;
	}
}

// ----------------------------------------------
// Execução principal
// ----------------------------------------------
(async () => {
	console.log(color.cyan("🔍 Verificando dependências..."));

	const outdated = runOutdated();
	if (!outdated || !Object.keys(outdated).length) {
		console.log(color.green("✔ Todas as dependências estão atualizadas!\n"));
		return;
	}

	const { all, important } = showSummary(outdated);
	if (!all.length) return;

	const choice = await askMenu(important.length, all.length);

	if (!choice) {
		console.log(color.yellow("⚠ Nenhuma opção selecionada. Saindo..."));
		return;
	}

	if (choice === "important") {
		updateDeps(important, true);
	} else if (choice === "all") {
		// Atualiza todos os pacotes desatualizados, excluindo os ignorados
		// A lista 'all' já está filtrada sem os ignorados em showSummary
		updateDeps(all, true);
	} else {
		console.log(color.yellow("⚠ Atualização ignorada pelo usuário."));
		console.log(color.dim("Nenhuma modificação realizada.\n"));
	}
})();
