# TODO — Brutus Cortes

## Resultados a entregar

- [x] **Catálogo de cortes e valores.** O cliente consegue ver as opções de cortes/serviços e seus valores. O admin consegue editar o nome, o preço, a duração e a disponibilidade dos serviços; os preços de exemplo são claramente configuráveis antes de divulgar o sistema.

- [x] **Cadastro e acesso de clientes.** O sistema oferece criação de conta para novos clientes, login, logout e acesso às próprias solicitações. O cadastro público cria somente conta de cliente; não permite escolher ou obter o papel de administrador.

- [x] **Calendário e horários realmente disponíveis.** Depois de escolher um corte/serviço, o cliente vê datas com disponibilidade e, ao selecionar uma data, apenas os horários livres que comportam a duração do serviço. A disponibilidade respeita o expediente cadastrado pelo admin, o fuso `America/Sao_Paulo` e os horários ocupados por agendamentos pendentes ou confirmados. O servidor valida novamente a disponibilidade ao receber o pedido; um novo agendamento fica pendente de decisão.

- [x] **Confirmação e recusa de agendamentos.** O único admin/cabeleireiro consegue visualizar solicitações e confirmar ou recusar cada uma. Solicitações pendentes e confirmadas bloqueiam a agenda; solicitações recusadas deixam de ocupar o horário. As rotas de administração exigem autenticação e papel administrativo.

- [x] **Expediente semanal administrado pelo cabeleireiro.** O admin pode abrir ou fechar cada um dos sete dias da semana e cadastrar horário de início e fim. O cliente não recebe horários disponíveis antes de haver expediente configurado. O sistema oferece opções em blocos de 30 minutos dentro do período salvo.

- [x] **Gestão de clientes do plano mensal.** Existe uma área do admin para associar clientes cadastrados a planos e registrar nome do plano, valor mensal, dia de vencimento, início, situação e observações. Esses registros são controle manual, sem cobrança automática.

- [x] **Atalho para WhatsApp.** A interface oferece contato direto com o cabeleireiro via WhatsApp usando o telefone configurado; nenhum número é inventado ou exposto em código-fonte como valor real. A interface trata a ausência de configuração sem gerar link quebrado.

- [x] **Preparação para Render e MongoDB Atlas.** A aplicação usa React, Node.js/Express e MongoDB; inclui `render.yaml`, `.env.example` sem credenciais reais e README com passos para configurar Atlas, variáveis privadas, executar localmente e implantar o serviço no Render. A aplicação não será publicada nem terá segredos enviados nesta tarefa.

- [x] **Segurança e experiência responsiva.** Senhas são armazenadas como hash; a sessão usa cookie HTTP-only, com `Secure` em produção; campos e rotas são validados; recursos administrativos não são acessíveis a clientes; a interface em português brasileiro funciona em telas móveis e desktop.

- [x] **Revisão integrada.** Fazer uma revisão read-only da implementação para rastrear requisitos entre frontend, API, modelos MongoDB e permissões; corrigir problemas concretos encontrados e executar as verificações disponíveis sem escrever ou apagar dados de produção.

## Validação final

- [x] `npm rebuild esbuild` concluído; script autorizado reconstruído.
- [x] `npm run lint` concluído sem erros ou avisos.
- [x] `npm run build` concluído com Vite 7.3.8, transformando 1.612 módulos.
- [x] `client/dist` contém HTML, JavaScript, CSS, fontes e a imagem hero.
- [ ] Integração real com MongoDB Atlas, navegação HTTP local e implantação no Render: dependem de credenciais/rede externas. O teste HTTP local foi bloqueado por `EACCES` ao abrir loopback; não foi tentado contornar a restrição.
