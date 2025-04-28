document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
        d3.json("PhiladelphiaMap.geojson"), // GeoJSON for ZIP boundaries
        d3.csv("IndegoStations.csv"),      // CSV for Indego stations
        d3.csv("start_station_counts_with_names.csv") // CSV for station counts
    ]).then(function ([geojson, indigoStations, stationCounts]) {
        // console.log("Loaded ZIP boundaries, Indigo stations, and station counts.");

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
            .center([-75.1652, 40.0000])  // Center on Philadelphia
            .scale(100000); // Set an appropriate scale for the map

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

        // Create a color scale for the station counts
        const countValues = stationCounts.map(d => +d.count); // Extract the counts as numbers
        const countColorScale = d3.scaleSequential()
            .domain([d3.min(countValues), d3.max(countValues)]) // Set domain to the min and max counts
            .range(["lightblue", "darkblue"]); // Use a color range from light to dark green

        // Draw the ZIP code boundaries on the map
        g.selectAll("path.zip")
            .data(geojson.features) // Bind the data to the path elements
            .enter()
            .append("path") // Append a new path for each ZIP region
            .attr("class", "zip")
            .attr("d", path) // Set the path data based on the projection
            .attr("fill", "gray") // Set the fill color of the ZIP regions
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
            })
            .on("mouseout", function () {
                // Reset the ZIP region color and remove the label on mouseout
                d3.select(this).attr("fill", "gray");
                g.select("#zip-label").remove(); // Remove the label
            });

        // Add Indigo bike stations as circles with color based on count
        indigoStations.forEach(station => {
            const lat = parseFloat(station.Latitude); // Get the latitude of the station
            const lon = parseFloat(station.Longitude); // Get the longitude of the station
            const [x, y] = projection([lon, lat]); // Project the coordinates onto the map

            // Find the station count from the start_station_with_names.csv
            const stationCount = stationCounts.find(d => d.Station_Name === station.Station_Name);
            const count = stationCount ? +stationCount.count : 0; // Get the count, default to 0 if not found

            g.append("circle") // Append a circle for each station
                .attr("cx", x) // Set the x-coordinate
                .attr("cy", y) // Set the y-coordinate
                .attr("r", 3) // Set the radius
                .attr("fill", count > 0 ? countColorScale(count) : "lightgray") // Set color based on count
                .on("mouseover", function () {
                    // Enlarge the dot and display the station name and count on mouseover
                    d3.select(this)
                    .raise()
                    .attr("r", 10);
            
                // Create a group to hold the box and text together
                const tooltipGroup = g.append("g")
                    .attr("id", "bike-tooltip");
            
                // The text element
                const text = tooltipGroup.append("text")
                    .attr("x", x + 10)
                    .attr("y", y - 10)
                    .attr("fill", "black")
                    .attr("font-size", "12px")
                    .text(`${station.Station_Name} - Count: ${count}`);
            
                // After the text is created, we know its size
                const bbox = text.node().getBBox();
            
                // Add a rectangle behind the text
                tooltipGroup.insert("rect", "text") // insert rect *before* text
                    .attr("x", bbox.x - 5) // a little padding
                    .attr("y", bbox.y - 3)
                    .attr("width", bbox.width + 10)
                    .attr("height", bbox.height + 6)
                    .attr("rx", 5) // rounded corners
                    .attr("ry", 5)
                    .attr("fill", "white")
                    .attr("opacity", 0.7)
                    .attr("stroke", "black")
                    .attr("stroke-width", 0.5);
            })
            .on("mouseout", function () {
                d3.select(this).attr("r", 3);
                g.select("#bike-tooltip").remove(); // Remove the group
            });
        });

    }).catch(function (error) {
        console.error("Error loading data:", error); // Handle any data loading errors
    });
});
