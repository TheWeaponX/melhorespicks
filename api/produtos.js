export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const BIN_ID = "69d6efdfaaba882197dab9b5";
  const API_KEY = process.env.JSONBIN_KEY;

  // Adicionar produto
  if (req.method === "POST") {
    const novoProduto = req.body;

    const resposta = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      headers: {
        "X-Master-Key": API_KEY
      }
    });

    const data = await resposta.json();

    data.record.produtos.push(novoProduto);

    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify(data.record)
    });

    return res.status(200).json({ sucesso: true });
  }

  // Buscar produtos
  const resposta = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    headers: {
      "X-Master-Key": API_KEY
    }
  });

  const data = await resposta.json();

  return res.status(200).json(data.record);
}
