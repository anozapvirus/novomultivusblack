const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, 'public', 'version.json');

fs.readFile(versionFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erro ao ler o arquivo:', err);
    return;
  }

  const versionObject = JSON.parse(data);
  

  const newVersion = (parseInt(versionObject.version) + 1).toString();
  
  versionObject.version = newVersion;

  fs.writeFile(versionFilePath, JSON.stringify(versionObject, null, 2), (err) => {
    if (err) {
      console.error('Erro ao escrever no arquivo:', err);
      return;
    }
    console.log(`Versão atualizada para: ${newVersion}`);
  });
});
