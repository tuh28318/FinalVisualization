// Initialize the map
var map = L.map('newmap', {
    center: [39.9756, -75.1810],
    zoom: 12.5,
    zoomControl: true
});

// Base map layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors & CartoDB',
    maxZoom: 19
}).addTo(map);

// Load the GeoJSON station data
fetch('data/stations.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 7,
                    color: "#002169",
                    fillColor: "#002169",
                    fillOpacity: 0.85
                });
            },
            onEachFeature: function (feature, layer) {
                // Tooltip (on hover)
                layer.bindTooltip(feature.properties.Station_Name, {
                    permanent: false,
                    direction: 'top',
                    opacity: 0.8,
                    offset: [0, -5]
                });

                // Popup (on click)
                layer.bindPopup(`<b>${feature.properties.Station_Name}</b><br>Status: ${feature.properties.Status}<br>Go Live: ${feature.properties.Go_live_date}`);

                // Hover effects
                layer.on('mouseover', function (e) {
                    this.setStyle({ radius: 12 });
                    this.openTooltip();
                });
                layer.on('mouseout', function (e) {
                    this.setStyle({ radius: 7 });
                    this.closeTooltip();
                });
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));
