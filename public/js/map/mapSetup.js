export function initializeMap() {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiamVhbmUwbGl2ZWlyYSIsImEiOiJjbTJ0MnczcncwNDFiMmpva2I0NXdjaG4xIn0.8nO94q3qB1taLzYnnLQnyA";
  console.log("Token carregado com sucesso"); // corrigido

  return new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [-49.0664, -26.4831],
    zoom: 12,
  });
}
