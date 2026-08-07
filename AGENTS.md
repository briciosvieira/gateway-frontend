# Gateway Hub LF Frontend — Agent Instructions

Antes de iniciar qualquer tarefa:

1. Leia primeiro:
   - `.ai/PROJECT_CONTEXT.md`
   - `.ai/IMPLEMENTATION_STATUS.md`
   - `.ai/CURRENT_TASK.md`
2. Leia `.ai/BACKEND_CONTRACTS.md` quando a tarefa envolver integração com o backend.
3. Leia `.ai/UI_RULES.md` quando a tarefa envolver layout, sidebar, tabelas, modais ou responsividade.
4. Não pesquise novamente todo o backend se o contrato já estiver registrado.
5. Consulte o backend real somente quando:
   - o contrato estiver ausente;
   - houver divergência;
   - houver erro de integração;
   - o usuário pedir validação explícita.
6. Não faça pesquisas globais no projeto sem necessidade.
7. Abra somente os arquivos diretamente relacionados à tarefa atual.
8. Não atualize README ou docs até a etapa final de documentação.
9. Preserve a política de scroll:
   - Sidebar sem scroll;
   - Main Content como único scroll vertical;
   - páginas sem scroll próprio.
10. Ao concluir uma etapa, atualize:
    - `.ai/IMPLEMENTATION_STATUS.md`
    - `.ai/CURRENT_TASK.md`
    - `.ai/BACKEND_CONTRACTS.md`, somente se algum contrato novo tiver sido confirmado.