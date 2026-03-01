# Testes de performance do Zormy

Este diretório concentra **métricas de eficiência** da lib (Zod + RHF): quantidade de re-renders e custo da validação.

## 1. Re-renders (ciclo de vida)

- **`form-rerenders.test.tsx`**: testes automatizados com Vitest.
  - Contagem manual (side-effect no render) para garantir que campos independentes não re-renderizem quando outro campo é atualizado.
  - **React.Profiler + `vi.fn()`**: formulário e cada campo envolvidos em `<Profiler>`, com mock em `onRender`; ao atualizar um campo, validamos que apenas o Profiler daquele campo recebe chamada extra (comportamento uncontrolled do RHF preservado).
  - **Estresse**: formulário com 1000 campos; `setValue` no campo #1 e no #1000; validamos que não há degradação extrema (tempo do último campo ≤ 10× o primeiro + margem).

## 2. Velocidade (validação Zod)

- **`validation.bench.ts`**: benchmarks com o modo **Benchmark do Vitest** (`vitest bench`).
  - Executa a função de validação (resolver do zormyResolver) em massa (dados válidos e inválidos).
  - Objetivo: medir _Execution Time_ e _Ops/sec_ para avaliar o overhead do Zod na integração.

**Como rodar os benchmarks:**

```bash
pnpm exec vitest bench --run
# ou, no pacote zormy:
pnpm test:bench
```

## 3. Diagnóstico visual (causa raiz)

Se os números de re-renders ou tempo estiverem altos, use o **React Render Tracker** para entender o porquê:

- Mostra um grafo de dependências de renderização.
- Muitas vezes o resolver Zod faz o RHF validar o formulário inteiro; isso pode causar re-render em vários inputs se não estiverem memoizados ou se o contexto for consumido de forma ampla.
- Use para identificar quais componentes re-renderizam em cadeia e ajustar (ex.: `watch()` mais específico, memoização, ou isolamento de contexto).

## 4. Estresse de mundo real (1000 campos)

- **No Vitest**: o teste "formulário com 1000 campos" em `form-rerenders.test.tsx` já cobre setValue no primeiro e no último campo e verifica ausência de degradação extrema.
- **Página de teste + DevTools/Playwright**: para análise manual com Chrome DevTools (aba Performance) ou Playwright:
  - Crie uma página que renderize um formulário com 1000 campos gerados pela lib.
  - Meça o _Scripting Time_ ao digitar no campo #1 e no campo #1000.
  - Objetivo: se o campo #1000 for muito mais lento que o #1, há possível problema de escalabilidade na manipulação de estado.

## Resumo

| Objetivo                        | Ferramenta              | Arquivo / Ação                            |
| ------------------------------- | ----------------------- | ----------------------------------------- |
| Regressão de re-renders         | Vitest + Profiler/vi.fn | `form-rerenders.test.tsx`                 |
| Custo da validação Zod          | Vitest Bench            | `validation.bench.ts` + `pnpm test:bench` |
| Causa raiz de muitos re-renders | React Render Tracker    | Uso manual em dev                         |
| Escalabilidade (1000 campos)    | Vitest + perf.now       | Teste em `form-rerenders.test.tsx`        |
| Escalabilidade (manual/E2E)     | DevTools / Playwright   | Página de teste com 1000 campos           |
