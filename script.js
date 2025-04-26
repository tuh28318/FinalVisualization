document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
        d3.json("updated_philazip.geojson"), // GeoJSON for ZIP boundaries
        d3.csv("busstops.csv"),              // CSV for bus stops
        d3.csv("UPDATEDIndego.csv"),         // CSV for Indego stations
        d3.json("septabus_filtered.geojson") // GeoJSON for SEPTA bus routes
    ]).then(function ([geojson, busStops, indigoStations, busRoutes]) {
        console.log("Loaded ZIP boundaries, bus stops, Indigo stations, and bus routes.");

        const width = window.innerWidth;   // Get the window width
        const height = window.innerHeight; // Get the window height

        // Create an SVG element for the map
        const svg = d3.select("#map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const g = svg.append("g");

        // Set up the Mercator projection for the map with the center at Philadelphia
        const projection = d3.geoMercator()
            .center([-75.1652, 39.9526])  // Center on Philadelphia
            .scale(50000); // Set an appropriate scale for the map

        const path = d3.geoPath().projection(projection);

        // Create a zoom behavior with the ability to scale the map
        const zoom = d3.zoom()
            .scaleExtent([1, 20]) // Limit the zoom-in and zoom-out scale range
            .on("zoom", (event) => {
                // Apply the zoom to the projection scale and transform the map
                const transform = event.transform;
                const newProjection = projection.scale(transform.k * 50000); // Scale the map based on zoom level
                path.projection(newProjection); // Update path projection
                g.attr("transform", transform); // Apply the zoom transform to the group
            });

        // Apply zoom behavior to the SVG container
        svg.call(zoom);

        // Zoom in button event handler
        document.getElementById("zoom-in").addEventListener("click", () => {
            svg.transition().call(zoom.scaleBy, 1.2); // Zoom in by a factor of 1.2
        });

        // Zoom out button event handler
        document.getElementById("zoom-out").addEventListener("click", () => {
            svg.transition().call(zoom.scaleBy, 0.8); // Zoom out by a factor of 0.8
        });

        // Reset zoom button event handler
        document.getElementById("reset-zoom").addEventListener("click", () => {
            svg.transition().call(zoom.transform, d3.zoomIdentity); // Reset zoom to default scale
        });

        // Create an RBush spatial index for the bus stops to improve search performance
        const busStopIndex = new RBush();
        const busStopPoints = busStops.map(d => {
            const lon = parseFloat(d.Lon);  // Get longitude of bus stop
            const lat = parseFloat(d.Lat);  // Get latitude of bus stop
            return {
                minX: lon,
                minY: lat,
                maxX: lon,
                maxY: lat,
                lon,
                lat
            };
        });
        busStopIndex.load(busStopPoints); // Load the bus stop data into the spatial index

        // Count the number of bus stops within each ZIP code boundary
        geojson.features.forEach(feature => {
            const bounds = d3.geoBounds(feature); // Get the bounding box of the ZIP region
            const minLon = bounds[0][0];
            const minLat = bounds[0][1];
            const maxLon = bounds[1][0];
            const maxLat = bounds[1][1];

            // Use the spatial index to find potential bus stops within the bounding box
            const candidates = busStopIndex.search({
                minX: minLon,
                minY: minLat,
                maxX: maxLon,
                maxY: maxLat
            });

            let count = 0;
            // Check if the bus stops are inside the ZIP code region
            candidates.forEach(stop => {
                if (d3.geoContains(feature, [stop.lon, stop.lat])) {
                    count++; // Increment the bus stop count for this ZIP code
                }
            });

            feature.properties.busStopCount = count; // Store the bus stop count in the feature properties
        });

        // Draw the ZIP code boundaries on the map
        g.selectAll("path.zip")
            .data(geojson.features) // Bind the data to the path elements
            .enter()
            .append("path") // Append a new path for each ZIP region
            .attr("class", "zip")
            .attr("d", path) // Set the path data based on the projection
            .attr("fill", "lightblue") // Set the fill color of the ZIP regions
            .attr("stroke", "black") // Set the stroke color
            .attr("stroke-width", 1) // Set the stroke width
            .on("mouseover", function (event, d) {
                // Highlight the ZIP region and show the ZIP code on mouseover
                d3.select(this).attr("fill", "orange");
                const [x, y] = d3.pointer(event);
                g.append("text")
                    .attr("x", x)
                    .attr("y", y - 10)
                    .attr("fill", "black")
                    .attr("font-size", "12px")
                    .attr("id", "zip-label")
                    .text(`ZIP: ${d.properties.CODE}`); // Show ZIP code in the label
                    /*
                    // Old version showing bus stop count
                    .text(`Bus Stops: ${d.properties.busStopCount}`);
                    */
            })
            .on("mouseout", function () {
                // Reset the ZIP region color and remove the label on mouseout
                d3.select(this).attr("fill", "lightblue");
                g.select("#zip-label").remove(); // Remove the label
            });

        // Add Indigo bike stations as green dots
        indigoStations.forEach(station => {
            const lat = parseFloat(station.Latitude); // Get the latitude of the station
            const lon = parseFloat(station.Longitude); // Get the longitude of the station
            const [x, y] = projection([lon, lat]); // Project the coordinates onto the map

            g.append("circle") // Append a circle for each station
                .attr("cx", x) // Set the x-coordinate
                .attr("cy", y) // Set the y-coordinate
                .attr("r", 2) // Set the radius
                .attr("fill", "green") // Set the fill color to green
                .on("mouseover", function () {
                    // Enlarge the dot and display the station name on mouseover
                    d3.select(this).attr("r", 7);
                    g.append("text")
                        .attr("x", x + 10)
                        .attr("y", y - 10)
                        .attr("fill", "black")
                        .attr("font-size", "12px")
                        .attr("id", "bike-label")
                        .text(station.Station_Name); // Show the station name
                })
                .on("mouseout", function () {
                    // Reset the dot size and remove the station name on mouseout
                    d3.select(this).attr("r", 2);
                    g.select("#bike-label").remove(); // Remove the station name label
                });
        });

        // Draw SEPTA bus routes
        g.selectAll(".bus-route")
            .data(busRoutes.features) // Bind bus route data to the path elements
            .enter()
            .append("path") // Append a path for each bus route
            .attr("class", "bus-route")
            .attr("d", path) // Set the path data based on the projection
            .attr("fill", "none") // No fill for bus routes
            .attr("stroke", d => d.properties.route_color || "#000000") // Set the stroke color based on route color
            .attr("stroke-width", 1.5) // Set the stroke width
            .attr("opacity", 0.7) // Set the opacity for better visibility
            .on("mouseover", function(event, d) {
                // Display the route name on mouseover
                const [x, y] = d3.pointer(event);
                g.append("text")
                    .attr("x", x)
                    .attr("y", y - 10)
                    .attr("fill", "black")
                    .attr("font-size", "12px")
                    .attr("id", "route-label")
                    .text(d.properties.route_long_name || d.properties.route_short_name || "Unknown Route");
            })
            .on("mouseout", function() {
                // Remove the route name label on mouseout
                g.select("#route-label").remove();
            });

        // Optional: Add high-speed train routes (if data is available)
        d3.json("Highspeed_Lines.geojson").then(trainData => {
            g.selectAll(".train-line")
                .data(trainData.features) // Bind train route data to the path elements
                .enter()
                .append("path") // Append a path for each train route
                .attr("class", "train-line")
                .attr("d", path) // Set the path data based on the projection
                .attr("fill", "none") // No fill for train routes
                .attr("stroke", "orange") // Set the stroke color for train routes
                .attr("stroke-width", 1.5); // Set the stroke width for train routes
        }).catch(error => {
            console.error("Error loading train route data:", error);
        });

    }).catch(function (error) {
        console.error("Error loading data:", error); // Handle any data loading errors
    });
});
