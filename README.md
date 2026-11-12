# Jogos

Este repositório tem dois jogos feitos em HTML5 + JavaScript puro, sem dependências nem etapa de build. Basta abrir o `index.html` de cada um no navegador.

| Jogo | Gênero | Como abrir |
|---|---|---|
| **O Farol de Cinzas** | RPG por turnos | `index.html` (raiz) |
| **Vale dos Monstrinhos** | Fazenda, vida no campo e monstrinhos | `vale-dos-monstrinhos/index.html` |

---

# O Farol de Cinzas

Um RPG de turnos em pixel art, feito inteiramente em HTML5 + JavaScript puro (sem bibliotecas e sem etapa de build).

> Por mil anos, a Chama Eterna do Grande Farol manteve a Névoa Vazia longe das Terras de Cinzaluz.
> Numa noite sem lua, a chama se apagou — e das cinzas surgiu **Tição**, um filhote com uma máscara de caveira e um olho de brasa.

Lia, a aprendiz do farol, precisa reunir as quatro **Brasas Primordiais**, descobrir por que o velho faroleiro Aurélio sumiu e reacender a chama.

## Como jogar

Abra o arquivo `index.html` em qualquer navegador moderno (dois cliques já bastam, não precisa de servidor).

| Ação | Teclado | Toque (celular) |
|---|---|---|
| Andar / navegar | Setas ou WASD | Direcional |
| Confirmar / falar / examinar | Z, Enter ou Espaço | Botão Z |
| Voltar / abrir o menu | X, Esc ou Backspace | Botão X |
| Correr | Segurar Shift (ou ativar "Correr sempre" nas opções) | Botão Correr |
| Ligar/desligar som | M | Botão Som |

O jogo salva no navegador (fogueiras e menu → Salvar). O objetivo atual fica sempre anotado no menu.

## O que tem no jogo

- **Duração:** cerca de 2 horas para a história principal, um pouco mais com as missões secundárias.
- **4 personagens jogáveis:** Lia (espadachim), Tição (espírito de chama, magia de fogo/sombra), Nara (curandeira) e Bento (ferreiro, tanque).
- **Batalhas por turnos** com fraquezas elementais (fogo, gelo, raio, natureza, luz, sombra), estados (veneno, queimadura, sono, atordoamento, silêncio), buffs e debuffs, ataques carregados que você pode antecipar defendendo, e opção de tentar a batalha de novo ao perder.
- **8 chefes** (incluindo um chefe secreto opcional), mais de 35 tipos de inimigos e ~45 habilidades.
- **24 mapas:** vila, campos, floresta, minas, charco, montanha e a torre final.
- **Quebra-cabeças:** pedras e alavancas, lanternas no charco, gelo escorregadio (verificado por um solucionador para não ter becos sem saída) e um labirinto no escuro.
- **5 missões secundárias**, lojas que ganham estoque novo a cada capítulo, equipamento com comparação de atributos.
- **Trilha sonora chiptune original** e efeitos sonoros gerados em tempo real (WebAudio).
- Toda a arte em pixel (tiles, personagens, monstros, ícones) é gerada por código. A arte do Tição na tela de título e nos diálogos vem da imagem enviada para o repositório.

## Estrutura

```
index.html        página do jogo (canvas + controles de toque)
assets/ticao.png  arte do Tição (recortada a partir da imagem original)
js/engine.js      entrada, cenas, texto, janelas
js/audio.js       sintetizador de música e efeitos
js/gfx.js         arte procedural: tiles, personagens, monstros, ícones
js/data.js        habilidades, itens, equipamentos, heróis, inimigos, lojas
js/state.js       heróis, inimigos em batalha, inventário, salvar/carregar
js/ui.js          caixas de diálogo, escolhas, listas
js/world.js       mapas, movimento, entidades, quebra-cabeças, API de roteiro
js/battle.js      sistema de batalha e IA dos chefes
js/menu.js        menu, lojas, título, derrota, créditos
js/mapkit.js      construtor de mapas, missões e objetivo atual
js/maps.js        mapas e história (parte 1)
js/maps2.js       mapas e história (parte 2)
js/main.js        inicialização e laço principal
```

---

# Vale dos Monstrinhos

Um jogo de fazenda e vida no campo em pixel art: você herda o sítio da Vó Lurdes num vale onde vivem monstrinhos. Cultive a terra, faça amizade com os moradores e com os monstrinhos, desça na caverna e devolva o brilho à Árvore-Lua.

Abra `vale-dos-monstrinhos/index.html` no navegador.

| Ação | Teclado | Toque (celular) |
|---|---|---|
| Andar | Setas ou WASD | Direcional |
| Usar ferramenta / falar / interagir | Z, Espaço ou Enter (segure para repetir) | Botão Z |
| Abrir o menu / voltar | X, Esc ou I | Botão X |
| Trocar item da barra | Q / E ou teclas 1 a 8 | Botões Q◀ / ▶E |
| Som | M | Botão Som |

O jogo salva quando você dorme na cama da casa.

**O que tem no jogo**
- **Sítio:** cave, plante, regue e colha 13 cultivos em 4 estações de 7 dias. Venda pela caixa de envio, que paga na manhã seguinte.
- **Monstrinhos:** 7 espécies para fazer amizade (com Biscoito Monstro ou a comida favorita, uma vez por dia). No curral, a Gotinha rega, o Brotinho faz as plantas crescerem, o Pedregulho limpa o terreno e os outros produzem ovos, lã, cogumelos e brasas. Eles precisam de ração no cocho e gostam de carinho.
- **Vila Bruma:** 6 moradores com rotina ao longo do dia, conversas, presentes e corações de amizade. Tem a loja de sementes da Dona Flor e a ferraria do Seu Malho, que melhora as ferramentas e reforma o curral.
- **Caverna Brumosa:** 20 andares gerados na hora, com minérios, gemas, monstros com bolor, combate em tempo real e o chefe Rei Bolor no fundo.
- **Também:** pesca com um minijogo de ritmo em três lugares, receitas, baú, habilidades que sobem de nível, clima (sol, chuva, neve) e ciclo de dia e noite.
- **Objetivo principal:** entregar as quatro oferendas no altar da Árvore-Lua e levar até ela o Coração de Bolor. O jogo continua depois do final.

**Estrutura** (`vale-dos-monstrinhos/js/`): `core.js` (engine), `audio.js` + `music.js` (som), `artbase.js` + `art.js` (arte em pixel), `data.js` (itens, cultivos, monstros, moradores), `state.js` (estado e salvamento), `maps.js` (mapas e gerador da caverna), `world.js` (jogabilidade), `render.js` (desenho e HUD), `uibase.js` + `ui.js` (menus e telas), `main.js` (inicialização).

Para gerar um arquivo único de qualquer um dos jogos: `python3 tools/build_single.py --src=vale-dos-monstrinhos` (sem `--src` gera O Farol de Cinzas).
