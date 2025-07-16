document.addEventListener('DOMContentLoaded', function() {
    // Konfigurasi dasar
    const API_URL = 'http://localhost:5000/api/todos';
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    let currentFilter = 'all';
    
    // Inisialisasi
    fetchTodos();
    
    // Event Listeners
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTodo();
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            updateFilterButtons();
            fetchTodos();
        });
    });
    
    // Fungsi-fungsi utama
    
    // [1] Tampilkan notifikasi
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }, 5000);
    }
    
    // [2] Update tampilan filter button
    function updateFilterButtons() {
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });
    }
    
    // [3] Ambil data todos dari API
    async function fetchTodos() {
        try {
            const response = await fetch(`${API_URL}/${currentFilter}`);
            if (!response.ok) throw new Error('Gagal memuat todos');
            const todos = await response.json();
            renderTodos(todos);
        } catch (error) {
            console.error('Error:', error);
            showNotification('Gagal memuat todos', 'error');
        }
    }
    
    // [4] Render todos ke DOM
    function renderTodos(todos) {
        todoList.innerHTML = '';
        
        if (todos.length === 0) {
            const emptyMsg = document.createElement('li');
            emptyMsg.className = 'empty-message';
            
            if (currentFilter === 'all') {
                emptyMsg.textContent = 'Belum ada todo. Tambahkan sekarang!';
            } else {
                emptyMsg.textContent = `Tidak ada todo ${currentFilter}.`;
            }
            
            todoList.appendChild(emptyMsg);
            return;
        }
        
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'todo-item';
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''} 
                    data-id="${todo.id}">
                <span class="todo-text ${todo.completed ? 'completed' : ''}">
                    ${todo.title}
                </span>
                <div class="todo-actions">
                    <button class="edit-btn" data-id="${todo.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${todo.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            todoList.appendChild(li);
        });
        
        // Setup event listeners
        setupTodoCheckboxes();
        setupDeleteButtons();
        setupEditButtons();
    }
    
    // [5] Setup checkbox todo
    function setupTodoCheckboxes() {
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', toggleTodo);
        });
    }
    
    // [6] Toggle status todo (complete/active)
    async function toggleTodo(e) {
        const id = e.target.dataset.id;
        const completed = e.target.checked;
        
        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed })
            });
            
            const action = completed ? 'diselesaikan' : 'diaktifkan';
            showNotification(`Todo berhasil ${action}!`);
            fetchTodos();
        } catch (error) {
            console.error('Error:', error);
            showNotification('Gagal mengupdate todo', 'error');
        }
    }
    
    // [7] Setup tombol delete
    function setupDeleteButtons() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteTodo);
        });
    }
    
    // [8] Hapus todo
    async function deleteTodo(e) {
        const id = e.target.closest('.delete-btn').dataset.id;
        const todoText = e.target.closest('.todo-item').querySelector('.todo-text').textContent;
        
        // Tampilkan modal konfirmasi
        const modal = document.getElementById('delete-modal');
        const modalText = document.getElementById('delete-modal-text');
        modalText.textContent = `"${todoText}"\n\nApakah kamu yakin ingin menghapus todo ini?`;
        modal.style.display = 'flex';
        
        // Tunggu konfirmasi user
        const userAction = new Promise((resolve) => {
            document.getElementById('confirm-delete').onclick = () => resolve(true);
            document.getElementById('cancel-delete').onclick = () => resolve(false);
        });
        
        const confirmed = await userAction;
        modal.style.display = 'none';
        
        if (!confirmed) return;
        
        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            showNotification('Todo berhasil dihapus!');
            fetchTodos();
        } catch (error) {
            console.error('Error:', error);
            showNotification('Gagal menghapus todo', 'error');
        }
    }
    
    // [9] Setup tombol edit
    function setupEditButtons() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const todoItem = e.target.closest('.todo-item');
                const todoText = todoItem.querySelector('.todo-text').textContent;
                const todoId = todoItem.querySelector('.delete-btn').dataset.id;
                
                openEditModal(todoId, todoText);
            });
        });
    }
    
    // [10] Buka modal edit
    async function openEditModal(id, text) {
        const modal = document.getElementById('edit-modal');
        const input = document.getElementById('edit-todo-input');
        
        input.value = text;
        modal.style.display = 'flex';
        input.focus();
        input.select();
        
        // Handle konfirmasi/batal
        const confirmEdit = document.getElementById('confirm-edit');
        const cancelEdit = document.getElementById('cancel-edit');
        
        const cleanup = () => {
            confirmEdit.onclick = null;
            cancelEdit.onclick = null;
            modal.style.display = 'none';
        };
        
        return new Promise((resolve) => {
            confirmEdit.onclick = async () => {
                const newText = input.value.trim();
                if (newText && newText !== text) {
                    try {
                        await fetch(`${API_URL}/${id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ title: newText })
                        });
                        
                        showNotification('Todo berhasil diupdate!');
                        fetchTodos();
                    } catch (error) {
                        console.error('Error:', error);
                        showNotification('Gagal mengupdate todo', 'error');
                    }
                }
                cleanup();
                resolve(true);
            };
            
            cancelEdit.onclick = () => {
                cleanup();
                resolve(false);
            };
        });
    }
    
    // [11] Tambah todo baru
    async function addTodo() {
        const title = todoInput.value.trim();
        if (!title) return;
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title })
            });
            
            if (!response.ok) throw new Error('Gagal menambah todo');
            
            todoInput.value = '';
            showNotification('Todo berhasil ditambahkan!');
            fetchTodos();
        } catch (error) {
            console.error('Error:', error);
            showNotification('Gagal menambah todo', 'error');
        }
    }
    
    // [12] Tutup modal ketika klik di luar
    document.getElementById('delete-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('delete-modal')) {
            document.getElementById('delete-modal').style.display = 'none';
        }
    });
    
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('edit-modal')) {
            document.getElementById('edit-modal').style.display = 'none';
        }
    });
});