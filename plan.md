# Plano — Brutus Cortes

## Objetivo e escopo

Criar uma aplicação responsiva para a barbearia Brutus Cortes, com uma página pública para apresentar cortes e preços, cadastro e login de clientes, agendamento online, contato direto por WhatsApp e uma área restrita para o cabeleireiro. O administrador poderá confirmar ou recusar solicitações, ajustar os serviços e gerenciar clientes do plano mensal. Os valores e vencimentos dos planos serão controles administrativos manuais; não haverá cobrança automática nesta versão.

## Decisões de produto e regras

- O cliente cria uma conta e entra antes de enviar um agendamento. O cadastro público sempre cria um cliente, nunca um administrador.
- Haverá somente uma conta administrativa, provisionada com `ADMIN_EMAIL` e `ADMIN_PASSWORD` em variáveis de ambiente; não haverá botão público de criação de administrador.
- Todo novo agendamento começa como `Pendente`. O administrador pode confirmá-lo ou recusá-lo. Horários pendentes ou confirmados ficam reservados; horários recusados deixam de bloquear a agenda.
- O administrador cadastrará no painel o horário semanal de funcionamento, com opção de abrir ou fechar cada dia e definir o início e o fim do expediente. Os sete dias da semana poderão ser configurados. Enquanto o admin não salvar esses horários, não haverá horários disponíveis para reserva. As opções serão geradas em intervalos de 30 minutos e respeitarão o fuso `America/Sao_Paulo`.
- Depois de escolher um serviço, o cliente verá as datas com horários válidos e, ao escolher uma data, somente os horários livres para a duração daquele serviço. A disponibilidade considerará o expediente semanal e reservas pendentes ou confirmadas; o servidor validará novamente o horário ao receber o agendamento.
- A lista inicial de cortes terá valores demonstrativos, alteráveis na área administrativa. O administrador poderá editar nome, preço, duração e disponibilidade do serviço antes da divulgação real.
- O plano mensal terá cliente, nome do plano, preço mensal, dia de vencimento, início, situação e observações. A tela não processará pagamentos.
- O botão de WhatsApp usará o telefone configurado em `WHATSAPP_PHONE`; o número não será inventado nem gravado no código.
- A interface e mensagens serão em português brasileiro. Textos de agendamento e administração usarão os valores da barbearia, sem prometer confirmação antes da decisão do cabeleireiro.

## Arquitetura e implementação

- React com Vite para a interface, Node.js com Express para API e entrega dos arquivos estáticos, e MongoDB com Mongoose para persistência.
- Um único serviço web Node no Render servirá a aplicação toda. A API ficará sob `/api`; o frontend será servido pelo mesmo domínio para simplificar cookies e implantação.
- O arquivo `render.yaml` declarará os comandos de build/start e variáveis necessárias, usando `sync: false` para segredos informados no painel do Render e `generateValue` para o segredo de sessão. A publicação será feita pelo proprietário conectando o repositório no Render; não farei login nem publicação externa nesta etapa.
- MongoDB Atlas será a fonte de dados externa. A URI ficará em `MONGODB_URI`. O guia orientará criar usuário próprio de banco e limitar a lista de acesso de rede ao necessário; não recomendará liberar acesso geral (`0.0.0.0/0`) como padrão.
- Senhas serão armazenadas com hash; a sessão usará cookie HTTP-only e seguro em produção. Proteções adicionais incluem validação de entrada, rate limit nos acessos e checagem de papel `admin` nas rotas administrativas. O backend nunca confiará no papel enviado pelo navegador.
- Para impedir sobreposição de reservas, o servidor validará horário, duração e estado, apoiado por registros de ocupação em intervalos de 30 minutos com índice único no MongoDB.
- Rotas da aplicação: `/` (apresentação e cortes), `/agendar`, `/entrar`, `/criar-conta`, `/minha-conta` e `/admin` (área do cabeleireiro). A rota técnica `/manus-routes.json` declarará as páginas públicas e privadas do frontend.
- Endpoints previstos: autenticação e sessão; leitura pública dos serviços, expediente e configuração de contato; consulta de disponibilidade por serviço/data e criação de agendamentos; histórico do cliente; e endpoints de administrador para agenda, horários semanais, clientes, serviços e planos mensais.

## Estrutura do projeto

```text
brutus-cortes/
├── client/                  # React/Vite, páginas, componentes e chamadas à API
├── server/
│   ├── config/               # conexão MongoDB e configuração
│   ├── middleware/           # autenticação, autorização e validação
│   ├── models/               # clientes, serviços, agendamentos, planos, expediente e horários ocupados
│   ├── routes/               # endpoints de cliente e administração
│   ├── services/             # regras de agenda e provisionamento inicial
│   └── index.js              # inicialização do Express e arquivos estáticos
├── public/                   # manifesto de rotas e arquivos públicos
├── .env.example              # nomes e exemplos não secretos de configuração
├── render.yaml               # Blueprint do serviço Render
├── README.md                 # instalação, configuração de Atlas e implantação Render
├── TODO.md                   # resultados e critérios de entrega
└── plan.md                   # este plano e o sistema visual
```

## Direção visual

Três direções consideradas: **Oficina editorial escura** (probabilidade 0,04), **Barbearia retrô tipográfica** (probabilidade 0,07) e **Minimalismo urbano claro** (probabilidade 0,02). Escolhida: **Oficina editorial escura**, por equilibrar caráter masculino, contraste e leitura rápida tanto para o catálogo quanto para o painel.

- **Referência estética:** editorial de oficina contemporânea, com materiais escuros, papel marfim e detalhes metálicos discretos.
- **Princípios:** leitura imediata; preço e próximo passo sempre visíveis; personalidade sem ornamento excessivo; painel administrativo denso, mas organizado.
- **Paleta:** carvão `#151614` e grafite para a base; marfim `#F2EEE6` para leitura; latão `#B78B55` como assinatura; ferrugem `#9A4D39` apenas para alertas e estados de atenção.
- **Composição:** cabeçalho compacto, abertura assimétrica com texto de um lado e foto do outro, faixas editoriais para serviços e agendamento em etapas; no admin, navegação lateral que vira navegação compacta em telas estreitas.
- **Elementos de assinatura:** linhas finas em latão; pequenos selos geométricos inspirados em lâminas; blocos de horário com seleção nítida e estados claros.
- **Interação:** fluxo de agendamento curto (serviço, data, horário, revisão); feedback explícito para pendência, confirmação e recusa; formulários com erro junto ao campo correspondente.
- **Animação:** transições rápidas de 150–220 ms em foco, seleção e menus; sem movimento contínuo nem animação que atrase o agendamento.
- **Tipografia:** títulos condensados em Oswald; interface e leitura em DM Sans; hierarquia por peso e espaçamento, sem usar caixa alta em textos longos.
- **Marca:** “BRUTUS CORTES”, com monograma B formado por dois traços semelhantes a lâminas paralelas. Cor própria: latão `#B78B55` sobre carvão.
- **Personalidade e voz:** direta, precisa e acolhedora. Exemplos: “Seu próximo corte começa com um horário.” e “Escolha o corte. A confirmação vem do cabeleireiro.”
- **Imagem planejada:** uma fotografia editorial original, em paisagem 16:9, para a abertura da página pública; enquadramento de um atendimento em cadeira de barbearia, luz quente e espaço negativo para o texto sobreposto no layout. Não incluir texto ou logotipo na imagem. Nenhuma imagem decorativa adicional será usada no painel.

## Referências técnicas consultadas

- O guia do Render descreve build/start commands e serviços Node/Express: [Deploy a Node Express App](https://render.com/docs/deploy-node-express-app).
- O esquema do Blueprint documenta serviços Node, `render.yaml` e variáveis do ambiente: [Blueprint YAML Reference](https://render.com/docs/blueprint-spec).
- O Render orienta manter credenciais fora do código e permite solicitar valores secretos no painel: [Environment Variables and Secrets](https://render.com/docs/configure-environment-variables).
- O Atlas requer endereço de conexão permitido e usuário de banco: [Connect to a Cluster via Client Libraries](https://www.mongodb.com/docs/atlas/driver-connection/). A lista de acesso deve ser restrita sempre que possível: [Configure IP Access List Entries](https://www.mongodb.com/docs/atlas/security/ip-access-list/).
