// Initialize Leaflet map
var map = L.map('newmap', {
    center: [39.9756, -75.1810],
    zoom: 12.5
});

// Add base tile layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors & CartoDB',
    maxZoom: 19
    }).addTo(map);

function addGeoJSONToMap(data, color) {
    L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 7,
                color: color,
                fillColor: color,
                fillOpacity: 0.85
            });
        },
        onEachFeature: function (feature, layer) {
            layer.bindTooltip(feature.properties.Station_Name, {
                permanent: false,
                direction: 'top',
                opacity: 0.8,
                offset: [0, -5]
            });

            // Add popup (on click)
            layer.bindPopup(`<b>${feature.properties.Station_Name}</b><br>Status: ${feature.properties.Status}<br>Go Live: ${feature.properties.Go_live_date}`);

            // Hover effect
            layer.on('mouseover', function () {
                this.setStyle({ radius: 12 });
                this.openTooltip();
            });
            layer.on('mouseout', function () {
                this.setStyle({ radius: 7 });
                this.closeTooltip();
            });
        }
    }).addTo(map);
}

// Load and display original stations (Indego Blue)
fetch("/data/stations.geojson")
    .then(response => response.json())
    .then(data => addGeoJSONToMap(data, "#002169"))
    .catch(error => {
        console.error('Error loading stations.geojson:', error);
        alert("There was an issue loading stations.geojson.");
    });

// Load and display new stations (Indego Green)
fetch("/data/newstations.geojson")
    .then(response => response.json())
    .then(data => addGeoJSONToMap(data, "#93d500"))  
    .catch(error => {
        console.error('Error loading newstations.geojson:', error);
        alert("There was an issue loading newstations.geojson.");
    });
