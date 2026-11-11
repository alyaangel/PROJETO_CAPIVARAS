// 1. Inicializar Mapa (exemplo centrado em Joinville/SC)
const map = L.map('map').setView([-26.3045, -48.8487], 13);

// Camada base do OpenStreetMap
const baseMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 2. Dados Fictícios de Unidades de Saúde
const healthUnits = [
  {
    id: 1,
    name: "UBS Central - Capivara Saudável",
    type: "Unidade Básica de Saúde",
    lat: -26.3015,
    lng: -48.8450,
    streetInfo: "Rua asfaltada, calçadas com piso tátil e rampa de acesso na entrada.",
    floodRisk: "Risco baixo de alagamento nas imediações.",
    ratings: {
      easyAccessPct: 82, // 82% acham fácil
      publicTransportPct: 75,
      totalReviews: 128
    }
  },
  {
    id: 2,
    name: "Centro de Especialidades Médicas",
    type: "Unidade Especializada",
    lat: -26.3150,
    lng: -48.8550,
    streetInfo: "Via de paralelepípedo com aclive moderado. Estacionamento preferencial próximo.",
    floodRisk: "Região com tendência a acúmulo de poças d'água durante maré alta.",
    ratings: {
      easyAccessPct: 58,
      publicTransportPct: 40,
      totalReviews: 94
    }
  }
];

// 3. Manchas de Alagamento (Polígonos com classificação por cor)
const floodZones = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { level: "grave", color: "#dc143c" }, // Vermelho: grave
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-48.8480, -26.3080],
          [-48.8420, -26.3080],
          [-48.8440, -26.3150],
          [-48.8500, -26.3130]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { level: "moderada", color: "#ffd700" }, // Amarelo: moderada
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-48.8530, -26.3000],
          [-48.8470, -26.3010],
          [-48.8480, -26.3060],
          [-48.8550, -26.3050]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { level: "baixa", color: "#1e90ff" }, // Azul: menos afetada
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-48.8350, -26.2950],
          [-48.8300, -26.2980],
          [-48.8330, -26.3030],
          [-48.8380, -26.3000]
        ]]
      }
    }
  ]
};

// Camada GeoJSON das Manchas
const floodLayer = L.geoJSON(floodZones, {
  style: (feature) => ({
    color: feature.properties.color,
    weight: 2,
    fillColor: feature.properties.color,
    fillOpacity: 0.4
  })
}).addTo(map);

// Controle de Camadas (Permite ligar/desligar o mapa de alagamentos)
const overlays = {
  "Manchas de Alagamento": floodLayer
};
L.control.layers(null, overlays, { collapsed: false }).addTo(map);

// 4. Marcadores das Unidades de Saúde
const sidebarContent = document.getElementById('sidebar-content');
let routingControl = null;

healthUnits.forEach(unit => {
  const marker = L.marker([unit.lat, unit.lng]).addTo(map);

  marker.on('click', () => {
    updateSidebar(unit);
  });
});

// Atualiza o painel com as informações de acesso e avaliações
function updateSidebar(unit) {
  sidebarContent.innerHTML = `
    <span class="unit-tag">${unit.type}</span>
    <h2>${unit.name}</h2>

    <p class="section-title">Infraestrutura da Rua</p>
    <p style="font-size: 0.85rem; color: #333;">${unit.streetInfo}</p>

    <p class="section-title">Histórico de Alagamento</p>
    <p style="font-size: 0.85rem; color: #333;">${unit.floodRisk}</p>

    <p class="section-title">Avaliação dos Usuários (${unit.ratings.totalReviews} votos)</p>
    
    <label style="font-size: 0.8rem; font-weight: 600;">Facilidade de Acesso: ${unit.ratings.easyAccessPct}%</label>
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: ${unit.ratings.easyAccessPct}%;"></div>
    </div>

    <label style="font-size: 0.8rem; font-weight: 600;">Acesso por Transporte Público: ${unit.ratings.publicTransportPct}%</label>
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: ${unit.ratings.publicTransportPct}%; background: #3b82f6;"></div>
    </div>

    <button class="route-btn" onclick="calculateRoute(${unit.lat}, ${unit.lng})">
      Calcular Rota até Aqui
    </button>
  `;
}

// 5. Cálculo de Rota usando Leaflet Routing Machine e Geolocalização
window.calculateRoute = function(destLat, destLng) {
  if (routingControl) {
    map.removeControl(routingControl);
  }

  // Tenta pegar a localização atual do usuário
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        routingControl = L.Routing.control({
          waypoints: [
            L.latLng(userLat, userLng),
            L.latLng(destLat, destLng)
          ],
          routeWhileDragging: false,
          language: 'pt-BR'
        }).addTo(map);
      },
      () => {
        alert("Não foi possível obter sua localização. Traçando rota a partir do centro padrão.");
        // Ponto padrão caso o usuário recuse a permissão
        routingControl = L.Routing.control({
          waypoints: [
            L.latLng(-26.3045, -48.8487),
            L.latLng(destLat, destLng)
          ],
          language: 'pt-BR'
        }).addTo(map);
      }
    );
  }
};

// Botão de fechar painel
document.getElementById('close-btn').addEventListener('click', () => {
  sidebarContent.innerHTML = `
    <h2>Selecione uma unidade no mapa</h2>
    <p class="placeholder-text">Clique sobre qualquer ícone de unidade de saúde para ver condições de acesso, avaliações e traçar rotas.</p>
  `;
});