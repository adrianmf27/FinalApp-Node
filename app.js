const express = require('express');
const app = express();
const port = 3000;

// Ruta principal
app.get('/', (req, res) => {
  res.send('¡Hola Mundo desde Express!');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
