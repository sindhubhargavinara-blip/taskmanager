from flask import Flask, request, render_template
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import sqlite3

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

def get_db_connection():
    connection = sqlite3.connect("tasks.db")
    connection.row_factory = sqlite3.Row
    return connection

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/signup", methods=["POST"])
def signup():
    username = request.json["username"]
    password = request.json["password"]

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    connection = get_db_connection()
    try:
        connection.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (username, hashed_password)
        )
        connection.commit()
    except sqlite3.IntegrityError:
        connection.close()
        return {"error": "Username already taken"}, 400

    connection.close()
    return {"message": "Signup successful"}

@app.route("/login", methods=["POST"])
def login():
    username = request.json["username"]
    password = request.json["password"]

    connection = get_db_connection()
    user = connection.execute(
        "SELECT * FROM users WHERE username = ?", (username,)
    ).fetchone()
    connection.close()

    if user is None:
        return {"error": "Invalid username or password"}, 401

    if not bcrypt.check_password_hash(user["password"], password):
        return {"error": "Invalid username or password"}, 401

    return {"message": "Login successful", "user_id": user["id"]}

@app.route("/tasks/<int:user_id>")
def get_main_tasks(user_id):
    connection = get_db_connection()
    rows = connection.execute(
        "SELECT * FROM tasks WHERE user_id = ? AND parent_id IS NULL", (user_id,)
    ).fetchall()
    connection.close()

    task_list = [dict(row) for row in rows]
    return {"tasks": task_list}

@app.route("/subtasks/<int:parent_id>")
def get_subtasks(parent_id):
    connection = get_db_connection()
    rows = connection.execute(
        "SELECT * FROM tasks WHERE parent_id = ?", (parent_id,)
    ).fetchall()
    connection.close()

    task_list = [dict(row) for row in rows]
    return {"tasks": task_list}

@app.route("/tasks", methods=["POST"])
def add_task():
    new_task = request.json["task"]
    user_id = request.json["user_id"]
    parent_id = request.json.get("parent_id")

    connection = get_db_connection()
    connection.execute(
        "INSERT INTO tasks (text, user_id, parent_id) VALUES (?, ?, ?)",
        (new_task, user_id, parent_id)
    )
    connection.commit()
    connection.close()

    if parent_id:
        return get_subtasks(parent_id)
    else:
        return get_main_tasks(user_id)

@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    connection = get_db_connection()
    task = connection.execute(
        "SELECT * FROM tasks WHERE id = ?", (task_id,)
    ).fetchone()

    if task is None:
        connection.close()
        return {"error": "Task not found"}, 404

    connection.execute("DELETE FROM tasks WHERE parent_id = ?", (task_id,))
    connection.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    connection.commit()
    connection.close()

    if task["parent_id"]:
        return get_subtasks(task["parent_id"])
    else:
        return get_main_tasks(task["user_id"])

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)