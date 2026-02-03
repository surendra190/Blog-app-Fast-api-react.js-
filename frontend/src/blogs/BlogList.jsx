import { useEffect, useState } from "react";
import api from "../api/axios";
import React from "react";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // selected blog for view

  // form state for create/update
  const [form, setForm] = useState({ title: "", content: "" });
  const [editingId, setEditingId] = useState(null);

  const fetchBlogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/blogs");
      setBlogs(res.data || []);
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("Authentication required. Please login.");
      } else {
        setError("Failed to load blogs");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const filtered = blogs.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(b.id).includes(q) ||
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.content && b.content.toLowerCase().includes(q)) ||
      String(b.owner_id).includes(q)
    );
  });

  const viewBlog = async (id) => {
    try {
      const res = await api.get(`/blogs/${id}`);
      setSelected(res.data);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to load blog");
    }
  };

  const startEdit = (b) => {
    setEditingId(b.id);
    setForm({ title: b.title || "", content: b.content || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", content: "" });
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/blogs/${editingId}`, {
          title: form.title,
          content: form.content,
        });
      } else {
        await api.post(`/blogs`, form);
      }
      await fetchBlogs();
      cancelEdit();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to save blog");
    }
  };

  const deleteBlog = async (id) => {
    if (!window.confirm("Delete this blog?")) return;
    try {
      await api.delete(`/blogs/${id}`);
      await fetchBlogs();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to delete blog");
    }
  };

  return (
    <div className="main">
      <h1>Blogs</h1>

      <section className="blog-form-section">
        <form
          className="auth-form"
          onSubmit={submitForm}
          style={{ width: "100%" }}
        >
          <h2>{editingId ? "Edit Blog" : "Create Blog"}</h2>
          {error && <div className="auth-error">{error}</div>}
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label>
            Content &nbsp;
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={4}
            />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" type="submit">
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                style={{ background: "#ef4444" }}
                className="btn"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section style={{ marginTop: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <input
            placeholder="Search by id, title, content or owner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: 8,
              width: 320,
              borderRadius: 6,
              border: "1px solid #e5e7eb",
            }}
          />
          <div>
            <button
              className="btn"
              onClick={fetchBlogs}
              disabled={loading}
              style={{ marginLeft: 8 }}
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div>
            <table className="blog-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Owner</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="blog-card">
                    <td>{b.id}</td>
                    <td>{b.title}</td>
                    <td>{b.owner_id}</td>
                    <td>
                      <button
                        className="small-btn"
                        onClick={() => viewBlog(b.id)}
                      >
                        View
                      </button>
                      <button
                        className="small-btn"
                        onClick={() => startEdit(b)}
                      >
                        Edit
                      </button>
                      <button
                        className="small-btn"
                        onClick={() => deleteBlog(b.id)}
                        style={{ background: "#ef4444" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selected && (
              <div style={{ marginTop: 12 }} className="blog-card">
                <h3>
                  {selected.title} (id: {selected.id})
                </h3>
                <p>{selected.content}</p>
                <div>Owner: {selected.owner_id}</div>
                <div style={{ marginTop: 8 }}>
                  <button
                    className="small-btn"
                    onClick={() => setSelected(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
