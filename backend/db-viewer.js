import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 5556;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.static('public'));

// Serve the main HTML page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tier Listing Database Viewer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            color: #666;
            margin-top: 0.5rem;
        }
        
        .tables-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
        }
        
        .table-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .table-header {
            background: #667eea;
            color: white;
            padding: 1rem;
            font-weight: bold;
        }
        
        .table-content {
            padding: 1rem;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }
        
        .data-table th {
            background: #f8f9fa;
            padding: 0.5rem;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
            font-weight: 600;
        }
        
        .data-table td {
            padding: 0.5rem;
            border-bottom: 1px solid #dee2e6;
        }
        
        .data-table tr:hover {
            background: #f8f9fa;
        }
        
        .schema-section {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            overflow: hidden;
        }
        
        .schema-header {
            background: #28a745;
            color: white;
            padding: 1rem;
            font-weight: bold;
        }
        
        .schema-content {
            padding: 1rem;
        }
        
        .schema-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .schema-table th {
            background: #f8f9fa;
            padding: 0.75rem;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
            font-weight: 600;
        }
        
        .schema-table td {
            padding: 0.75rem;
            border-bottom: 1px solid #dee2e6;
        }
        
        .refresh-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
            margin-bottom: 1rem;
        }
        
        .refresh-btn:hover {
            background: #5a6fd8;
        }
        
        .loading {
            text-align: center;
            padding: 2rem;
            color: #666;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border-radius: 5px;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🗄️ Tier Listing Database Viewer</h1>
        <p>Real-time database schema and data visualization</p>
    </div>
    
    <div class="container">
        <button class="refresh-btn" onclick="loadData()">🔄 Refresh Data</button>
        
        <div id="stats" class="stats-grid">
            <div class="loading">Loading statistics...</div>
        </div>
        
        <div class="schema-section">
            <div class="schema-header">📋 Database Schema</div>
            <div class="schema-content">
                <div id="schema" class="loading">Loading schema...</div>
            </div>
        </div>
        
        <div class="tables-grid">
            <div class="table-card">
                <div class="table-header">📊 Tiers</div>
                <div class="table-content">
                    <div id="tiers" class="loading">Loading tiers...</div>
                </div>
            </div>
            
            <div class="table-card">
                <div class="table-header">🃏 Cards</div>
                <div class="table-content">
                    <div id="cards" class="loading">Loading cards...</div>
                </div>
            </div>
            
            <div class="table-card">
                <div class="table-header">📋 Source Cards</div>
                <div class="table-content">
                    <div id="sourceCards" class="loading">Loading source cards...</div>
                </div>
            </div>
            
            <div class="table-card">
                <div class="table-header">💬 Comments</div>
                <div class="table-content">
                    <div id="comments" class="loading">Loading comments...</div>
                </div>
            </div>
            
            <div class="table-card">
                <div class="table-header">📚 Versions</div>
                <div class="table-content">
                    <div id="versions" class="loading">Loading versions...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function loadData() {
            try {
                // Load statistics
                const statsResponse = await fetch('/api/stats');
                const stats = await statsResponse.json();
                displayStats(stats);
                
                // Load schema
                const schemaResponse = await fetch('/api/schema');
                const schema = await schemaResponse.json();
                displaySchema(schema);
                
                // Load table data
                await Promise.all([
                    loadTableData('tiers', '/api/tiers'),
                    loadTableData('cards', '/api/cards'),
                    loadTableData('sourceCards', '/api/source-cards'),
                    loadTableData('comments', '/api/comments'),
                    loadTableData('versions', '/api/versions')
                ]);
                
            } catch (error) {
                console.error('Error loading data:', error);
                document.body.innerHTML += '<div class="error">Error loading data: ' + error.message + '</div>';
            }
        }
        
        function displayStats(stats) {
            const statsHtml = Object.entries(stats).map(([table, count]) => 
                '<div class="stat-card">' +
                    '<div class="stat-number">' + count + '</div>' +
                    '<div class="stat-label">' + table + '</div>' +
                '</div>'
            ).join('');
            document.getElementById('stats').innerHTML = statsHtml;
        }
        
        function displaySchema(schema) {
            const schemaHtml = Object.entries(schema).map(([table, columns]) => 
                '<h3>' + table + '</h3>' +
                '<table class="schema-table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Column</th>' +
                            '<th>Type</th>' +
                            '<th>Nullable</th>' +
                            '<th>Default</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                        columns.map(col => 
                            '<tr>' +
                                '<td><strong>' + col.column_name + '</strong></td>' +
                                '<td>' + col.data_type + '</td>' +
                                '<td>' + (col.is_nullable === 'YES' ? 'Yes' : 'No') + '</td>' +
                                '<td>' + (col.column_default || '-') + '</td>' +
                            '</tr>'
                        ).join('') +
                    '</tbody>' +
                '</table>'
            ).join('');
            document.getElementById('schema').innerHTML = schemaHtml;
        }
        
        async function loadTableData(elementId, endpoint) {
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                
                if (data.success && data.data.length > 0) {
                    const columns = Object.keys(data.data[0]);
                    const tableHtml = 
                        '<table class="data-table">' +
                            '<thead>' +
                                '<tr>' +
                                    columns.map(col => '<th>' + col + '</th>').join('') +
                                '</tr>' +
                            '</thead>' +
                            '<tbody>' +
                                data.data.map(row => 
                                    '<tr>' +
                                        columns.map(col => '<td>' + formatCellValue(row[col]) + '</td>').join('') +
                                    '</tr>'
                                ).join('') +
                            '</tbody>' +
                        '</table>';
                    document.getElementById(elementId).innerHTML = tableHtml;
                } else {
                    document.getElementById(elementId).innerHTML = '<p>No data available</p>';
                }
            } catch (error) {
                document.getElementById(elementId).innerHTML = '<div class="error">Error loading data</div>';
            }
        }
        
        function formatCellValue(value) {
            if (value === null || value === undefined) return '-';
            if (typeof value === 'string' && value.length > 50) {
                return value.substring(0, 50) + '...';
            }
            return String(value);
        }
        
        // Load data on page load
        loadData();
        
        // Auto-refresh every 30 seconds
        setInterval(loadData, 30000);
    </script>
</body>
</html>
  `);
});

// API endpoints
app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        'tiers' as table_name, COUNT(*) as count FROM tiers
        UNION ALL
        SELECT 'cards', COUNT(*) FROM cards
        UNION ALL
        SELECT 'source_cards', COUNT(*) FROM source_cards
        UNION ALL
        SELECT 'comments', COUNT(*) FROM comments
        UNION ALL
        SELECT 'versions', COUNT(*) FROM versions
    `);
    
    const stats = {};
    result.rows.forEach(row => {
      stats[row.table_name] = parseInt(row.count);
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/schema', async (req, res) => {
  try {
    const tables = ['tiers', 'cards', 'source_cards', 'comments', 'versions'];
    const schema = {};
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
      
      schema[table] = result.rows;
    }
    
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tiers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tiers ORDER BY position');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/cards', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cards ORDER BY tier_id, position');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/source-cards', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM source_cards ORDER BY source_category, created_at');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/comments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM comments ORDER BY created_at');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/versions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM versions ORDER BY created_at');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🗄️ Database Viewer running on http://localhost:${port}`);
  console.log(`📊 View your database schema and data in real-time!`);
}); 