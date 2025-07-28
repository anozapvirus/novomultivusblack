export function register() {
  console.log("Registrando service worker", navigator);
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      const urlVersion = `${process.env.PUBLIC_URL}/version.json`;
      console.log("swUrl", swUrl);
       // Verificação periódica a cada 5 segundos
       setInterval(() => checkForUpdate(urlVersion), 5000);
      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          console.log('Service worker registrado com sucesso!', registration);
        })
        .catch((error) => {
          console.error('Erro durante o registro do service worker:', error);
        });
    });
  }
}

// Função para verificar atualizações de versão
function checkForUpdate(urlVersion) {
  fetch(urlVersion)
    .then((response) => response.json())
    .then((data) => {
      

      const currentVersion = window.localStorage.getItem("version-app");

      if(!currentVersion) {
        window.localStorage.setItem("version-app", data.version);
        return
      }
      if (data.version !== currentVersion) {
        // Salva a nova versão no localStorage
        window.localStorage.setItem("version-app", data.version);

        // Mostra mensagem para o usuário
        showUpdateNotification(() => {
          // Desregistra o Service Worker, limpa dados e recarrega a página
          unregister().then(() => clearAppDataAndReload());
        });
      }
    })
    .catch((error) => {
      console.error('Erro ao obter a versão do frontend:', error);
    });
}

// Função para exibir a notificação de atualização
function showUpdateNotification() {
  // Cria o container principal do popup
  const updateDiv = document.createElement('div');
  updateDiv.id = 'updatePopup';
  updateDiv.style.position = 'fixed';
  updateDiv.style.top = '0';
  updateDiv.style.left = '0';
  updateDiv.style.width = '100vw';
  updateDiv.style.height = '100vh';
  updateDiv.style.background = 'rgba(0, 0, 0, 0.6)';
  updateDiv.style.display = 'flex';
  updateDiv.style.alignItems = 'center';
  updateDiv.style.justifyContent = 'center';
  updateDiv.style.zIndex = '1000';

  // conteúdo do popup
  updateDiv.innerHTML = `
    <div style="
      background: linear-gradient(145deg, #ffffff, #f3f4f6);
      z-index: 9999999999999;
      padding: 30px;
      width: 350px;
      max-width: 90%;
      border-radius: 15px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      text-align: center;
      position: relative;
      animation: fadeIn 0.3s ease-out;
    ">
      <div style="width: 120px; height: auto; margin-bottom: 20px; display: inline-flex" >
      <?xml version="1.0" encoding="UTF-8"?>
      <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 96 99">
        <!-- Generator: Adobe Illustrator 29.1.0, SVG Export Plug-In . SVG Version: 2.1.0 Build 93)  -->
        <defs>
          <style>
            .st0 {
              fill: url(#linear-gradient);
            }
          </style>
          <linearGradient id="linear-gradient" x1="24.5" y1="63.2" x2="71.7" y2="19.9" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#47bda6"/>
            <stop offset="1" stop-color="#23b6ea"/>
          </linearGradient>
        </defs>
        <path class="st0" d="M74.8,44.1c-.5-.7-.9-1.8-.9-2.7,0-5.5,0-11,0-16.4,0-.8,0-1.7-.3-2.5-1.1-3.1-4.8-3.9-7.5-1.6-2.8,2.5-5.6,5-8.3,7.4-6.6-4.2-12.9-4.2-19.5,0-2.8-2.5-5.5-4.9-8.2-7.3-1.6-1.4-3.3-2-5.3-1.1-2,.9-2.6,2.6-2.6,4.7,0,5.6,0,11.2,0,16.8,0,.8-.2,1.7-.7,2.3-4.3,6-3.8,12.6,1.5,17.7,4.8,4.6,9.6,9.2,14.5,13.7,5.8,5.3,15,5.5,20.8.2,5.2-4.7,10.2-9.5,15.2-14.4,4.8-4.7,5.2-11.5,1.3-16.9ZM68,23c.5-.4,1.4-.8,1.9-.5.6.3,1.1,1.1,1.1,1.8.2,1.3.1,2.6,0,3.9,0,.5-.3,1.2-.7,1.5-1.8,1.7-3.6,3.3-5.6,5-1.6-1.5-3.3-2.9-5-4.5,2.9-2.6,5.5-5,8.2-7.3ZM57.5,45c2.2-2,4.7-4.2,7.3-6.5,1.7,1.6,3.4,3,5.1,4.6-1.5,1.3-2.8,2.5-4.3,3.6-.3.3-1,.2-1.5.1-2.2-.6-4.3-1.2-6.6-1.8ZM62.7,49.4c-2.2,1.9-4.3,3.7-6.4,5.5-1.5-1.9-1.4-3.8,0-5.4,1.5-1.6,3.9-1.7,6.5-.2ZM66.9,36.6c1.4-1.2,2.6-2.3,4.1-3.7v7.4c-1.5-1.4-2.7-2.5-4.1-3.7ZM55.3,30.3c-5.7,6.5-9.1,6.5-14.6,0,3.9-3.3,10.4-3.3,14.6,0ZM25.5,23c.2-1.1,1.7-.9,2.6,0,2.6,2.4,5.3,4.7,8.2,7.3-1.7,1.6-3.3,3-5,4.5-2-1.8-4.5-3.2-5.7-5.3-.9-1.7-.5-4.3-.1-6.4ZM31.7,47c-.4.1-.9,0-1.2-.2-1.4-1.1-2.8-2.4-4.3-3.7,1.8-1.6,3.3-3,5.1-4.6,2.5,2.2,5,4.5,7.3,6.5-2.3.7-4.6,1.4-6.8,2ZM39.6,49.3c1.6,1.4,1.7,3.1.4,5.8-2.2-1.9-4.3-3.8-6.5-5.6,2.1-1.5,4.5-1.5,6.1-.2ZM25.1,40.4v-7.4c1.5,1.3,2.7,2.4,4.1,3.6-1.3,1.2-2.5,2.3-4.1,3.8ZM24.2,45.1c1.6,1.4,3.2,2.7,4.8,4.2-2.4,3-4,6.3-3.5,10.5-4.9-3.7-5.4-10.2-1.3-14.7ZM35.6,62.6c-.6,1.9-.6,3.9-.9,5.8-6.7-3.3-8.6-11.9-3.4-17.2,2.3,2,4.7,4,6.9,6-.9,1.9-2,3.6-2.6,5.4ZM45.7,76.3c1.6-1.9,3-1.9,4.7,0h-4.7ZM44.8,66.2c.4-1.6,1.8-2.3,3.3-2.2,1.6,0,3,.7,3.3,2.3.5,2.5-1.8,3.3-3.3,5-1.6-1.7-3.8-2.5-3.3-5.1ZM56.6,72.6c-1.7,2.5-2,2.6-4.7,1.1-.4-.2-.8-.5-1.3-.8,1.6-2,4.2-3.7,3.5-6.7-.3-1.3-1.2-2.7-2.2-3.6-2.4-2.2-6.4-1.8-8.6.6-2.5,2.7-2,5.1,2,9.5,0,.1,0,.3-.1.3-3.8,2.5-4.9,2.2-6.6-2-1.8-4.5-.8-8.4,2.3-12.1,4.5-5.4,3.9-11.9-1.2-16.6-.4-.4-.8-.7-1.2-1-1.7-1.5-3.3-3-5.1-4.6,1.7-1.5,3.3-3,5-4.5,3.1,2.3,5.3,5.8,9.7,5.8,4.3,0,6.7-3.3,9.7-5.8,1.6,1.5,3.3,3,5,4.5-2.1,1.9-4.2,3.7-6.2,5.5-5.2,4.7-5.7,11.1-1.4,16.6,3.8,4.8,4.3,9.6,1.5,13.8ZM61.3,68.7c-.3-2-.3-4-.8-5.9-.5-1.9-1.6-3.5-2.6-5.6,2.2-1.9,4.5-3.9,6.8-5.9,5.4,4.9,3.8,11.7-3.3,17.4ZM70.6,59.6c.3-4-1.1-7.3-3.7-10.3,1.7-1.4,3.3-2.8,4.9-4.2,4.1,4.7,3.5,11.2-1.3,14.5Z"/>
      </svg>
      </div>
      <h2 style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px;">Atualização necessária!</h2>
      <p style="font-size: 16px; color: #666; line-height: 1.5; margin-bottom: 20px;">
        Adicionamos novos recursos e corrigimos bugs para tornar sua experiência ainda melhor.
      </p>
      <button id="updateButton" style="
        background: #25b6e8;
        color: white;
        font-size: 16px;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.3s, box-shadow 0.3s;
        box-shadow: 0 5px 15px rgba(90, 95, 237, 0.4);
      ">
        Atualizar Sistema
      </button>
    </div>
  `;

  // Adiciona o popup ao corpo da página
  document.body.appendChild(updateDiv);

  // Animação CSS para o popup
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    #updateButton:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(90, 95, 237, 0.5);
    }
  `;
  document.head.appendChild(style);

  // Adiciona o evento de clique ao botão para confirmar a atualização
  document.getElementById('updateButton').onclick = confirmUpdate;
}

// Função para confirmar atualização e fechar o popup
function confirmUpdate() {
  document.getElementById('updatePopup').remove();
  unregister().then(() => clearAppDataAndReload());
}
// Função para limpar todos os dados e recarregar a página
function clearAppDataAndReload() {

  clearCookies();

  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      caches.delete(cacheName);
    });
  });

  // Recarrega a página
  window.location.reload();
}

// Função para limpar todos os cookies
function clearCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
}

// Função para desregistrar o Service Worker
export function unregister() {
  return new Promise((resolve, reject) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.unregister().then(resolve).catch(reject);
        })
        .catch((error) => {
          console.error('Erro durante o desregistro do service worker:', error);
          reject(error);
        });
    } else {
      resolve();
    }
  });
}
