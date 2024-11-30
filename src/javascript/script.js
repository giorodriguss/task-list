document.addEventListener("DOMContentLoaded", () => {
    carregarTarefas();
});

document.querySelectorAll('.card').forEach(card => {

    // Evento disparado quando começa a arrastar um card
    card.addEventListener('dragstart', e => {
        e.currentTarget.classList.add('dragging');
    });

    // Evento disparado quando termina de arrastar o card
    card.addEventListener('dragend', e => {
        e.currentTarget.classList.remove('dragging');
    });
});

    // Adiciona um evento 'dragover' a cada coluna
    document.querySelectorAll('.to-do-cards').forEach(column => {
    column.addEventListener('dragover', e => {
        e.preventDefault();
        e.currentTarget.classList.add('cards-hover');
    });

    // Adiciona um evento 'dragleave' a cada coluna
    column.addEventListener('dragleave', e => {
        e.currentTarget.classList.remove('cards-hover');
    });

    // Evento disparado quando o card é solto (drop) dentro da coluna e move o card arrastado para a coluna onde foi solto

    column.addEventListener('drop', e => {
        e.currentTarget.classList.remove('cards-hover');
        const dragCard = document.querySelector('.card.dragging');
        
        e.currentTarget.appendChild(dragCard);
    });

    // Implementando o modal para criar uma tarefa

// Selecionando os elementos do modal e do formulário
const button_criar = document.querySelector(".add-card");
const modal_criar = document.querySelector("#dialog-create-task");
const fechar_modal = document.querySelector(".fechar-modal");
const form_criar = document.querySelector("#form-create-task");

button_criar.onclick = function () {
    modal_criar.showModal(); 
};

fechar_modal.onclick = function () {
    modal_criar.close(); 
};

// Adicionando aviso de custo elevado (igual ou maior que mil) aos cards
function atualizarBadge(custo) {

    const badgeHigh = document.querySelector(".badge.high");
    const badgeNormal = document.querySelector(".badge.normal");

    // Verifica o custo e exibe o badge correspondente
    if (custo >= 1000) {
        badgeHigh.classList.add("visible");  
        badgeNormal.classList.remove("visible");  
    } else {
        badgeNormal.classList.add("visible");  
        badgeHigh.classList.remove("visible");  
    }
}


// Manipulando o envio do formulário
form_criar.onsubmit = function (event) {
    event.preventDefault();

   
    const nome = document.querySelector("#nome").value;
    const custo = parseFloat(document.querySelector("#custo").value);
    const dataExp = document.querySelector("#data-limite").value;

    // Envia os dados para o servidor usando Fetch API
    fetch("http://localhost:3000/tarefas", { 
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nome: nome,
            custo: custo,
            dataExp: dataExp
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            alert("Tarefa criada com sucesso!");
            modal_criar.close();
            carregarTarefas();
            atualizarBadge(custo); 

        } else {
            alert("Erro ao criar tarefa.");
        }
    })
};
});

// Função para criar o card de tarefa
function criarCardTarefa(tarefa) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.setAttribute('data-id', tarefa.id);
    card.setAttribute('draggable', 'true'); // Tornar o card arrastável com a função drag-and-drop

    // Conteúdo do card
    card.innerHTML = `
     <div class="card" data-id="${tarefa.id}">
        <div class="card-content">
            <div class="card-infos">
                <p>${new Date(tarefa.dataExp).toLocaleString()}</p>
                <p>ID: ${tarefa.id}</p>
            </div>
            <div class="card-buttons">
                <button class="button-edit" title="Editar"> 
                <i class="fa-solid fa-pencil"></i>
                </button>
                <button class="button delete" title="Excluir" onclick="excluirTarefa(${tarefa.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
        <p class="card-title">${tarefa.nome}</p>
        <div class="card-price">
            <div class="badge ${tarefa.custo >= 1000 ? 'high' : 'normal'}">
                <span>${tarefa.custo >= 1000 ? 'Custo elevado' : 'Custo normal'}</span>
            </div>
            <p class="value">R$ ${tarefa.custo}</p>
        </div>
    `;

    // Adicionar eventos de drag-and-drop
    card.addEventListener('dragstart', e => {
        e.currentTarget.classList.add('dragging');
    });

    card.addEventListener('dragend', e => {
        e.currentTarget.classList.remove('dragging');
    });

    return card;
}

function excluirTarefa(id) {
    if (!confirm('Você tem certeza que deseja excluir esta tarefa?')) {
        return;
    }

    fetch(`http://localhost:3000/tarefas/${id}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao excluir a tarefa.');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message || 'Tarefa excluída com sucesso.');
        

        const card = document.querySelector(`.card[data-id="${id}"]`);
        if (card) {
            card.remove();
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Não foi possível excluir a tarefa.');
    });
}

// Selecionando os elementos do modal e do formulário de edição
const modal_editar = document.querySelector("#dialog-edit-task");
const fechar_modal = document.querySelector(".fechar-edit");
let tarefaAtual = null;  // Variável para armazenar a tarefa que está sendo editada

document.addEventListener("click", (event) => {
    if (event.target.closest(".button-edit")) {
        // Obter o ID da tarefa a ser editada
        const idTarefa = event.target.closest(".card").getAttribute("data-id");
        console.log("ID da tarefa:", idTarefa);  // Verifique se o ID está correto

        // Buscar dados da tarefa para editar
        fetch(`http://localhost:3000/tarefas/${idTarefa}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Falha ao carregar tarefa');
                }
                return response.json();
            })
            .then(tarefa => {
                tarefaAtual = tarefa;  // Armazena os dados da tarefa para uso posterior

                // Preenche os campos do modal com os dados da tarefa
                document.querySelector("#edit-nome").value = tarefa.nome;
                document.querySelector("#edit-custo").value = tarefa.custo;
                document.querySelector("#edit-data-limite").value = tarefa.dataExp.split('T')[0];

                // Exibe o modal
                modal_editar.showModal();
            })
            .catch(error => {
                console.error('Erro ao carregar tarefa para edição:', error);
            });
    }
});

// Fechar o modal quando o botão de fechar for clicado
fechar_modal.onclick = () => {
    modal_editar.close();
};

// Lógica do envio do formulário de edição
const form_editar = document.querySelector("#form-edit-task");

form_editar.onsubmit = function (event) {
    event.preventDefault();

    // Obter os novos valores dos campos de edição
    const nome = document.querySelector("#edit-nome").value;
    const custo = parseFloat(document.querySelector("#edit-custo").value);
    const dataExp = document.querySelector("#edit-data-limite").value;

    // Enviar as alterações para o servidor
    fetch(`http://localhost:3000/tarefas/${tarefaAtual.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nome: nome,
            custo: custo,
            dataExp: dataExp
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            alert("Tarefa editada com sucesso!");
            modal_editar.close();  // Fecha o modal após a edição
            carregarTarefas();  // Recarrega a lista de tarefas (você pode adaptar conforme necessário)
        } else {
            alert("Erro ao editar tarefa.");
        }
    })
    .catch(error => {
        console.error('Erro ao editar tarefa:', error);
        alert('Não foi possível editar a tarefa.');
    });
};



// Função para carregar as tarefas
function carregarTarefas() {
    fetch("http://localhost:3000/tarefas")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(tarefas => {
            console.log("Tarefas recebidas:", tarefas); // Log para depuração

            if (Array.isArray(tarefas)) {
                const coluna = document.querySelector(".to-do-cards");
                
                // Limpa a coluna antes de adicionar novas tarefas
                coluna.innerHTML = "";

                tarefas.forEach(tarefa => {
                    console.log("Criando card para tarefa:", tarefa); // Log para depuração
                    const tarefaElement = criarCardTarefa(tarefa);
                    coluna.appendChild(tarefaElement);
                });
            } else {
                throw new Error("Formato de resposta inválido. Esperado um array de tarefas.");
            }
        })
        .catch(error => {
            console.error("Erro ao carregar tarefas:", error);
            alert("Erro ao carregar tarefas. Verifique o console para mais detalhes.");
        });
}


document.addEventListener("DOMContentLoaded", () => {
    carregarTarefas();
});
