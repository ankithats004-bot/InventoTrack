
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://192.168.255.241:5000/api/pesticides";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [expiry, setExpiry] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function loadItems() {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error();
      setItems(await response.json());
      setError("");
    } catch {
      setError("Cannot connect to backend. Make sure Flask is running.");
    }
  }

  useEffect(() => {
    if (loggedIn) loadItems();
  }, [loggedIn]);

  function login(e) {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      setLoggedIn(true);
      setError("");
    }
  }

  async function addItem(e) {
    e.preventDefault();
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          quantity: Number(quantity),
          min_stock: Number(minStock),
          expiry_date: expiry || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not add item");
      setName("");
      setQuantity("");
      setMinStock("5");
      setExpiry("");
      loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteItem(id) {
    if (!window.confirm("Delete this pesticide?")) return;
    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete item");
      loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const lowStock = items.filter(item => item.quantity <= item.min_stock).length;
  const expired = items.filter(item => item.expiry_date && item.expiry_date < today).length;
  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!loggedIn) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={login}>
          <div className="login-logo">🌿</div>
          <h1>InventoTrack</h1>
          <p>Smart Pesticide Inventory Management</p>
          <h2>Welcome back!</h2>
          <label>
            Username
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Enter any username" required />
          </label>
          <label>
            Password
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter any password" required />
          </label>
          <button type="submit" className="login-button">Login</button>
          <small>Demo login: enter any username and password.</small>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">🌿 InventoTrack</div>
        <div className="header-actions">
          <span>Welcome, {username}</span>
          <button onClick={() => { setLoggedIn(false); setPassword(""); }}>
            Logout
          </button>
        </div>
      </header>

      <main className="main">
        <section className="welcome">
          <p className="eyebrow">INVENTORY MANAGEMENT</p>
          <h1>Manage your stock smarter.</h1>
          <p>Track pesticide quantities, monitor expiry dates, and spot low stock.</p>
        </section>

        {error && <div className="error">{error}</div>}

        <section className="stats">
          <div className="stat"><span>Total products</span><strong>{items.length}</strong></div>
          <div className="stat"><span>Low-stock alerts</span><strong>{lowStock}</strong></div>
          <div className="stat"><span>Expired products</span><strong>{expired}</strong></div>
        </section>

        <section className="panel">
          <h2>Add pesticide</h2>
          <form onSubmit={addItem} className="form">
            <label>Pesticide name
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Neem oil" required />
            </label>
            <label>Quantity
              <input type="number" min="0" value={quantity}
                onChange={e => setQuantity(e.target.value)} required />
            </label>
            <label>Minimum stock
              <input type="number" min="0" value={minStock}
                onChange={e => setMinStock(e.target.value)} required />
            </label>
            <label>Expiry date
              <input type="date" value={expiry}
                onChange={e => setExpiry(e.target.value)} />
            </label>
            <button type="submit">+ Add pesticide</button>
          </form>
        </section>

        <section className="panel">
          <div className="inventory-heading">
            <h2>Inventory</h2>
            <input className="search" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search pesticides..." />
          </div>

          {filtered.length === 0 ? (
            <p className="empty">No pesticides found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Name</th><th>Quantity</th><th>Minimum</th>
                  <th>Expiry date</th><th>Status</th><th>Action</th>
                </tr></thead>
                <tbody>
                  {filtered.map(item => {
                    const isExpired = item.expiry_date && item.expiry_date < today;
                    const isLow = item.quantity <= item.min_stock;
                    return (
                      <tr key={item.id}>
                        <td>{item.name}</td><td>{item.quantity}</td>
                        <td>{item.min_stock}</td><td>{item.expiry_date || "—"}</td>
                        <td><span className={`status ${isExpired ? "danger" : isLow ? "warning" : "good"}`}>
                          {isExpired ? "Expired" : isLow ? "Low stock" : "In stock"}
                        </span></td>
                        <td><button className="delete" onClick={() => deleteItem(item.id)}>Delete</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <button className="refresh" onClick={loadItems}>Refresh inventory</button>
        </section>
      </main>
      <footer>InventoTrack · Smart stock management</footer>
    </div>
  );
}

export default App;
