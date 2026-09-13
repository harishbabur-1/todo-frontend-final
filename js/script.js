const SERVER_URL = "http://localhost:8080";



function getHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
    };
}

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;
        const message = document.getElementById("registerMessage");

        try {
            const response = await fetch(SERVER_URL + "/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.text();

            if (response.ok) {
                message.textContent = "Account created successfully.";
                setTimeout(function() {
                    window.location.href = "login.html";
                }, 1000);
            } else {
                message.textContent = data;
            }
        } catch (error) {
            message.textContent = "Unable to connect to server.";
        }
    });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        const message = document.getElementById("loginMessage");

        try {
            const response = await fetch(SERVER_URL + "/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("email", email);
                window.location.href = "todos.html";
            } else {
                message.textContent = "Login failed.";
            }
        } catch (error) {
            message.textContent = "Unable to connect to server.";
        }
    });
}

const todoForm = document.getElementById("todoForm");

if (todoForm) {
    if (!localStorage.getItem("token")) {
        window.location.href = "login.html";
    } else {
        document.getElementById("userEmail").textContent = localStorage.getItem("email");
        loadTodos();
    }

    todoForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const title = document.getElementById("todoTitle").value;
        const description = document.getElementById("todoDescription").value;
        const message = document.getElementById("todoMessage");

        try {
            const response = await fetch(SERVER_URL + "/todo/post", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    title: title,
                    description: description,
                    isCompleted: false
                })
            });

            if (response.ok) {
                todoForm.reset();
                message.textContent = "";
                loadTodos();
            } else {
                message.textContent = "Unable to add todo.";
            }
        } catch (error) {
            message.textContent = "Unable to connect to server.";
        }
    });

    document.getElementById("logoutButton").addEventListener("click", function() {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        window.location.href = "login.html";
    });
}

async function loadTodos() {
    const todoList = document.getElementById("todoList");

    try {
        const response = await fetch(SERVER_URL + "/todo", {
            method: "GET",
            headers: getHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("email");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error();
        }

        const todos = await response.json();
        todoList.innerHTML = "";

        if (todos.length === 0) {
            todoList.innerHTML = "<p>No todos yet. Add your first task.</p>";
            return;
        }

        todos.forEach(function(todo) {
            const completed = todo.isCompleted === true;
            const card = document.createElement("div");
            card.className = "todo-card" + (completed ? " completed" : "");

            const info = document.createElement("div");
            info.className = "todo-info";

            const title = document.createElement("h3");
            title.textContent = todo.title;

            const description = document.createElement("p");
            description.textContent = todo.description || "No description";

            info.appendChild(title);
            info.appendChild(description);

            const actions = document.createElement("div");
            actions.className = "todo-actions";

            const completeButton = document.createElement("button");
            completeButton.className = "complete-button" + (completed ? " completed-button" : "");
            completeButton.textContent = completed ? "Undo" : "Complete";
            completeButton.onclick = function() {
                toggleTodo(todo.id, todo.title, todo.description || "", completed);
            };

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.onclick = function() {
                editTodo(todo.id, todo.title, todo.description || "", completed);
            };

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.onclick = function() {
                deleteTodo(todo.id);
            };

            actions.appendChild(completeButton);
            actions.appendChild(editButton);
            actions.appendChild(deleteButton);

            card.appendChild(info);
            card.appendChild(actions);
            todoList.appendChild(card);
        });
    } catch (error) {
        document.getElementById("todoMessage").textContent = "Unable to load todos.";
    }
}

async function toggleTodo(id, title, description, completed) {
    try {
        const response = await fetch(SERVER_URL + "/todo", {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({
                id: Number(id),
                title: title,
                description: description,
                isCompleted: !completed
            })
        });

        if (response.ok) {
            await loadTodos();
        } else {
            document.getElementById("todoMessage").textContent = "Unable to update todo.";
        }
    } catch (error) {
        document.getElementById("todoMessage").textContent = "Unable to connect to server.";
    }
}

async function editTodo(id, oldTitle, oldDescription, completed) {
    const title = prompt("Enter todo title:", oldTitle);

    if (title === null || title.trim() === "") {
        return;
    }

    const description = prompt("Enter description:", oldDescription);

    if (description === null) {
        return;
    }

    try {
        const response = await fetch(SERVER_URL + "/todo", {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({
                id: id,
                title: title,
                description: description,
                isCompleted: completed
            })
        });

        if (response.ok) {
            loadTodos();
        } else {
            document.getElementById("todoMessage").textContent = "Unable to update todo.";
        }
    } catch (error) {
        document.getElementById("todoMessage").textContent = "Unable to connect to server.";
    }
}

async function deleteTodo(id) {
    if (!confirm("Delete this todo?")) {
        return;
    }

    try {
        const response = await fetch(SERVER_URL + "/todo/" + id, {
            method: "DELETE",
            headers: getHeaders()
        });

        if (response.ok) {
            loadTodos();
        } else {
            document.getElementById("todoMessage").textContent = "Unable to delete todo.";
        }
    } catch (error) {
        document.getElementById("todoMessage").textContent = "Unable to connect to server.";
    }
}
