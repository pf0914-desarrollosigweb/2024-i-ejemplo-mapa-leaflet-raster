// Objeto de mapa Leaflet
var mapa = L.map("mapaid").setView([9.5, -84], 8);

// Capa base Positron de Carto
carto_positron = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  }
).addTo(mapa);

// Capa base de OSM Mapnik
var osm_mapnik = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});

// Capa base de ESRI World Imagery
var esri_imagery = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  }
);

// Objeto de capas base
var capasBase = {
  Positron: carto_positron,
  OSM: osm_mapnik,
  "ESRI World Imagery": esri_imagery,
};

// Control de capas
control_capas = L.control
  .layers(capasBase, null, { collapsed: false })
  .addTo(mapa);

// Capa raster de temperatura media anual
var url_to_geotiff_file = "datos/temperatura-media-anual.tif";

fetch(url_to_geotiff_file)
  .then((response) => response.arrayBuffer())
  .then((arrayBuffer) => {
    parseGeoraster(arrayBuffer).then((georaster) => {
      console.log("georaster:", georaster);

      var layer = new GeoRasterLayer({
        georaster: georaster,
        opacity: 0.7,
        pixelValuesToColorFn: function (value) {
          if (value <= 0) {
            return "rgba(255, 255, 255, 0.0)";
          } else if (value < 21.995) {
            return "rgb( 44, 123, 182 )";
          } else if (value < 25.379) {
            return "rgb( 255, 255, 191 )";
          } else if (value < 26.212) {
            return "rgb( 253, 174, 97 )";
          } else {
            return "rgb( 215, 25, 28 )";
          }
        },
        resolution: 256, // optional parameter for adjusting display resolution
      });
      layer.addTo(mapa);

      // Límites de la capa
      mapa.fitBounds(layer.getBounds());

      // Se agrega la capa raster al control de capas
      control_capas.addOverlay(layer, "Temperatura media anual");

      // Evento onClick
      mapa.on("click", function (event) {
        console.log(event, "event");

        var lat = event.latlng.lat;
        var lng = event.latlng.lng;
        var tmp = geoblaze.identify(georaster, [lng, lat]);

        // Borrar marcadores previos
        mapa.eachLayer(function (layer) {
          if (layer instanceof L.Marker) {
            mapa.removeLayer(layer);
          }
        });

        // Marcador con ventana popup
        var marcador = L.marker([lat, lng])
          .addTo(mapa)
          .bindPopup("Temperatura media anual: " + Math.round(tmp, 2) + " °C")
          .openPopup();
      });
    });
  });

// Control de escala
L.control.scale().addTo(mapa);
