import requests

response = requests.post(
    "http://127.0.0.1:5000/signup",
    json={"username": "testuser", "password": "testpass123"}
)

print(response.json())