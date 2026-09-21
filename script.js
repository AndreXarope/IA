
        const nos = {
            'Base':         { x: 60,  y: 200, label: 'Base' },
            'Centro':       { x: 190, y: 90,  label: 'Centro' },
            'Parque':       { x: 190, y: 200, label: 'Parque' },
            'Rodoviária':   { x: 190, y: 310, label: 'Rodoviária' },
            'Aeroporto':    { x: 70,  y: 350, label: 'Aeroporto' },
            'Shopping':     { x: 370, y: 80,  label: 'Shopping' },
            'Universidade': { x: 370, y: 190, label: 'Universidade' },
            'Terminal':     { x: 370, y: 310, label: 'Terminal' },
            'Ponte':        { x: 490, y: 130, label: 'Ponte' },
            'Hospital':     { x: 590, y: 200, label: 'Hospital' }
        };

        
        const conexoes = [
            ['Base', 'Centro'], ['Base', 'Parque'], ['Base', 'Rodoviária'],
            ['Centro', 'Shopping'], ['Centro', 'Universidade'], ['Centro', 'Parque'],
            ['Rodoviária', 'Terminal'], ['Rodoviária', 'Aeroporto'],
            ['Parque', 'Terminal'], ['Parque', 'Universidade'],
            ['Shopping', 'Ponte'], ['Shopping', 'Hospital'],
            ['Universidade', 'Ponte'], ['Ponte', 'Hospital'], ['Terminal', 'Hospital']
        ];

        const grafo = {};
        Object.keys(nos).forEach(n => grafo[n] = []);
        conexoes.forEach(([u, v]) => { grafo[u].push(v); grafo[v].push(u); });

       
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

        const svg = document.getElementById('svg-graph');
        let state = null;

        function desenhar() {
            svg.innerHTML = '';
            const h = heuristicas[document.getElementById('sel-heuristica').value];

            // Arestas
            conexoes.forEach(([u, v]) => {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', nos[u].x); line.setAttribute('y1', nos[u].y);
                line.setAttribute('x2', nos[v].x); line.setAttribute('y2', nos[v].y);
                line.setAttribute('class', 'edge');
                line.setAttribute('id', `edge-${u}-${v}`);
                svg.appendChild(line);
            });

            Object.keys(nos).forEach(n => {
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', nos[n].x); circle.setAttribute('cy', nos[n].y);
                circle.setAttribute('r', 25);
                circle.setAttribute('class', 'node-circle');
                circle.setAttribute('id', `circle-${n}`);

                const textLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                textLabel.setAttribute('x', nos[n].x); textLabel.setAttribute('y', nos[n].y - 3);
                textLabel.setAttribute('class', 'node-label');
                textLabel.textContent = nos[n].label;

                const textH = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                textH.setAttribute('x', nos[n].x); textH.setAttribute('y', nos[n].y + 13);
                textH.setAttribute('class', 'node-h');
                textH.textContent = `h=${h[n]}`;

                g.appendChild(circle); g.appendChild(textLabel); g.appendChild(textH);
                svg.appendChild(g);
            });
        }

        function reset() {
            const tipo = document.getElementById('sel-heuristica').value;
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
            desenhar();
            document.getElementById('log-list').innerHTML = '';
            document.getElementById('step-label').textContent = 'Passo 0';
            document.getElementById('status-badge').textContent = 'Pronto para busca';
            document.getElementById('status-badge').style.color = 'var(--warning)';
            document.getElementById('res-resumo').innerHTML = 'Clique em Executar ou Passo a Passo.';
        }

        function passo() {
            if (!state || state.concluido) return;

            state.disponiveis.sort((a, b) => {
                if (state.h[a] !== state.h[b]) return state.h[a] - state.h[b];
                return a.localeCompare(b);
            });

            if (state.disponiveis.length === 0) return;

            const atual = state.disponiveis.shift();
            state.ordemVisita.push(atual);
            state.visitados.add(atual);

            const circle = document.getElementById(`circle-${atual}`);
            if (circle) circle.className.baseVal = 'node-circle current';

            if (atual === 'Hospital') {
                state.concluido = true;
                let c = 'Hospital';
                while (c) {
                    state.caminho.unshift(c);
                    c = state.predecessores[c];
                }

                state.caminho.forEach(n => {
                    const el = document.getElementById(`circle-${n}`);
                    if (el) el.className.baseVal = 'node-circle path';
                });

                for (let i = 0; i < state.caminho.length - 1; i++) {
                    const u = state.caminho[i], v = state.caminho[i + 1];
                    const l1 = document.getElementById(`edge-${u}-${v}`);
                    const l2 = document.getElementById(`edge-${v}-${u}`);
                    if (l1) l1.classList.add('highlight');
                    if (l2) l2.classList.add('highlight');
                }

                document.getElementById('status-badge').textContent = 'Objetivo Alcançado!';
                document.getElementById('status-badge').style.color = 'var(--success)';

                const item = document.createElement('div');
                item.className = 'log-item done';
                item.innerHTML = `<strong>✔ Hospital Central alcançado com sucesso!</strong>`;
                document.getElementById('log-list').appendChild(item);

                document.getElementById('res-resumo').innerHTML = `
                    <b>Caminho Solução:</b> <span style="color:#34d399">${state.caminho.join(' ➔ ')}</span><br>
                    <b>Ordem de Visita:</b> ${state.ordemVisita.join(' ➔ ')}<br>
                    <b>Qtd. Visitados:</b> ${state.ordemVisita.length} | <b>Qtd. Expandidos:</b> ${state.expandidos.length}
                `;
                return;
            }

            
            state.expandidos.push(atual);
            const novos = [];
            (grafo[atual] || []).forEach(v => {
                if (!state.visitados.has(v) && !state.disponiveis.includes(v)) {
                    novos.push(v);
                    state.disponiveis.push(v);
                    state.predecessores[v] = atual;
                }
            });

            
            if (atual === 'Aeroporto') {
                circle.className.baseVal = 'node-circle deadend';
            }

            state.disponiveis.sort((a, b) => {
                if (state.h[a] !== state.h[b]) return state.h[a] - state.h[b];
                return a.localeCompare(b);
            });

            const proximo = state.disponiveis.length > 0 
                ? `${state.disponiveis[0]} (h=${state.h[state.disponiveis[0]]})` 
                : "Nenhum";

            const logItem = document.createElement('div');
            logItem.className = 'log-item';
            logItem.innerHTML = `
                <b>Passo ${state.passo}:</b> Expandido <b>${atual} (h=${state.h[atual]})</b><br>
                • Novos: [ ${novos.length ? novos.map(x => `${x} h=${state.h[x]}`).join(', ') : '<span style="color:#ef4444">Beco sem saída</span>'} ]<br>
                • Disponíveis: [ ${state.disponiveis.map(x => `${x} (h=${state.h[x]})`).join(', ')} ]<br>
                • Próximo: <b style="color:#60a5fa">${proximo}</b>
            `;
            const box = document.getElementById('log-list');
            box.appendChild(logItem);
            box.scrollTop = box.scrollHeight;

            document.getElementById('step-label').textContent = `Passo ${state.passo}`;
            state.passo++;
        }

        // Eventos
        document.getElementById('sel-heuristica').addEventListener('change', reset);
        document.getElementById('btn-reset').addEventListener('click', reset);
        document.getElementById('btn-step').addEventListener('click', passo);
        document.getElementById('btn-run').addEventListener('click', () => {
            if (!state || state.concluido) reset();
            const timer = setInterval(() => {
                if (!state || state.concluido) clearInterval(timer);
                else passo();
            }, 600);
        });

        reset();