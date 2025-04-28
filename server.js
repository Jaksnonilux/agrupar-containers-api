const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(bodyParser.json());

const MAX_VOLUME = 76; // m³
const MAX_WEIGHT = 26000; // kg

app.post("/agrupar", (req, res) => {
  const { Pedido } = req.body;
  if (!Pedido) {
    return res.status(400).json({ error: "Pedido não encontrado no body." });
  }

  let containers = [];
  let currentContainer = null;
  let currentVolume = 0;
  let currentWeight = 0;

  // Ordenar por fornecedor, cliente, porto
  Pedido.sort((a, b) => {
    if (a.fornecedor !== b.fornecedor) return a.fornecedor - b.fornecedor;
    if (a.cliente !== b.cliente) return a.cliente - b.cliente;
    return a.porto - b.porto;
  });

  for (const item of Pedido) {
    let qtyRemaining = item.quantidade;

    while (qtyRemaining > 0) {
      if (!currentContainer) {
        currentContainer = {
          id: uuidv4(),
          fornecedor: item.fornecedor,
          cliente: item.cliente,
          porto: item.porto,
          produtos: [],
        };
        currentVolume = 0;
        currentWeight = 0;
      }

      let maxQtyByVolume = Math.floor((MAX_VOLUME - currentVolume) / item.volume_unitario);
      let maxQtyByWeight = Math.floor((MAX_WEIGHT - currentWeight) / item.peso_unitario);
      let canFitQty = Math.min(qtyRemaining, maxQtyByVolume, maxQtyByWeight);

      if (canFitQty <= 0) {
        containers.push(currentContainer);
        currentContainer = null;
        continue;
      }

      currentContainer.produtos.push({
        produto: item.produto,
        quantidade: canFitQty,
        peso_unitario: item.peso_unitario,
        volume_unitario: item.volume_unitario,
      });

      currentVolume += item.volume_unitario * canFitQty;
      currentWeight += item.peso_unitario * canFitQty;
      qtyRemaining -= canFitQty;
    }
  }

  if (currentContainer) {
    containers.push(currentContainer);
  }

  res.json(containers);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
