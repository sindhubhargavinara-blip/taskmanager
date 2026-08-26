let currentUserId = null;

const authSection = document.getElementById("authSection");
const taskSection = document.getElementById("taskSection");

const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const authMessage = document.getElementById("authMessage");
const logoutBtn = document.getElementById("logoutBtn");

const addBtn = document.getElementById("addBtn");
const taskInput = document.getElementById("taskInput");
const taskGrid = document.getElementById("taskGrid");

const pastelColors = ["#fffde7", "#e8f8e8", "#e6f4fb", "#fbe9f3", "#fbf1e6", "#f0e9fb"];

function createTaskCard(task, index) {
    const card = document.createElement("div");
    card.className = "taskCard";
    const color = pastelColors[index % pastelColors.length];
    card.style.backgroundColor = color;

    const header = document.createElement("div");
    header.className = "taskHeader";

    const titleSpan = document.createElement("span");
    titleSpan.textContent = task.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "deleteBtn";
    deleteBtn.addEventListener("click", function(event) {
        event.stopPropagation();
        fetch("http://127.0.0.1:5000/tasks/" + task.id, {
            method: "DELETE"
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            loadTasks();
        });
    });

    header.appendChild(titleSpan);
    header.appendChild(deleteBtn);

    const body = document.createElement("div");
    body.className = "taskBody";
    body.style.display = "none";

    const subtaskList = document.createElement("ul");
    subtaskList.className = "subtaskList";

    const subtaskInput = document.createElement("input");
    subtaskInput.type = "text";
    subtaskInput.placeholder = "Add a subtask";

    const addSubtaskBtn = document.createElement("button");
    addSubtaskBtn.textContent = "Add";

    function loadSubtasks() {
        fetch("http://127.0.0.1:5000/subtasks/" + task.id)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                subtaskList.innerHTML = "";
                data.tasks.forEach(function(subtask) {
                    const subLi = document.createElement("li");
                    subLi.textContent = subtask.text;

                    const subDeleteBtn = document.createElement("button");
                    subDeleteBtn.textContent = "x";
                    subDeleteBtn.addEventListener("click", function(event) {
                        event.stopPropagation();
                        fetch("http://127.0.0.1:5000/tasks/" + subtask.id, {
                            method: "DELETE"
                        })
                        .then(function(response) {
                            return response.json();
                        })
                        .then(function(data) {
                            loadSubtasks();
                        });
                    });

                    subLi.appendChild(subDeleteBtn);
                    subtaskList.appendChild(subLi);
                });
            });
    }

    addSubtaskBtn.addEventListener("click", function(event) {
        event.stopPropagation();
        const text = subtaskInput.value;
        if (text === "") {
            return;
        }

        fetch("http://127.0.0.1:5000/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                task: text,
                user_id: currentUserId,
                parent_id: task.id
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            subtaskInput.value = "";
            loadSubtasks();
        });
    });

    subtaskInput.addEventListener("click", function(event) {
        event.stopPropagation();
    });

    body.appendChild(subtaskList);
    body.appendChild(subtaskInput);
    body.appendChild(addSubtaskBtn);

    header.addEventListener("click", function() {
        const isOpen = body.style.display === "block";
        body.style.display = isOpen ? "none" : "block";
        if (!isOpen) {
            loadSubtasks();
        }
    });

    card.appendChild(header);
    card.appendChild(body);
    taskGrid.appendChild(card);
}

function loadTasks() {
    fetch("http://127.0.0.1:5000/tasks/" + currentUserId)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            taskGrid.innerHTML = "";
            data.tasks.forEach(function(task, index) {
                createTaskCard(task, index);
            });
        });
}

function showTaskSection() {
    authSection.style.display = "none";
    taskSection.style.display = "block";
    loadTasks();
}

signupBtn.addEventListener("click", function() {
    fetch("http://127.0.0.1:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: usernameInput.value,
            password: passwordInput.value
        })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        if (data.error) {
            authMessage.textContent = data.error;
        } else {
            authMessage.textContent = "Signup successful! Now log in.";
        }
    });
});

loginBtn.addEventListener("click", function() {
    fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: usernameInput.value,
            password: passwordInput.value
        })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        if (data.error) {
            authMessage.textContent = data.error;
        } else {
            currentUserId = data.user_id;
            localStorage.setItem("userId", currentUserId);
            showTaskSection();
        }
    });
});

logoutBtn.addEventListener("click", function() {
    currentUserId = null;
    localStorage.removeItem("userId");
    taskSection.style.display = "none";
    authSection.style.display = "block";
    usernameInput.value = "";
    passwordInput.value = "";
    authMessage.textContent = "";
});

addBtn.addEventListener("click", function() {
    const taskText = taskInput.value;
    if (taskText === "") {
        return;
    }

    fetch("http://127.0.0.1:5000/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskText, user_id: currentUserId })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        taskInput.value = "";
        loadTasks();
    });
});

const savedUserId = localStorage.getItem("userId");
if (savedUserId) {
    currentUserId = savedUserId;
    showTaskSection();
}