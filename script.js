const nos = {
    'Base': { x: 60, y: 200, label: 'Base' },
    'Centro': { x: 190, y: 90, label: 'Centro' },
    'Parque': { x: 190, y: 200, label: 'Parque' },
    'Rodoviária': { x: 190, y: 310, label: 'Rodoviária' },
    'Aeroporto': { x: 70, y: 350, label: 'Aeroporto' },
    'Shopping': { x: 370, y: 80, label: 'Shopping' },
    'Universidade': { x: 370, y: 190, label: 'Universidade' },
    'Terminal': { x: 370, y: 310, label: 'Terminal' },
    'Ponte': { x: 490, y: 130, label: 'Ponte' },
    'Hospital': { x: 590, y: 200, label: 'Hospital' }
};

const conexoes = [
    ['Base', 'Centro'], ['Base', 'Parque'], ['Base', 'Rodoviária'],
    ['Centro', 'Shopping'], ['Centro', 'Universidade'], ['Centro', 'Parque'],
    ['Rodoviária', 'Terminal'], ['Rodoviária', 'Aeroporto'],
    ['Parque', 'Terminal'], ['Parque', 'Universidade'],
    ['Shopping', 'Ponte'], ['Shopping', 'Hospital'],
    ['Universidade', 'Ponte'], ['Ponte', 'Hospital'], ['Terminal', 'Hospital']
];

// Cria um obj para saber os vizinhos
const grafo = {};

// Para cada cidade prepara uma lista vazia
Object.keys(nos).forEach(n => grafo[n] = []);

// Olha estrada por estrada e anota os dois lugares como vizinhos um do outro
conexoes.forEach(([u, v]) => {
    grafo[u].push(v); // Coloca a cidade v na lista de vizinhos da cidade u
    grafo[v].push(u); // Coloca a cidade u na lista de vizinhos da cidade v
});

const heuristicas = {

    original: {
        'Base': 20, 'Centro': 14, 'Rodoviária': 5, 'Parque': 12,
        'Shopping': 10, 'Universidade': 9, 'Terminal': 8, 'Ponte': 4,
        'Aeroporto': 2, 'Hospital': 0
    },

    modificada: {
        'Base': 20, 'Centro': 6, 'Rodoviária': 15, 'Parque': 10,
        'Shopping': 3, 'Universidade': 8, 'Terminal': 12, 'Ponte': 4,
        'Aeroporto': 18, 'Hospital': 0
    }
};

// Pega a tela de desenho onde vamos pintar o mapa.
const svg = document.getElementById('svg-graph');

// Guarda a memoria do sistema da busca a cada segundo
let state = null;

function desenhar() {
    // Apaga tudo o que estava desenhado antes para começar do zero
    svg.innerHTML = '';

    // Ve qual opção de distância está escolhida no menu
    const h = heuristicas[document.getElementById('sel-heuristica').value];

    // Desenha as linhas das estradas
    conexoes.forEach(([u, v]) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', nos[u].x); // Começo da linha 
        line.setAttribute('y1', nos[u].y);
        line.setAttribute('x2', nos[v].x); // Fim da linha 
        line.setAttribute('y2', nos[v].y);
        line.setAttribute('class', 'edge');
        line.setAttribute('id', `edge-${u}-${v}`); // Nome da estrada
        svg.appendChild(line); // Põe a linha na tela
    });

    // Desenha as bolinhas e os nomes das cidades
    Object.keys(nos).forEach(n => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // Faz o círculo da cidade
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', nos[n].x);
        circle.setAttribute('cy', nos[n].y);
        circle.setAttribute('r', 25);
        circle.setAttribute('class', 'node-circle');
        circle.setAttribute('id', `circle-${n}`);

        // Escreve o nome da cidade
        const textLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textLabel.setAttribute('x', nos[n].x);
        textLabel.setAttribute('y', nos[n].y - 3);
        textLabel.setAttribute('class', 'node-label');
        textLabel.textContent = nos[n].label;

        // Escreve o valor do h(n) embaixo do nome
        const textH = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textH.setAttribute('x', nos[n].x);
        textH.setAttribute('y', nos[n].y + 13);
        textH.setAttribute('class', 'node-h');
        textH.textContent = `h=${h[n]}`;

        // Junta o círculo e os textos no mesmo pacote e joga na tela
        g.appendChild(circle);
        g.appendChild(textLabel);
        g.appendChild(textH);
        svg.appendChild(g);
    });
}

function reset() {
    const tipo = document.getElementById('sel-heuristica').value;

    // Reinicia todo o mapa
    state = {
        h: heuristicas[tipo],            
        disponiveis: ['Base'],           
        visitados: new Set(),            
        expandidos: [],                  
        ordemVisita: [],                 
        predecessores: { 'Base': null }, 
        passo: 1,                        
        concluido: false,                
        caminho: []                     
    };

    // Desenha o mapa limpinho de novo
    desenhar();

    // Limpa as mensagens de texto da tela
    document.getElementById('log-list').innerHTML = '';
    document.getElementById('step-label').textContent = 'Passo 0';
    document.getElementById('status-badge').textContent = 'Pronto para busca';
    document.getElementById('status-badge').style.color = 'var(--warning)';
    document.getElementById('res-resumo').innerHTML = 'Clique em Executar ou Passo a Passo.';
}

function passo() {
    // Não faz nada se ja começou ou não
    if (!state || state.concluido) return;

    // Coloca na frente quem tem menor h(n)
    // Desempata por ordem alfabetica
    state.disponiveis.sort((a, b) => {
        if (state.h[a] !== state.h[b]) return state.h[a] - state.h[b];
        return a.localeCompare(b);
    });

    // A fila para se não tiver ninguem
    if (state.disponiveis.length === 0) return;

    // Tira a primeira cidade da fila para visitar agora
    const atual = state.disponiveis.shift();

    // Guarda que visitou essa cidade agora
    state.ordemVisita.push(atual);
    state.visitados.add(atual);

    // Pinta a bolinha dessa cidade para mostrar que estamos nela agora
    const circle = document.getElementById(`circle-${atual}`);
    if (circle) circle.className.baseVal = 'node-circle current';

    // Chegou no hospital 🦭
    if (atual === 'Hospital') {
        state.concluido = true; 

        // Volta de trás para frente seguindo quem descobriu quem até a Base
        let c = 'Hospital';
        while (c) {
            state.caminho.unshift(c); // Guarda no começo da lista do caminho
            c = state.predecessores[c]; // Olha quem chamou essa cidade
        }

        // Pinta as bolinhas do caminho certo com a cor de vitoria
        state.caminho.forEach(n => {
            const el = document.getElementById(`circle-${n}`);
            if (el) el.className.baseVal = 'node-circle path';
        });

        // Acende as linhas das estradas que formam o trajeto final
        for (let i = 0; i < state.caminho.length - 1; i++) {
            const u = state.caminho[i], v = state.caminho[i + 1];
            const l1 = document.getElementById(`edge-${u}-${v}`);
            const l2 = document.getElementById(`edge-${v}-${u}`);
            if (l1) l1.classList.add('highlight');
            if (l2) l2.classList.add('highlight');
        }

        // Avisa na tela que deu tudo certo
        document.getElementById('status-badge').textContent = 'Objetivo Alcançado!';
        document.getElementById('status-badge').style.color = 'var(--success)';

        const item = document.createElement('div');
        item.className = 'log-item done';
        item.innerHTML = `<strong>✔ Hospital Central alcançado com sucesso!</strong>`;
        document.getElementById('log-list').appendChild(item);

        // Mostra o resumo dos numeros pedidos
        document.getElementById('res-resumo').innerHTML = `
                    <b>Caminho Solução:</b> <span style="color:#34d399">${state.caminho.join(' ➔ ')}</span><br>
                    <b>Ordem de Visita:</b> ${state.ordemVisita.join(' ➔ ')}<br>
                    <b>Qtd. Visitados:</b> ${state.ordemVisita.length} | <b>Qtd. Expandidos:</b> ${state.expandidos.length}
                `;
        return;
    }

  
    state.expandidos.push(atual); // Marca que olhou todos os vizinhos daqui
    const novos = [];

    (grafo[atual] || []).forEach(v => {
        // So coloca na fila se nunca foi visitado e ainda não estiver na fila esperando
        if (!state.visitados.has(v) && !state.disponiveis.includes(v)) {
            novos.push(v);
            state.disponiveis.push(v); // Põe o vizinho na fila de espera
            state.predecessores[v] = atual; // Anota quem foi o pai/descobridor dele
        }
    });

    // Se for o Aeroporto, pinta diferente porque não tem saida
    if (atual === 'Aeroporto') {
        circle.className.baseVal = 'node-circle deadend';
    }

    // Organiza a fila de novo para ver quem ficou em 1 lugar
    state.disponiveis.sort((a, b) => {
        if (state.h[a] !== state.h[b]) return state.h[a] - state.h[b];
        return a.localeCompare(b);
    });

    // Vê o nome do próximo da fila só para mostrar na caixinha de texto
    const proximo = state.disponiveis.length > 0
        ? `${state.disponiveis[0]} (h=${state.h[state.disponiveis[0]]})`
        : "Nenhum";

    // Escreve a historinha do passo na caixinha lateral
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    logItem.innerHTML = `
                <b>Passo ${state.passo}:</b> Olhou vizinhos de <b>${atual} (h=${state.h[atual]})</b><br>
                • Vizinhos novos: [ ${novos.length ? novos.map(x => `${x} h=${state.h[x]}`).join(', ') : '<span style="color:#ef4444">Beco sem saída</span>'} ]<br>
                • Fila de espera: [ ${state.disponiveis.map(x => `${x} (h=${state.h[x]})`).join(', ')} ]<br>
                • Próximo a sair da fila: <b style="color:#60a5fa">${proximo}</b>
            `;
    const box = document.getElementById('log-list');
    box.appendChild(logItem);
    box.scrollTop = box.scrollHeight; // Desce o texto para ver a ultima linha

    // Aumenta o número do passo
    document.getElementById('step-label').textContent = `Passo ${state.passo}`;
    state.passo++;
}

// Se mudar a rota, reinicia
document.getElementById('sel-heuristica').addEventListener('change', reset);

// Se clicar no botão reiniciar, reinicia ._.
document.getElementById('btn-reset').addEventListener('click', reset);

// Vai um de cada vez
document.getElementById('btn-step').addEventListener('click', passo);

// Vai tudo de uma vez
document.getElementById('btn-run').addEventListener('click', () => {
    if (!state || state.concluido) reset();

    const timer = setInterval(() => {
        if (!state || state.concluido) clearInterval(timer); 
        else passo();
    }, 600);
});

// Começa o mapa e o sistema assim que a pagina abre
reset();