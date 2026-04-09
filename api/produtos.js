export default async function handler(req, res) {
  const BIN_ID = process.env.JSONBIN_BIN_ID;
  const API_KEY = process.env.JSONBIN_API_KEY;

  const url = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

  // 🔹 GET
  if (req.method === "GET") {
    const r = await fetch(url, {
      headers: { "X-Master-Key": API_KEY }
    });
    const data = await r.json();

    return res.status(200).json({
      produtos: data.record.produtos || []
    });
  }

  // 🔹 POST (add ou edit)
  if (req.method === "POST") {
    const r = await fetch(url, {
      headers: { "X-Master-Key": API_KEY }
    });
    const data = await r.json();
    let produtos = data.record.produtos || [];

    const newItem = req.body;

    const index = produtos.findIndex(p => p.id === newItem.id);

    if (index !== -1) {
      produtos[index] = newItem; // EDITAR
    } else {
      produtos.push(newItem); // NOVO
    }

    await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify({ produtos })
    });

    return res.status(200).json({ success: true });
  }

  // 🔹 DELETE
  if (req.method === "DELETE") {
    const r = await fetch(url, {
      headers: { "X-Master-Key": API_KEY }
    });
    const data = await r.json();
    let produtos = data.record.produtos || [];

    const { id } = req.body;

    produtos = produtos.filter(p => p.id !== id);

    await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify({ produtos })
    });

    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
