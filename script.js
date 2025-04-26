document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
        d3.json("updated_philazip.geojson"), // GeoJSON file for ZIP boundaries
        d3.csv("busstops.csv"),              // CSV file for bus stops
        d3.csv("UPDATEDIndego.csv")          // CSV file for Indigo stations
    ]).then(function([geojson, busStops, indigoStations]) {
        console.log("Loaded ZIP boundaries, bus stop data, and Indigo station.");

        const width = window.innerWidth;
        const height = window.innerHeight;

        const svg = d3.select("#map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const g = svg.append("g");

        const projection = d3.geoMercator()
            .center([-75.1652, 39.9526])  // Philadelphia
            .scale(50000);

        const path = d3.geoPath().projection(projection);

        // Add zoom controls
        let currentScale = 1;
        const updateScale = () => g.attr("transform", `scale(${currentScale})`);

        document.getElementById("zoom-in").addEventListener("click", () => {
            currentScale *= 1.2;
            updateScale();
        });

        document.getElementById("zoom-out").addEventListener("click", () => {
            currentScale /= 1.2;
            updateScale();
        });

        // Build RBush spatial index for bus stops
        const busStopIndex = new RBush();
        const busStopPoints = busStops.map(d => {
            const lon = parseFloat(d.Lon);
            const lat = parseFloat(d.Lat);
            return {
                minX: lon,
                minY: lat,
                maxX: lon,
                maxY: lat,
                lon,
                lat
            };
        });
        busStopIndex.load(busStopPoints);

        // Count bus stops per ZIP using RBush
        geojson.features.forEach(feature => {
            const bounds = d3.geoBounds(feature);
            const minLon = bounds[0][0];
            const minLat = bounds[0][1];
            const maxLon = bounds[1][0];
            const maxLat = bounds[1][1];

            const candidates = busStopIndex.search({
                minX: minLon,
                minY: minLat,
                maxX: maxLon,
                maxY: maxLat
            });

            let count = 0;
            candidates.forEach(stop => {
                if (d3.geoContains(feature, [stop.lon, stop.lat])) {
                    count++;
                }
            });

            feature.properties.busStopCount = count;
        });

        // Draw the ZIP code map with mouseover info
        g.selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "lightblue")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .on("mouseover", function (event, d) {
                d3.select(this).attr("fill", "orange");
                const [x, y] = d3.pointer(event);
                g.append("text")
                    .attr("x", x)
                    .attr("y", y - 10)
                    .attr("fill", "black")
                    .attr("font-size", "12px")
                    .attr("id", "zip-label")
                    .text(`Bus Stops: ${d.properties.busStopCount}`);
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", "lightblue");
                g.select("#zip-label").remove();
            });

            indigoStations.forEach(station => {
                const lat = parseFloat(station.Latitude);
                const lon = parseFloat(station.Longitude);
                const [x, y] = projection([lon, lat]);
            
                g.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 1)  // Size of the circle
                    .attr("fill", "green")  // Color for Indigo stations
                    .on("mouseover", function () {
                        d3.select(this).attr("r", 7);  // Enlarge circle on hover
                        g.append("text")
                            .attr("x", x + 10)
                            .attr("y", y - 10)
                            .attr("fill", "black")
                            .attr("font-size", "12px")
                            .attr("id", "bike-label")
                            .text(station.Station_Name);
                    })
                    .on("mouseout", function () {
                        d3.select(this).attr("r", 1);  // Return to original size
                        g.select("#bike-label").remove();
                    });
            });

    }).catch(function(error) {
        console.error("Error loading data:", error);
    });
});
