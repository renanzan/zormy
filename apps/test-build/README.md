# Test Build - Zormy

Este projeto testa **apenas os arquivos compilados** do `zormy` (em `packages/zormy/dist/`), sem usar o source diretamente.

## Objetivo

Validar que:

- ✅ Os arquivos compilados funcionam corretamente
- ✅ Os imports ESM/CommonJS estão corretos
- ✅ As tipagens estão funcionando
- ✅ O build está pronto para produção

## Configuração

Este app **NÃO** usa:

- ❌ Aliases para `src/`
- ❌ Condição `development` do package.json
- ❌ Imports diretos do source

Este app **USA**:

- ✅ Arquivos compilados de `dist/`
- ✅ Condições padrão: `import`, `module`, `require`
- ✅ Resolução normal do package.json

## Como usar

1. **Compilar o zormy primeiro:**

   ```bash
   cd packages/zormy
   pnpm run build
   ```

2. **Instalar dependências:**

   ```bash
   cd apps/test-build
   pnpm install
   ```

3. **Rodar em desenvolvimento:**

   ```bash
   pnpm dev
   ```

4. **Build para produção:**
   ```bash
   pnpm build
   ```

## Verificação

- Abra o console do navegador e verifique se os imports estão funcionando
- Teste o formulário para validar que a API do zormy está funcionando
- Verifique que os arquivos estão sendo carregados de `dist/` (não de `src/`)
