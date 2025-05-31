import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Button, Collapse, Container, IconButton, List, ListItem, ListItemText,
  Paper, TextField, Typography, Divider
} from '@mui/material';
import { Add, Delete, ExpandLess, ExpandMore, Save } from '@mui/icons-material';

const API = process.env.REACT_APP_API_URL || '';

function RoutingKeySection({ rk, onRename, onAddPhrase, onDeletePhrase, onUpdatePhrase, expanded, onToggle }) {
  const [editName, setEditName] = useState(rk.name || '');
  const [editing, setEditing] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');

  const total = rk.phrases.reduce((sum, p) => sum + p.count, 0);

  return (
    <Paper sx={{ mb: 2, background: '#23272e', color: '#fff' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <IconButton onClick={onToggle} sx={{ color: '#1abc9c' }}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
        {editing ? (
          <>
            <TextField
              value={editName}
              onChange={e => setEditName(e.target.value)}
              size="small"
              sx={{ mr: 1, background: '#fff', borderRadius: 1 }}
            />
            <Button
              onClick={() => { onRename(editName); setEditing(false); }}
              variant="contained"
              size="small"
              sx={{ background: '#1abc9c', color: '#23272e', mr: 1 }}
            >Save</Button>
            <Button
              onClick={() => { setEditName(rk.name); setEditing(false); }}
              variant="outlined"
              size="small"
              sx={{ color: '#1abc9c', borderColor: '#1abc9c' }}
            >Cancel</Button>
          </>
        ) : (
          <>
            <Typography variant="h6" sx={{ flexGrow: 1, color: '#1abc9c', ml: 1 }}>
              {rk.name || rk.key}
            </Typography>
            <Button
              onClick={() => setEditing(true)}
              size="small"
              sx={{ color: '#1abc9c', borderColor: '#1abc9c', ml: 1 }}
              variant="outlined"
            >Rename</Button>
          </>
        )}
        <Box sx={{ ml: 'auto', fontWeight: 'bold', color: '#fff' }}>
          Total: {total}
        </Box>
      </Box>
      <Collapse in={expanded}>
        <Divider sx={{ background: '#1abc9c' }} />
        <List>
          {rk.phrases.map((phrase, idx) => (
            <ListItem
              key={idx}
              secondaryAction={
                rk.phrases.length > 1 && (
                  <IconButton edge="end" onClick={() => onDeletePhrase(idx)} sx={{ color: '#e74c3c' }}>
                    <Delete />
                  </IconButton>
                )
              }
              sx={{ background: '#2c313a', mb: 1, borderRadius: 1 }}
            >
              <TextField
                value={phrase.text}
                onChange={e => onUpdatePhrase(idx, e.target.value)}
                size="small"
                sx={{ background: '#fff', borderRadius: 1, mr: 2, width: '60%' }}
                placeholder="Enter phrase"
              />
              <Box sx={{ fontWeight: 'bold', color: '#1abc9c', ml: 2 }}>
                {phrase.count}
              </Box>
            </ListItem>
          ))}
          <ListItem>
            <TextField
              value={newPhrase}
              onChange={e => setNewPhrase(e.target.value)}
              size="small"
              sx={{ background: '#fff', borderRadius: 1, mr: 2, width: '60%' }}
              placeholder="Add new phrase"
            />
            <IconButton
              onClick={() => { if (newPhrase) { onAddPhrase(newPhrase); setNewPhrase(''); } }}
              sx={{ color: '#1abc9c' }}
            >
              <Add />
            </IconButton>
          </ListItem>
        </List>
      </Collapse>
    </Paper>
  );
}

function App() {
  const [routingKeys, setRoutingKeys] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');

  const fetchData = async () => {
    const res = await axios.get(`${API}/api/routing-keys`);
    setRoutingKeys(res.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddRoutingKey = async () => {
    if (!newKey) return;
    await axios.post(`${API}/api/routing-keys`, { key: newKey, name: newName });
    setNewKey(''); setNewName('');
    fetchData();
  };

  const handleRename = async (key, name) => {
    await axios.put(`${API}/api/routing-keys/${key}/rename`, { name });
    fetchData();
  };

  const handleAddPhrase = async (key, text) => {
    await axios.post(`${API}/api/routing-keys/${key}/phrases`, { text });
    fetchData();
  };

  const handleDeletePhrase = async (key, idx) => {
    await axios.delete(`${API}/api/routing-keys/${key}/phrases/${idx}`);
    fetchData();
  };

  const handleUpdatePhrase = async (key, idx, text) => {
    await axios.put(`${API}/api/routing-keys/${key}/phrases/${idx}`, { text });
    fetchData();
  };

  const handleToggle = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = async () => {
    await axios.post(`${API}/api/reset`);
    fetchData();
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#181c22', color: '#fff', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h3" sx={{ color: '#1abc9c', mb: 2, fontWeight: 'bold' }}>
          PagerDuty Event Counter
        </Typography>
        <Paper sx={{ p: 2, mb: 3, background: '#23272e' }}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
            Add Routing Key
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Routing Key"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              size="small"
              sx={{ background: '#fff', borderRadius: 1 }}
            />
            <TextField
              label="Name (optional)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              size="small"
              sx={{ background: '#fff', borderRadius: 1 }}
            />
            <Button
              onClick={handleAddRoutingKey}
              variant="contained"
              sx={{ background: '#1abc9c', color: '#23272e', fontWeight: 'bold' }}
            >Add</Button>
            <Button
              onClick={handleReset}
              variant="outlined"
              sx={{ color: '#1abc9c', borderColor: '#1abc9c', ml: 'auto' }}
            >Reset All Counters</Button>
          </Box>
        </Paper>
        {routingKeys.map(rk => (
          <RoutingKeySection
            key={rk.key}
            rk={rk}
            expanded={!!expanded[rk.key]}
            onToggle={() => handleToggle(rk.key)}
            onRename={name => handleRename(rk.key, name)}
            onAddPhrase={text => handleAddPhrase(rk.key, text)}
            onDeletePhrase={idx => handleDeletePhrase(rk.key, idx)}
            onUpdatePhrase={(idx, text) => handleUpdatePhrase(rk.key, idx, text)}
          />
        ))}
        <Box sx={{ mt: 4, color: '#888', fontSize: 14 }}>
          <Divider sx={{ background: '#1abc9c', mb: 2 }} />
          <Typography>
            <b>Note:</b> This tool only observes PagerDuty events and never interferes with their delivery or processing.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default App;
