import requests

response = requests.post(
    "http://127.0.0.1:5000/login",
    json={"username": "testuser", "password": "wrongpassword"}
)

print(response.json())