# Brutus Cortes

Sistema de barbearia feito com React, Node.js, Express e MongoDB. Clientes podem consultar serviços, verificar datas e horários realmente disponíveis, criar conta e solicitar um agendamento. O pedido começa pendente e o cabeleireiro confirma ou recusa no painel administrativo.

## O que já está previsto

- Catálogo público de cortes, preços e duração, editável pelo administrador.
- Calendário mensal por serviço; cada data e horário aparece apenas se couber no expediente e não estiver ocupado por uma solicitação pendente ou confirmada.
- Cadastro e login de clientes, histórico de solicitações e painel protegido para o único administrador.
- Configuração semanal do expediente, com abertura/fechamento e horas separadas para cada um dos sete dias.
- Cadastro manual de clientes de plano mensal, valor, vencimento, início, situação e observações. Não há cobrança automática.
- Atalho de WhatsApp habilitado pelo número que o proprietário configurar.
- `render.yaml` para hospedar o frontend e a API no mesmo serviço web do Render.

Os quatro serviços criados automaticamente em uma base vazia usam preços demonstrativos. Revise o catálogo no painel antes de divulgar o endereço do sistema. A agenda começa fechada; o cabeleireiro deve cadastrar o expediente antes que clientes vejam horários livres.

## Requisitos

- Node.js 22 ou superior, antes da versão 27.
- Uma instância MongoDB Atlas ou MongoDB compatível com o Mongoose.
- Um usuário de banco do MongoDB com acesso apenas ao banco usado pelo aplicativo.

## Rodar localmente no Windows

1. No PowerShell, dentro da pasta do projeto, instale as dependências e crie o arquivo local de configuração:

   ```powershell
   npm install
   Copy-Item .env.example .env
   ```

2. No arquivo `.env`, informe `MONGODB_URI`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`. Gere um segredo local para `JWT_SECRET`, por exemplo:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

3. Em `WHATSAPP_PHONE`, informe somente os dígitos do telefone em formato internacional, incluindo o código do país e da cidade. Enquanto estiver vazio, o site não exibe um link quebrado. Para lembretes automáticos, configure também a conta oficial da WhatsApp Cloud API e as variáveis `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_REMINDER_TEMPLATE_24H` e `WHATSAPP_REMINDER_TEMPLATE_2H`.

4. Configure no MongoDB Atlas um usuário de banco e uma entrada de rede para permitir a conexão do ambiente onde o aplicativo está sendo executado. Restrinja a lista de acesso ao menor conjunto de endereços possível. O URI fica somente no `.env`, que está ignorado pelo Git.

5. Execute:

   ```powershell
   npm run dev
   ```

   Abra `http://127.0.0.1:5173`. O Vite serve o React e encaminha `/api` ao Express em `127.0.0.1:3000`. Sem `MONGODB_URI`, a interface ainda abre, mas as operações persistentes retornam que o banco não está configurado.

Na primeira conexão com um banco vazio, o sistema cria os serviços demonstrativos e os sete dias da semana inicialmente fechados. A conta admin é criada uma vez a partir de `ADMIN_EMAIL` e `ADMIN_PASSWORD`; o cadastro público nunca cria outro admin. Depois de entrar em `/admin`, configure os dias e horas de funcionamento e ajuste os valores demonstrativos antes de abrir a agenda para clientes.

## Publicar no Render

1. Crie um repositório Git privado para os arquivos do projeto e envie o código, sem `.env`, `node_modules` ou qualquer credencial. Esta tarefa não cria o repositório nem publica o serviço.
2. No Render, conecte esse repositório como um Blueprint usando o `render.yaml` da raiz. O Blueprint cria um único serviço Node na região de Virginia, compila o frontend e inicia o Express.
3. Preencha no painel do Render os valores de `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `WHATSAPP_PHONE`. O blueprint gera `JWT_SECRET` automaticamente. Configure no Atlas um usuário de banco e a lista de IPs/rede que permita a saída do serviço Render, conforme o plano e a configuração de rede que você usar.
4. Aguarde o deploy concluir. O caminho `/api/health` retorna sucesso somente quando o MongoDB está conectado. Depois de abrir o endereço público, entre com a conta admin criada a partir das variáveis e configure expediente, serviços e valores.

Não use `0.0.0.0/0` na lista de acesso do Atlas como padrão: esse intervalo permite tentativas de conexão de qualquer endereço. Se a configuração de rede escolhida exigir uma faixa ampla, use credenciais fortes e avalie alternativas de rede antes de expor o banco.

### Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `MONGODB_URI` | URI privada do MongoDB/Atlas. |
| `ADMIN_EMAIL` | E-mail usado para provisionar a única conta administrativa inicial. |
| `ADMIN_PASSWORD` | Senha forte usada no provisionamento inicial; o aplicativo salva somente o hash. |
| `JWT_SECRET` | Segredo da sessão assinada; gerado pelo Render no deploy do Blueprint. |
| `WHATSAPP_PHONE` | Telefone internacional somente com dígitos; o número pode aparecer no link público. |
| `WHATSAPP_ACCESS_TOKEN` | Token privado da WhatsApp Cloud API; nunca coloque no frontend ou no Git. |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número oficial usado pela Cloud API para enviar mensagens. |
| `WHATSAPP_API_VERSION` | Versão da Graph API; padrão `v23.0`. |
| `WHATSAPP_REMINDER_TEMPLATE_24H` | Nome do template Utility aprovado para o lembrete de 24 horas. |
| `WHATSAPP_REMINDER_TEMPLATE_2H` | Nome do template Utility aprovado para o lembrete de 2 horas. |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Idioma aprovado dos templates; padrão `pt_BR`. |
| `REMINDER_LOOKBACK_MINUTES` | Janela de tolerância do cron; padrão 20 minutos. |
| `SHOP_TIMEZONE` | Fuso das datas da barbearia; padrão `America/Sao_Paulo`. |
| `PORT` | Porta do Express; o Render fornece o valor de produção. |

Se a coleção de usuários já tiver um administrador, reiniciar a aplicação não troca a senha dele nem cria outro administrador. Para recuperar o acesso, use um procedimento administrativo controlado no MongoDB, sem expor a senha ao cliente ou ao repositório.

## Segurança e funcionamento

As senhas são processadas com `bcryptjs`; a sessão é armazenada em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção. Os dados de admin nunca são aceitos a partir de campos enviados pelo cliente. A API reserva os segmentos de 30 minutos em um índice único do MongoDB, reduzindo o risco de duas pessoas obterem o mesmo horário mesmo se enviarem pedidos quase ao mesmo tempo. Ao recusar uma solicitação, o cabeleireiro libera esses segmentos.

Não há envio de e-mail ou cobrança automática nesta versão. O cliente acompanha o estado do pedido em “Minha conta”; os valores de planos são registros manuais do admin.

## Comandos

- `npm run dev` — Express + Vite em desenvolvimento.
- `npm run build` — compila o frontend React.
- `npm start` — inicia o serviço Express para produção.
- `npm run lint` — verifica JavaScript e JSX com ESLint.
- `npm run job:whatsapp-reminders` — consulta agendamentos confirmados e envia lembretes autorizados via WhatsApp.

## Referências oficiais

- [Deploy de Node/Express no Render](https://render.com/docs/deploy-node-express-app)
- [Blueprint YAML do Render](https://render.com/docs/blueprint-spec)
- [Variáveis e segredos no Render](https://render.com/docs/configure-environment-variables)
- [Conexão de clientes com o MongoDB Atlas](https://www.mongodb.com/docs/atlas/driver-connection/)
- [Lista de acesso de IP do Atlas](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
