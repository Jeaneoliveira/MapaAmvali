import { initializeMap } from "./map/mapSetup.js";
import { setupHeatmap } from "./map/heatmap.js";
import { setupMarkers } from "./map/markers.js";
import { setupRouteControls } from "./map/routes.js";
import { setupMapControls } from "./map/controls.js";

document.addEventListener("DOMContentLoaded", () => {
  const map = initializeMap();

  map.on("load", () => {
    const markers = setupMarkers(map);
    setupHeatmap(map);
    setupRouteControls(map);
    setupMapControls(map, markers);
  });
});
