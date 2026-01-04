/* jshint esversion: 6, node: true, devel: true, asi: true */
/* jshint -W030, -W033 */

// main/static/js/maps.js

// Exposed so the Google async loader (in the template) can call it safely.
async function initMap() {
  const el = document.getElementById("map");
  if (!el) return; // nothing to do

  // --- Read configuration from data-* attributes (set in the template) ---
  const lat = parseFloat(el.dataset.lat || "45.44110705149633");
  const lng = parseFloat(el.dataset.lng || "9.220700957234282");
  const pinUrl = el.dataset.pinUrl || ""; // e.g., "{% static 'images/map_pin.webp' %}"
  // Optional: provide a Cloud Map ID via data-map-id, or fall back to your existing one.
  const mapId = el.dataset.mapId || "2e3879b57b31501dd7f256c3"; // replace if you like

  const center = { lat, lng };

  // --- Load Google libraries via the official async loader pattern ---
  // (The loader script is in your template and provides google.maps.importLibrary)
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  // --- Create the map ---
  const mapOptions = {
    center,
    zoom: 16,
  };
  if (mapId) {
    mapOptions.mapId = mapId; // only set if present
  }

  const map = new Map(el, mapOptions);

  // --- Create a custom marker (AdvancedMarkerElement) if pinUrl is provided ---
  let markerOptions = { map, position: center, title: "The English Studio" };

  if (pinUrl) {
    const img = document.createElement("img");
    img.src = pinUrl;            // resolved by Django `{% static %}` in the template
    img.alt = "Location pin";
    img.style.width = "90px";
    img.style.height = "auto";
    img.loading = "lazy";
    markerOptions.content = img; // custom content for AdvancedMarkerElement
  }

  new AdvancedMarkerElement(markerOptions);
}

// Make it available globally; the template calls it after the loader is ready.
window.initMap = initMap;

// Auto-init on pages that contain #map
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) {
    initMap().catch(err => console.error('[maps] init failed:', err));
  }
});

