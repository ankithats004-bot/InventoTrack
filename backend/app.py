from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_db, init_db

app = Flask(__name__)
CORS(app)

init_db()

@app.route("/")
def home():
    return jsonify({"message": "InventoTrack backend is working!"})

@app.route("/api/pesticides", methods=["GET"])
def get_pesticides():
    conn = get_db()
    items = conn.execute("SELECT * FROM pesticides ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(item) for item in items])

@app.route("/api/pesticides", methods=["POST"])
def add_pesticide():
    data = request.get_json()
    if not data or not data.get("name", "").strip():
        return jsonify({"error": "Pesticide name is required"}), 400

    conn = get_db()
    conn.execute(
        "INSERT INTO pesticides (name, quantity, min_stock, expiry_date) VALUES (?, ?, ?, ?)",
        (
            data["name"].strip(),
            max(0, int(data.get("quantity", 0))),
            max(0, int(data.get("min_stock", 5))),
            data.get("expiry_date") or None
        )
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Pesticide added successfully"}), 201

@app.route("/api/pesticides/<int:item_id>", methods=["DELETE"])
def delete_pesticide(item_id):
    conn = get_db()
    cursor = conn.execute("DELETE FROM pesticides WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()

    if cursor.rowcount == 0:
        return jsonify({"error": "Pesticide not found"}), 404
    return jsonify({"message": "Pesticide deleted successfully"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)