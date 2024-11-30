const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const corsOptions = {
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
};
app.use(cors(corsOptions)); 
app.use(bodyParser.json());

const db = mysql.createConnection({
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST 
});

db.connect(err => {
    if (err) throw err;
    console.log("Conectado ao banco de dados MySQL!");
});

// configurando as rotas

// Rota para inserir uma nova tarefa
app.post('/tarefas', (req, res) => {
    const { nome, custo, dataExp } = req.body;  // Corrigido para dataExp (nome correto da variável)

    // Verificar se há duplicidade do nome da tarefa
    db.query('SELECT nome FROM Tarefas WHERE nome = ?', [nome], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            return res.status(400).json({ error: "Essa tarefa já existe." });
        }

        // Verificar o valor máximo de ordem e calcular a nova ordem
        db.query('SELECT MAX(ordem) AS maxOrdem FROM Tarefas', (err, results) => {
            if (err) throw err;
            const novaOrdem = (results[0].maxOrdem || 0) + 1; // A ordem será o próximo valor disponível

            // Inserir a nova tarefa no banco de dados
            const sql = 'INSERT INTO Tarefas (nome, custo, dataExp, ordem) VALUES (?, ?, ?, ?)';
            db.query(sql, [nome, custo, dataExp, novaOrdem], (err, result) => {
                if (err) throw err;
                res.json({ id: result.insertId, nome, custo, dataExp, ordem: novaOrdem });
            });
        });
    });
});

// Rota para buscar todas as tarefas
app.get('/tarefas', (req, res) => {
    db.query('SELECT * FROM Tarefas ORDER BY ordem', (err, results) => {
        if (err) throw err;
        res.json(results); 
    });
});

// Rota para apagar tarefa por id
app.delete('/tarefas/:id', (req, res) => {
    const { id } = req.params;

    console.log(`Recebido DELETE para o ID: ${id}`);
    if (isNaN(id)) {
        console.error('ID inválido recebido no DELETE.');
        return res.status(400).json({ error: 'ID inválido. Deve ser numérico.' });
    }

    const sql = 'DELETE FROM Tarefas WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro no banco de dados:', err);
            return res.status(500).json({ error: 'Erro ao acessar o banco de dados.' });
        }

        if (result.affectedRows === 0) {
            console.warn('Nenhuma tarefa encontrada com o ID:', id);
            return res.status(404).json({ error: 'Tarefa não encontrada.' });
        }

        console.log('Tarefa excluída com sucesso. ID:', id);
        res.json({ message: 'Tarefa excluída com sucesso.' });
    });
});

// Buscar tarefa específica
app.get('/tarefas/:id', (req, res) => {
    const tarefaId = req.params.id;  // Obtém o ID da URL

    db.query('SELECT * FROM Tarefas WHERE id = ?', [tarefaId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        
        // Se encontrar a tarefa
        if (results.length > 0) {
            res.json(results[0]);  // Retorna a tarefa encontrada
        } else {
            res.status(404).json({ message: 'Tarefa não encontrada' });  // Caso não encontre
        }
    });
});


// Rota para editar uma tarefa
// Rota para editar uma tarefa
app.put('/tarefas/:id', (req, res) => {
    const tarefaId = req.params.id;  // Obtém o ID da URL
    const { nome, custo, dataExp } = req.body;

    // Verifica se o ID da tarefa é válido
    if (isNaN(tarefaId)) {
        return res.status(400).json({ error: 'ID inválido. Deve ser numérico.' });
    }

    // Atualiza a tarefa no banco de dados
    const sql = 'UPDATE Tarefas SET nome = ?, custo = ?, dataExp = ? WHERE id = ?';
    db.query(sql, [nome, custo, dataExp, tarefaId], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar tarefa:', err);
            return res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }

        // Retorna a tarefa atualizada
        res.json({ id: tarefaId, nome, custo, dataExp });
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


