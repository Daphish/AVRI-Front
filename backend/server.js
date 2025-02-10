const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/chat', (req, res) => {
    const { text } = req.body; 
    
    if (!text) {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    console.log(`Mensaje recibido: ${text}`);

    res.json({ text: `Recibí tu mensaje "${text}"`, sender: 'system' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
