let markers = [];
let heatmapData = [];
let startPoint = null;
let endPoint = null;
let startMarker = null;
let endMarker = null;

// Mapeamento de tipos para cores
const tipoConfig = {
  HOSPITAL: { color: "#00FF00", highlight: "#00FF99" },
  "REDE ESTADUAL": { color: "#FF0000", highlight: "#FF6666" },
  "REDE PRIVADA": { color: "#FF0000", highlight: "#FF6666" },
  "REDE MUNICIPAL": { color: "#FF0000", highlight: "#FF6666" },
  INDUSTRIA: { color: "#800080", highlight: "#CC99FF" },
  "ÁREA COMERCIAL": { color: "#0000FF", highlight: "#6666FF" },
  MERCADO: { color: "#78866b", highlight: "#AABB99" },
  FACULDADE: { color: "#FFA500", highlight: "#FFCC66" },
};

// Carrega Turf.js dinamicamente
function loadTurf() {
  return new Promise((resolve, reject) => {
    if (window.turf) {
      resolve();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@turf/turf@6/turf.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    }
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Carrega Turf.js antes de iniciar
    await loadTurf();
    console.log("Turf.js carregado com sucesso");
  } catch (error) {
    console.error("Erro ao carregar Turf.js:", error);
    alert(
      "Erro ao carregar biblioteca de mapas. Por favor, recarregue a página."
    );
    return;
  }

  mapboxgl.accessToken =
    "pk.eyJ1IjoiamVhbmUwbGl2ZWlyYSIsImEiOiJjbTJ0MnczcncwNDFiMmpva2I0NXdjaG4xIn0.8nO94q3qB1taLzYnnLQnyA";

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [-49.0664, -26.4831],
    zoom: 12,
  });

  map.on("load", () => {
    fetch("http://localhost:3000/api/locais")
      .then((response) => {
        if (!response.ok)
          throw new Error("Erro na requisição: " + response.status);
        return response.json();
      })
      .then((data) => {
        console.log("Dados do PostgreSQL:", data);

        // Processa os dados com validação
        heatmapData = data.map((row) => {
          const tipo = row.tipo_local
            ? String(row.tipo_local).trim()
            : "DESCONHECIDO";
          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [
                parseFloat(row.longitude) || 0,
                parseFloat(row.latitude) || 0,
              ],
            },
            properties: {
              id: row.id || Date.now() + Math.random(),
              nome: row.nome || "Sem nome",
              endereco: row.endereco || "Endereço desconhecido",
              tipo: tipo,
              trafego: row.trafego || 0,
            },
          };
        });

        // Adiciona fonte de dados (para o heatmap)
        map.addSource("locais-source", {
          type: "geojson",
          data: { type: "FeatureCollection", features: heatmapData },
        });

        // Adiciona heatmap
        map.addLayer({
          id: "heatmap-layer",
          type: "heatmap",
          source: "locais-source",
          paint: {
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              20,
              9,
              30,
            ],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              1,
              9,
              3,
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(0, 0, 255, 0)",
              0.1,
              "rgb(0, 180, 255)",
              0.3,
              "rgb(0, 255, 0)",
              0.5,
              "rgb(255, 255, 0)",
              0.7,
              "rgb(255, 140, 0)",
              1,
              "rgb(255, 0, 0)",
            ],
            "heatmap-opacity": 0.8,
          },
        });

        // Adiciona marcadores para todos os locais
        heatmapData.forEach((point) => {
          const config = tipoConfig[point.properties.tipo] || {
            color: "#FF0000",
            highlight: "#FF9999",
          };
          const marker = new mapboxgl.Marker({ color: config.color })
            .setLngLat(point.geometry.coordinates)
            .setPopup(
              new mapboxgl.Popup().setHTML(`
              <strong>${point.properties.nome}</strong><br>
              ${point.properties.endereco}<br>
              Tipo: ${point.properties.tipo}<br>
              Tráfego: ${point.properties.trafego}
            `)
            )
            .addTo(map);

          // Armazena informações no elemento DOM do marcador
          const el = marker.getElement();
          el.dataset.localId = point.properties.id;
          el.dataset.tipo = point.properties.tipo;
          el.dataset.originalColor = config.color;
          el.dataset.highlightColor = config.highlight;

          markers.push(marker);
        });
      })
      .catch((error) => {
        console.error("Erro ao carregar dados:", error);
        alert(
          "Erro ao carregar dados do servidor. Verifique o console para detalhes."
        );
      });
  });

  // Controles do mapa
  document
    .getElementById("toggleHeatmap")
    .addEventListener("change", function () {
      if (map.getLayer("heatmap-layer")) {
        map.setLayoutProperty(
          "heatmap-layer",
          "visibility",
          this.checked ? "visible" : "none"
        );
      }
    });

  document
    .getElementById("toggleMarkers")
    .addEventListener("change", function () {
      markers.forEach((marker) =>
        this.checked ? marker.addTo(map) : marker.remove()
      );
    });

  // Configura marcadores de rota
  function setupMarker(buttonId, color, pointVar, markerVar) {
    document.getElementById(buttonId).addEventListener("click", function () {
      map.once("click", (e) => {
        if (window[markerVar]) window[markerVar].remove();
        window[pointVar] = e.lngLat;
        window[markerVar] = new mapboxgl.Marker({ color: color })
          .setLngLat(e.lngLat)
          .addTo(map);
      });
    });
  }

  setupMarker("markStart", "green", "startPoint", "startMarker");
  setupMarker("markEnd", "red", "endPoint", "endMarker");

  // Função para resetar todas as cores dos marcadores
  function resetMarkersColors() {
    markers.forEach((marker) => {
      const el = marker.getElement();
      const originalColor = el.dataset.originalColor;
      // Atualiza a cor diretamente no elemento do marcador
      el.style.backgroundColor = originalColor;
    });
  }

  // Função para destacar marcadores próximos à rota
  function highlightRouteMarkers(routeCoordinates) {
    resetMarkersColors();

    markers.forEach((marker) => {
      const markerCoords = marker.getLngLat();
      const isNearRoute = routeCoordinates.some((coord) => {
        return (
          turf.distance(
            turf.point([markerCoords.lng, markerCoords.lat]),
            turf.point([coord[0], coord[1]])
          ) < 0.5
        ); // Distância em quilômetros (500m)
      });

      if (isNearRoute) {
        const el = marker.getElement();
        const highlightColor = el.dataset.highlightColor || "#FFFF00";
        el.style.backgroundColor = highlightColor;
      }
    });
  }

  // Rotas
  document.getElementById("calculateRoute").addEventListener("click", () => {
    if (!startPoint || !endPoint) {
      alert("Defina o ponto de início e o destino.");
      return;
    }
    calcularRota(
      map,
      startPoint,
      endPoint,
      "driving",
      "#FF0000",
      "rota-principal"
    );
  });

  document
    .getElementById("calculateAlternativeRoute")
    .addEventListener("click", () => {
      if (!startPoint || !endPoint) {
        alert("Defina o ponto de início e o destino.");
        return;
      }
      calcularRota(
        map,
        startPoint,
        endPoint,
        "walking",
        "#00FF00",
        "rota-alternativa"
      );
    });

  document.getElementById("clearRoute").addEventListener("click", () => {
    // Remove as rotas do mapa
    ["rota-principal", "rota-alternativa"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    // Remove os marcadores de início e fim
    if (startMarker) startMarker.remove();
    if (endMarker) endMarker.remove();
    startPoint = endPoint = startMarker = endMarker = null;

    // Reseta as cores dos marcadores
    resetMarkersColors();
  });
  async function calcularRota() {
    if (!startPoint || !endPoint) {
      alert("Defina os pontos no mapa primeiro!");
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );

      const data = await response.json();
      console.log("Resposta da rota:", data);

      if (data.routes?.length > 0) {
        // Remove rota anterior se existir
        if (map.getLayer("rota")) map.removeLayer("rota");
        if (map.getSource("rota")) map.removeSource("rota");

        // Adiciona nova rota
        map.addSource("rota", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: data.routes[0].geometry,
          },
        });

        map.addLayer({
          id: "rota",
          type: "line",
          source: "rota",
          paint: {
            "line-color": "#ff0000",
            "line-width": 5,
          },
        });
      } else {
        alert("Nenhuma rota encontrada!");
      }
    } catch (error) {
      console.error("Erro ao calcular rota:", error);
      alert(`Erro: ${error.message}`);
    }
  }
});
