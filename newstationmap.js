var map = L.map('newmap', {
    center: [39.9756, -75.1810],
    zoom: 12.5
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors & CartoDB',
    maxZoom: 19
}).addTo(map);

// Reusable function with color parameter
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

// Load original stations (blue)
fetch("/data/stations.geojson")
    .then(response => response.json())
    .then(data => addGeoJSONToMap(data, "#002169"))  // dark blue
    .catch(error => {
        console.error('Error loading stations.geojson:', error);
        alert("There was an issue loading the station data.");
    });

// Load new stations (orange)
fetch("/data/newstations.geojson")
    .then(response => response.json())
    .then(data => addGeoJSONToMap(data, "#93d500"))  
    .catch(error => {
        console.error('Error loading newstations.geojson:', error);
        alert("There was an issue loading the new station data.");
    });
