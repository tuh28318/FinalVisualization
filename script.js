document.addEventListener("DOMContentLoaded", function () {
    // Load GeoJSON, bus stop CSV, and Indego station CSV
    Promise.all([
        d3.json("updated_philazip.geojson"),
        d3.csv("busstops.csv"),
        d3.csv("UPDATEDIndego.csv")
    ]).then(function([geojson, busStops, indigoStations]) {
        console.log("Loaded ZIP boundaries, bus stop data, and Indigo stations.");

        const width = window.innerWidth;
        const height = window.innerHeight;

        const svg = d3.select("#map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Group to contain all map elements
        const g = svg.append("g");

        // Projection and path setup
        const projection = d3.geoMercator()
            .center([-75.1652, 39.9526])  // Philadelphia center
            .scale(50000);

        const path = d3.geoPath().projection(projection);

        let zoomScale = 50000; // Initial zoom level

        // Store markers separately for re-rendering
        const busStopData = [];
        const indigoStationData = [];

        // Store bus stop data
        busStops.forEach(function(d) {
            busStopData.push({
                lat: parseFloat(d.Lat),
                lon: parseFloat(d.Lon),
                route: d.Route,
                direction: d.Direction
            });
        });

        // Store bike station data
        indigoStations.forEach(function(station) {
            indigoStationData.push({
                lat: parseFloat(station.Latitude),
                lon: parseFloat(station.Longitude),
                name: station.Station_Name
            });
        });

        // Draw the base map (ZIP boundaries)
        g.selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "lightblue")
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // Draw markers for bus stops and bike stations
        function drawMarkers() {
            g.selectAll(".bus-stop").remove();
            g.selectAll(".bike-station").remove();

            // Bus stops
            busStopData.forEach(function(d) {
                const [x, y] = projection([d.lon, d.lat]);

                g.append("circle")
                    .attr("class", "bus-stop")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 1.5)
                    .attr("fill", "red")
                    .on("mouseover", function() {
                        d3.select(this).attr("fill", "orange");
                        g.append("text")
                            .attr("x", x + 5)
                            .attr("y", y - 5)
                            .attr("fill", "black")
                            .attr("font-size", "12px")
                            .attr("id", "bus-label")
                            .text(`${d.route} - ${d.direction}`);
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("fill", "red");
                        g.select("#bus-label").remove();
                    });
            });

            // Bike stations
            indigoStationData.forEach(function(station) {
                const [x, y] = projection([station.lon, station.lat]);

                g.append("text")
                    .attr("class", "bike-station")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("font-size", "20px")
                    .attr("text-anchor", "middle")
                    .attr("alignment-baseline", "middle")
                    .text("🚲")
                    .on("mouseover", function() {
                        d3.select(this).attr("font-size", "26px");
                        g.append("text")
                            .attr("x", x + 10)
                            .attr("y", y - 10)
                            .attr("fill", "black")
                            .attr("font-size", "12px")
                            .attr("id", "bike-label")
                            .text(station.name);
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("font-size", "20px");
                        g.select("#bike-label").remove();
                    });
            });
        }

        // Initial marker draw
        drawMarkers();

        // Re-render map and markers on zoom
        function updateMapScale() {
            projection.scale(zoomScale);
            g.selectAll("path").attr("d", path);
            drawMarkers();
        }

        // Button listeners
        document.getElementById("zoom-in").addEventListener("click", function () {
            zoomScale *= 1.25;
            updateMapScale();
        });

        document.getElementById("zoom-out").addEventListener("click", function () {
            zoomScale /= 1.25;
            updateMapScale();
        });

    }).catch(function(error) {
        console.error("Error loading data:", error);
    });
});
