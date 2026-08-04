# Fit Journey

O **Fit Journey** é um aplicativo pessoal para organizar e acompanhar alimentação, hidratação, treinos e evolução de peso em um só lugar.

O painel inicial mostra o progresso das quatro áreas:

- Alimentação diária
- Água diária
- Treino semanal
- Meta de peso

> Os dados ficam salvos localmente no navegador. O aplicativo não possui conta, sincronização em nuvem ou envio automático de informações para outros dispositivos.

## Primeiros passos

Para começar a usar o aplicativo de forma organizada:

1. Configure sua meta de água e os atalhos de consumo.
2. Cadastre os pratos e monte o plano alimentar semanal.
3. Escolha a quantidade de treinos, organize a sequência e monte cada divisão.
4. Informe sua altura, peso atual e peso desejado.
5. Use o painel inicial para acompanhar o progresso de cada área.

## Painel inicial

A página inicial reúne quatro cartões de progresso. Clique em um cartão para abrir a área correspondente.

### Temas

Use o seletor **Tema** no cabeçalho para escolher:

- **Sistema:** acompanha automaticamente o tema claro ou escuro do dispositivo.
- **Claro:** visual neutro e luminoso.
- **Escuro:** superfícies escuras e contraste confortável em ambientes com pouca luz.
- **Colorido:** fundo e destaques em tons de roxo, rosa e azul.

**Sistema** é a opção padrão e reage a mudanças no dispositivo. Uma escolha manual fica salva no navegador e é reaplicada nas próximas visitas.

Os percentuais representam:

- **Alimentação:** proporção dos itens marcados no dia selecionado.
- **Água:** quantidade consumida em relação à meta diária.
- **Treino:** partes concluídas nos treinos ativos da semana.
- **Peso:** avanço entre o primeiro peso registrado e a meta definida.

## Alimentação

### Configurar a dieta

Abra **Alimentação diária** e selecione **Configurar dieta**.

#### Catálogo de pratos

Cadastre os alimentos ou pratos que serão reutilizados no plano semanal. Cada cadastro pode conter:

- Nome
- Unidade ou tipo de porção
- Calorias
- Observações
- URL de uma imagem

Os pratos podem ser editados ou excluídos posteriormente.

#### Plano semanal

Para montar o cardápio:

1. Escolha o dia da semana.
2. Escolha a refeição.
3. Selecione um prato do catálogo.
4. Informe a quantidade.
5. Clique em **Adicionar ao plano**.

Também é possível trocar duas refeições de posição no mesmo dia.

O botão **Gerar plano de hoje novamente** recria o dia atual com base no plano semanal. Use essa opção quando alterar o plano e quiser aplicar as mudanças ao dia atual.

### Acompanhar a alimentação

Na tela principal de alimentação:

- Use **Dia anterior**, **Próximo dia**, o seletor de data ou **Hoje** para navegar.
- Marque itens individuais conforme forem consumidos.
- Marque uma refeição inteira quando todos os itens dela tiverem sido realizados.
- A barra de progresso e o resumo são atualizados automaticamente.

## Hidratação

### Configurar a água

Em **Água diária**, abra **Configurar atalhos**.

É possível definir:

- A meta diária em mililitros.
- Os volumes dos botões de atalho, separados por vírgulas.

Exemplo de atalhos:

```text
220, 330, 500
```

A configuração também mostra o maior consumo registrado e a sequência de dias em que a meta foi atingida.

### Registrar o consumo

Na aba **Atual**:

- Use um botão de atalho para adicionar rapidamente um volume.
- Informe uma quantidade personalizada quando necessário.
- Edite ou exclua registros lançados incorretamente.
- Use **Reiniciar dia** para apagar os lançamentos do dia atual.

Clique em **Salvar no histórico** para registrar o total do dia no histórico mensal.

### Consultar o histórico

Na aba **Histórico**, os registros ficam agrupados por mês e indicam se o consumo:

- Ficou abaixo da meta.
- Atingiu exatamente a meta.
- Ultrapassou a meta.

Os totais históricos podem ser editados ou excluídos.

## Treinos

### Configuração inicial

Abra **Treino semanal**, acesse **Configurar treinos** e depois abra a página completa de configuração.

Ela é dividida em quatro abas:

- **Organizar**
- **Montar treino**
- **Biblioteca**
- **Compartilhar**

### Aba Organizar

Escolha entre **2 e 7 dias de treino por semana**.

Os treinos são armazenados em uma sequência de A até G:

- Os primeiros treinos da lista ficam ativos.
- Os demais ficam ocultos, mas continuam salvos.
- Arraste os treinos ou use **Subir** e **Descer** para alterar a ordem.
- Nome, cardio, exercícios e progresso acompanham o treino movido.
- As letras A, B, C etc. são recalculadas conforme a nova posição.

Exemplo: se existirem A, B, C e D, mas somente três dias forem necessários, mova os três treinos desejados para as primeiras posições. Eles serão apresentados como A, B e C.

Use os campos de identificação para dar nomes como:

- Peitoral
- Costas
- Pernas
- Corpo inteiro

### Aba Biblioteca

Cadastre os exercícios que poderão ser usados nas divisões. Um exercício pode conter:

- Nome
- Grupo muscular principal
- Músculos secundários
- Uma ou mais imagens, GIFs, vídeos ou links de demonstração
- Sugestões de substituição

Também é possível cadastrar modalidades de cardio.

Alterações feitas em um exercício da biblioteca são propagadas para os treinos que utilizam aquele cadastro.

Cada grupo muscular recebe uma cor consistente na biblioteca, na montagem da divisão e durante o treino. A borda do card representa o grupo principal; as etiquetas mostram também os grupos secundários. Grupos personalizados recebem uma cor estável automaticamente.

#### Importar exercícios por texto

Para cadastrar vários exercícios de uma vez:

1. Cole a lista no campo **Importar exercícios por texto**.
2. Confira a prévia dos itens reconhecidos.
3. Verifique o grupo muscular e a prescrição identificada.
4. Clique em **Adicionar à biblioteca**.

O importador aceita listas copiadas de documentos, mensagens ou planilhas e reconhece formatos como:

```text
Supino reto com halteres ou máquina    4×6–10    https://exemplo.com/halteres.gif    https://exemplo.com/maquina.gif
Remada baixa               3x8-12
Prancha                    3x30-60 segundos
Afundo búlgaro             3×8–12 por perna
```

Também são aceitos separadores como linhas, tabulações e ponto e vírgula. É possível informar vários links para o mesmo exercício, antes ou depois das séries e repetições.

Se um exercício já existir na biblioteca, novos links encontrados são acrescentados à galeria sem duplicar o exercício. Links repetidos são ignorados.

O grupo muscular é sugerido automaticamente pelo nome. Séries e repetições reconhecidas ficam salvas como padrão e são preenchidas ao selecionar o exercício na montagem do treino. Revise exercícios classificados como **Não informado** e edite o grupo quando necessário.

### Aba Montar treino

Escolha uma divisão e adicione:

- Blocos de cardio, com modalidade e duração.
- Exercícios de musculação, com séries, repetições e descanso.

Na prévia de cada divisão é possível:

- Editar cardio e exercícios.
- Alterar séries, repetições, descanso, carga e observações.
- Reordenar exercícios dentro do mesmo treino.
- Mover um exercício para outra divisão usando **Mover para...**.
- Remover blocos que não serão utilizados.

Ao mover um exercício para outro treino, suas informações e o progresso já registrado acompanham o exercício.

### Aba Compartilhar

Use essa aba para enviar sua divisão a amigos ou importar um treino recebido.

Para enviar:

1. Dê um nome ao plano.
2. Use **Enviar treino** para abrir o compartilhamento do celular ou dispositivo.
3. Se o compartilhamento direto não estiver disponível, use **Baixar arquivo** e envie o arquivo `.fitapp.json` como anexo.

O arquivo inclui somente os treinos ativos, seus nomes, exercícios, séries, repetições, descanso, cardio e todas as imagens e referências cadastradas na biblioteca. Cargas utilizadas, histórico e progresso semanal não são compartilhados.

Para receber:

1. Abra **Recebi um treino** e selecione o arquivo enviado.
2. Confira a prévia com a quantidade de treinos e exercícios.
3. Clique em **Confirmar e importar**.

A importação mantém a biblioteca existente, adiciona os exercícios novos, substitui a divisão atual e reinicia o acompanhamento da semana. Antes da alteração, o aplicativo pede uma confirmação.

### Realizar um treino

Na tela **Treino semanal**:

1. Escolha uma divisão ou use o treino sugerido ao abrir a página.
2. Marque os blocos de cardio realizados.
3. Clique em **Iniciar série** para abrir o cronômetro da execução.
4. Durante a série, use **Pausar**, **Retomar** ou **Reiniciar** quando necessário.
5. Clique em **Concluir série** somente depois de terminar as repetições; o descanso entre séries começará automaticamente.
6. O descanso pode ser pausado, retomado, reiniciado ou encerrado para começar a próxima série antes do tempo.
7. O contador usa o horário real e continua correto ao trocar de página, minimizar ou fechar e reabrir o aplicativo.
8. Clique em uma imagem ou GIF para ampliar a referência sem sair do aplicativo.
9. No visualizador, use os botões de anterior e próxima, as miniaturas ou as setas do teclado para navegar.
10. Abra os detalhes do exercício para consultar toda a galeria, registrar carga ou adicionar observações.

### Sugestão de progressão de carga

Nos detalhes do exercício, o aplicativo analisa a carga e o histórico registrado.

Antes de registrar, selecione o equipamento usado:

- **Máquina ou polia:** informe o peso indicado pelo equipamento.
- **Barra:** informe o peso total, incluindo a barra.
- **Halteres:** informe o peso de cada halter.
- **Outro:** use para elásticos, peso corporal com carga ou equipamentos diferentes.

As cargas e sugestões são separadas por equipamento. Portanto, o histórico de um supino na máquina não é comparado ao supino feito com barra ou halteres. Registros antigos permanecem no histórico como **Equipamento não identificado**.

- Aumento não é sugerido antes da conclusão de todas as séries.
- A mesma carga precisa aparecer em pelo menos duas sessões em dias diferentes.
- A sugestão usa um incremento conservador de **2,5%** para exercícios menores e **5%** para grandes grupos e membros inferiores.
- O valor é arredondado para passos de **0,5 kg**.
- Antes de aceitar, a pessoa deve ter alcançado o topo da faixa de repetições com técnica estável e sem dor.

O tempo desde o último registro é exibido, mas tempo sozinho não autoriza progressão. A recomendação é informativa e não substitui a orientação de um profissional.

Se um treino tiver apenas musculação, ele será apresentado somente como **Musculação**. Os termos “manhã/tarde” e “Parte 1/Parte 2” aparecem somente quando cardio e musculação coexistem.

### Modo imersivo

No treino selecionado, clique em **Iniciar modo imersivo** para abrir uma experiência em tela cheia.

Nesse modo:

- Somente o treino atual e seus exercícios ficam em destaque.
- Cardio, séries, descanso, carga e detalhes continuam funcionando normalmente.
- O progresso do treino aparece no topo.
- As mensagens de incentivo mudam conforme o treino avança.
- Uma mensagem especial é exibida quando tudo for concluído.

Use **Sair**, **Sair do modo imersivo** ou a tecla `Esc` para voltar à tela semanal.

### Próximo treino sugerido

Ao abrir novamente a página:

- Um treino incompleto continua selecionado.
- Se o treino selecionado já estiver concluído, o aplicativo apresenta o próximo treino configurado e incompleto.
- Divisões vazias e treinos concluídos são ignorados.
- A sequência funciona mesmo quando a pessoa treina em um dia extra ou diferente do planejamento.

### Trilha da semana

A trilha representa a semana atual, de segunda-feira a domingo.

Cada cartão mostra:

- Dia da semana e data.
- Letra e nome do treino.
- Estado atual.

Os estados são:

- **Pendente:** nenhuma atividade foi iniciada.
- **Parcial:** algum cardio ou alguma série foi realizado.
- **Concluído:** tudo que está cadastrado naquele treino foi finalizado.

A regra funciona para treino somente de musculação, somente de cardio ou com as duas partes.

Quando uma nova semana começa, o acompanhamento é renovado automaticamente. Essa renovação:

- Zera apenas as marcações de progresso semanal.
- Mantém exercícios, nomes, ordem e quantidade de treinos.

O botão **Reiniciar semana** permite zerar manualmente o acompanhamento da semana atual.

### Preferências de exibição

Na aba **Configurar treinos** da tela semanal, é possível:

- Escolher entre informações compactas ou detalhadas.
- Unir cardio e musculação em uma única lista.

## Peso e IMC

### Configurar a meta

Em **Meta de peso**, abra **Configurar meta** para informar:

- Altura em metros.
- Peso desejado em quilogramas.

Também é possível registrar um peso para uma data específica.

### Acompanhar o peso

Na tela principal:

- Registre o peso atual.
- Consulte o IMC calculado.
- Veja a variação média, a mudança desde o início e o menor peso.
- Acompanhe o gráfico de evolução.
- Edite ou exclua registros incorretos.

> O IMC e os indicadores do aplicativo são informativos e não substituem avaliação médica ou nutricional.

## Armazenamento e privacidade

O Fit Journey usa o `localStorage` do navegador.

Isso significa que:

- Os dados permanecem disponíveis ao fechar e abrir o navegador.
- Cada navegador e dispositivo possui seus próprios dados.
- Limpar os dados do site ou o armazenamento do navegador pode apagar todas as informações.
- Não existe recuperação automática, conta de usuário ou backup em nuvem.

Para preservar os registros, evite limpar os dados do site sem antes criar uma forma de backup.

## Ações que apagam progresso

Use com atenção:

- **Reiniciar dia:** apaga os registros de água do dia atual.
- **Reiniciar semana:** apaga o progresso dos treinos da semana atual.
- **Excluir:** remove o item selecionado do catálogo ou histórico.
- **Gerar plano de hoje novamente:** recria a alimentação do dia usando o plano semanal atual.

## Executar o projeto localmente

### Requisitos

- Node.js compatível com Vite 7.
- npm.

### Instalação

```bash
npm install
```

### Ambiente de desenvolvimento

```bash
npm run dev
```

Abra no navegador o endereço exibido pelo Vite.

### Compilar para produção

```bash
npm run build
```

Os arquivos compilados serão gerados em `dist/`.

### Visualizar a compilação

```bash
npm run preview
```

### Verificar o código

```bash
npm run lint
```

## Tecnologias

- React
- TypeScript
- Vite
- React Router
- Zustand
- Zod
- Recharts
- CSS responsivo

## Estrutura principal

```text
src/
├── app/          # Rotas
├── components/   # Componentes compartilhados
├── features/
│   ├── diet/     # Alimentação
│   ├── home/     # Painel inicial
│   ├── training/ # Treinos
│   ├── water/    # Hidratação
│   └── weight/   # Peso e IMC
└── lib/          # Persistência e utilitários
```

## Escopo atual

O aplicativo armazena os dados localmente no navegador. Autenticação, sincronização automática entre dispositivos e backup em nuvem ainda não fazem parte da versão atual. Os treinos podem ser exportados e compartilhados manualmente pela aba **Compartilhar**.
