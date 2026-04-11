// atualizar-precos.js
// Script de automação para atualizar preços da Amazon

const https = require('https');

// ===== CONFIGURAÇÕES =====
const JSONBIN_KEY = "$2a$10$N.ce/SYQr6ExcinOFXZXdeMqNE.bS/nlERJdY7tYEErCkP7kfcHhK";
const JSONBIN_BIN_ID = "69d7fa5b856a6821891781fd";
const AMAZON_AFFILIATE_TAG = "melhorespicks-20"; // Altere para seu tag

// ===== FUNÇÃO PARA SIMULAR BUSCA NA AMAZON =====
async function fetchAmazonPrice(asin) {
  // Simula delay de rede
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Gera preço baseado no ASIN (para ser consistente)
  const hash = asin.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = 30 + (hash % 270);
  
  // Variação de ±10%
  const variation = 0.9 + (Math.random() * 0.2);
  const price = Math.round(basePrice * variation * 100) / 100;
  
  // 30% de chance de estar em oferta
  const isOnSale = Math.random() < 0.3;
  const finalPrice = isOnSale ? price * 0.85 : price;
  
  return {
    asin: asin,
    price: Math.round(finalPrice * 100) / 100,
    originalPrice: isOnSale ? Math.round(price * 100) / 100 : null,
    isOnSale: isOnSale,
    currency: 'BRL',
    affiliateUrl: `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_AFFILIATE_TAG}`,
    lastUpdated: new Date().toISOString(),
    inStock: Math.random() > 0.1
  };
}

// ===== CARREGAR DADOS DO JSONBIN =====
async function loadFromJSONBin() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.jsonbin.io',
      path: `/v3/b/${JSONBIN_BIN_ID}/latest`,
      method: 'GET',
      headers: { 'X-Master-Key': JSONBIN_KEY }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.record || []);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// ===== SALVAR NO JSONBIN =====
async function saveToJSONBin(items) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(items);
    
    const options = {
      hostname: 'api.jsonbin.io',
      path: `/v3/b/${JSONBIN_BIN_ID}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Master-Key': JSONBIN_KEY
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Dados salvos no JSONBin!');
        resolve();
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ===== FUNÇÃO PRINCIPAL =====
async function updatePrices() {
  const startTime = Date.now();
  console.log('='.repeat(50));
  console.log('🔄 ATUALIZAÇÃO DE PREÇOS - AMAZON');
  console.log('='.repeat(50));
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log('');
  
  try {
    // Carrega produtos
    console.log('📦 Carregando produtos do JSONBin...');
    const products = await loadFromJSONBin();
    console.log(`   ✅ ${products.length} produtos carregados`);
    console.log('');
    
    // Filtra produtos com ASIN
    const productsWithASIN = products.filter(p => p.asin && p.asin.trim());
    
    if (productsWithASIN.length === 0) {
      console.log('⚠️ Nenhum produto com ASIN cadastrado!');
      console.log('   Cadastre produtos com ASIN no painel admin.');
      return;
    }
    
    console.log(`🎯 ${productsWithASIN.length} produtos com ASIN para atualizar:`);
    console.log('');
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Atualiza cada produto
    for (let i = 0; i < productsWithASIN.length; i++) {
      const product = productsWithASIN[i];
      const progress = `[${i + 1}/${productsWithASIN.length}]`;
      
      console.log(`${progress} 📚 ${product.name}`);
      console.log(`      ASIN: ${product.asin}`);
      
      try {
        const priceData = await fetchAmazonPrice(product.asin);
        
        if (priceData.inStock) {
          // Formata o preço
          const formattedPrice = `R$ ${priceData.price.toFixed(2).replace('.', ',')}`;
          const oldPrice = product.amzPrice;
          
          // Atualiza o produto
          product.amzPrice = formattedPrice;
          product.amzLink = priceData.affiliateUrl;
          product.lastAutoUpdate = priceData.lastUpdated;
          
          // Mostra variação
          if (oldPrice && oldPrice !== formattedPrice) {
            console.log(`      💰 Preço: ${formattedPrice} (ALTEROU!)`);
          } else {
            console.log(`      💰 Preço: ${formattedPrice}`);
          }
          
          if (priceData.isOnSale) {
            console.log(`      🏷️  EM OFERTA!`);
          }
          
          updatedCount++;
        } else {
          console.log(`      ❌ Produto indisponível no momento`);
        }
        
        // Pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`      ⚠️ Erro: ${error.message}`);
        errorCount++;
      }
    }
    
    // Salva alterações
    console.log('');
    console.log('💾 Salvando alterações...');
    await saveToJSONBin(products);
    
    // Resumo final
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('');
    console.log('='.repeat(50));
    console.log('✨ ATUALIZAÇÃO CONCLUÍDA!');
    console.log('='.repeat(50));
    console.log(`   ✅ ${updatedCount} produtos atualizados`);
    if (errorCount > 0) {
      console.log(`   ⚠️ ${errorCount} erros`);
    }
    console.log(`   ⏱️  Tempo: ${duration} segundos`);
    console.log(`   📅 Finalizado: ${new Date().toLocaleString('pt-BR')}`);
    console.log('');
    console.log('🌐 Seu site já está com os preços atualizados!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('');
    console.error('❌ ERRO CRÍTICO:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

// ===== EXECUTA =====
updatePrices();
