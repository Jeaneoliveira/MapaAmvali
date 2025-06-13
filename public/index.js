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
  MERCADO: { color: "#1E90FF", highlight: "##1E90FF" },
  FACULDADE: { color: "#FFA500", highlight: "#FFCC66" },
  "POSTO DE SAÚDE": { color: "#8FBC8F", highlight: "#8FBC8F" },
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

        map.addSource("locais-source", {
          type: "geojson",
          data: { type: "FeatureCollection", features: heatmapData },
        });

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
              "rgba(0, 242, 255, 0)",
              0.1,
              "rgb(8, 86, 255)",
              0.3,
              "rgb(0, 234, 255)",
              0.5,
              "rgb(255, 255, 0)",
              0.7,
              "rgb(0, 255, 21)",
              1,
              "rgb(255, 0, 0)",
            ],
            "heatmap-opacity": 1,
          },
        });

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
});
