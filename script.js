document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
        d3.json("updated_philazip.geojson"), // GeoJSON for ZIP boundaries
        d3.csv("busstops.csv"),              // CSV for bus stops
        d3.csv("UPDATEDIndego.csv")          // CSV for Indigo stations
    ]).then(function ([geojson, busStops, indigoStations]) {
        console.log("Loaded ZIP boundaries, bus stops, and Indigo stations.");

        const width = window.innerWidth;
        const height = window.innerHeight;

        const svg = d3.select("#map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const g = svg.append("g");

        const projection = d3.geoMercator()
            .center([-75.1652, 39.9526])  // Philadelphia center
            .scale(50000);

        const path = d3.geoPath().projection(projection);

        // Zoom controls
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

        // RBush spatial index for bus stops
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

        // Count bus stops per ZIP
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

        // Draw ZIP code regions
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

        // Add Indigo stations as green dots
        indigoStations.forEach(station => {
            const lat = parseFloat(station.Latitude);
            const lon = parseFloat(station.Longitude);
            const [x, y] = projection([lon, lat]);

            g.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 1)
                .attr("fill", "green")
                .on("mouseover", function () {
                    d3.select(this).attr("r", 7);
                    g.append("text")
                        .attr("x", x + 10)
                        .attr("y", y - 10)
                        .attr("fill", "black")
                        .attr("font-size", "12px")
                        .attr("id", "bike-label")
                        .text(station.Station_Name);
                })
                .on("mouseout", function () {
                    d3.select(this).attr("r", 1);
                    g.select("#bike-label").remove();
                });
        });

        // Added train routes, uncomment this to enable it!
//        d3.json("Highspeed_Lines.geojson").then(trainData => {
//            g.selectAll(".train-line")
//                .data(trainData.features)
//                .enter()
//                .append("path")
//                .attr("class", "train-line")
//                .attr("d", path)
//                .attr("fill", "none")
//                .attr("stroke", "orange")
//                .attr("stroke-width", 2);
//        }).catch(error => {
//            console.error("Error loading train route data:", error);
//        });

    }).catch(function (error) {
        console.error("Error loading data:", error);
    });
});
