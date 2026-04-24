import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [input, setInput] = useState('["A->B", "A->C", "B->D", "C->E", "E->F", "X->Y", "Y->Z", "Z->X", "P->Q", "Q->R", "G->H", "G->H", "G->I", "hello", "1->2", "A->"]')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      let data;
      try {
        data = JSON.parse(input)
      } catch (e) {
        throw new Error("Invalid JSON format. Please provide an array of strings.")
      }

      const res = await axios.post('http://localhost:5000/bfhl', { data })
      setResponse(res.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header>
        <h1>SRM Challenge</h1>
        <p className="subtitle">Full Stack Engineering - Hierarchical Insights API</p>
      </header>

      <div className="glass-card">
        <div className="input-group">
          <label style={{ textAlign: 'left', fontWeight: '500' }}>Enter node strings (JSON Array):</label>
          <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder='["A->B", "C->D"]'
          />
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'Generate Insights'}
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      {response && (
        <div className="results-grid">
          <div className="glass-card result-card">
            <h3>Summary</h3>
            <div className="summary-items">
              <div className="summary-box">
                <span className="label">Total Trees</span>
                <span className="value">{response.summary.total_trees}</span>
              </div>
              <div className="summary-box">
                <span className="label">Total Cycles</span>
                <span className="value">{response.summary.total_cycles}</span>
              </div>
              <div className="summary-box">
                <span className="label">Largest Root</span>
                <span className="value" style={{ fontSize: '1.2rem' }}>{response.summary.largest_tree_root || 'N/A'}</span>
              </div>
            </div>

            <div className="list-section">
              <span className="list-title">User Info</span>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                <p>ID: {response.user_id}</p>
                <p>Email: {response.email_id}</p>
                <p>Roll: {response.college_roll_number}</p>
              </div>
            </div>

            {response.invalid_entries.length > 0 && (
              <div className="list-section">
                <span className="list-title">Invalid Entries</span>
                <div className="tag-container">
                  {response.invalid_entries.map((entry, i) => (
                    <span key={i} className="tag" style={{ color: '#f87171' }}>{entry}</span>
                  ))}
                </div>
              </div>
            )}

            {response.duplicate_edges.length > 0 && (
              <div className="list-section">
                <span className="list-title">Duplicate Edges</span>
                <div className="tag-container">
                  {response.duplicate_edges.map((edge, i) => (
                    <span key={i} className="tag" style={{ color: '#fbbf24' }}>{edge}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card result-card">
            <h3>Hierarchies</h3>
            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {response.hierarchies.map((h, i) => (
                <div key={i} className="hierarchy-item">
                  <div className="hierarchy-header">
                    <span style={{ fontWeight: '700' }}>Root: {h.root}</span>
                    {h.has_cycle ? (
                      <span className="badge badge-red">CYCLE</span>
                    ) : (
                      <span className="badge badge-blue">DEPTH: {h.depth}</span>
                    )}
                  </div>
                  {h.has_cycle ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Cycle detected in this group.</div>
                  ) : (
                    <TreeView data={h.tree} node={h.root} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {response && (
        <div className="glass-card" style={{ marginTop: '2rem' }}>
          <h3 style={{ textAlign: 'left' }}>Raw API Response</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

function TreeView({ data, node }) {
  const children = data[node] ? Object.keys(data[node]) : [];
  
  return (
    <div className="tree-node">
      <span className="node-label">{node}</span>
      {children.length > 0 && (
        <div className="children">
          {children.map((child, i) => (
            <TreeView key={i} data={data[node]} node={child} />
          ))}
        </div>
      )}
    </div>
  )
}

export default App
