document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
        d3.json("PhiladelphiaMap.geojson"),
        d3.csv("IndegoStations.csv"),
        d3.csv("start_station_counts_with_names.csv")
    ]).then(function ([geojson, indigoStations, stationCounts]) {
        
        
        // read width and height from #map div
        const container = document.getElementById('map');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        const svg = d3.select("#map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const g = svg.append("g"); // Group to hold map content

        // Set up the Mercator projection for the map with the center at Philadelphia
        const projection = d3.geoMercator()
            .center([-75.1652, 40.0000])  // Center on Philadelphia
            .scale(180000); // Set an appropriate scale for the map

        const path = d3.geoPath().projection(projection); // Path generator for map features

        // Create a zoom behavior with scale limits
        const zoom = d3.zoom()
            .scaleExtent([1, 20]) // Set zoom limits
            .on("zoom", (event) => {
                g.attr("transform", event.transform); // Apply zoom transform to the group element
            });

        // Apply the zoom behavior to the SVG element
        svg.call(zoom);

        // Select the zoom control buttons from the HTML (based on their classes)
        const zoomInMap = document.querySelector("#zoom-controls-map .zoom-in");
        const zoomOutMap = document.querySelector("#zoom-controls-map .zoom-out");
        const resetZoomMap = document.querySelector("#zoom-controls-map .reset-zoom");

        // Zoom in button event handler
        zoomInMap.addEventListener("click", () => {
            svg.transition().call(zoom.scaleBy, 1.2); // Zoom in by 1.2x
        });

        // Zoom out button event handler
        zoomOutMap.addEventListener("click", () => {
            svg.transition().call(zoom.scaleBy, 0.8); // Zoom out by 0.8x
        });

        // Reset zoom button event handler
        resetZoomMap.addEventListener("click", () => {
            svg.transition()
                .duration(750) // 750ms smooth transition
                .ease(d3.easeCubicOut) // Apply easing for smooth effect
                .call(zoom.transform, d3.zoomIdentity); // Reset zoom to default scale
        });

        // Create a color scale for the station counts
        const countValues = stationCounts.map(d => +d.count); // Extract station counts
        const countColorScale = d3.scaleSequential()
            .domain([d3.min(countValues), d3.max(countValues)]) // Set the color scale based on station counts
            .range(["#e5e8f0", "#002169"]); // Use a color range from light to dark blue

        // Draw the ZIP code boundaries on the map
        g.selectAll("path.zip")
            .data(geojson.features) // Bind GeoJSON data
            .enter()
            .append("path") // Append a new path for each ZIP region
            .attr("class", "zip")
            .attr("d", path) // Set the path data based on the projection
            .attr("fill", "gray") // Set the fill color of the ZIP regions
            .attr("stroke", "black") // Set the stroke color for boundaries
            .attr("stroke-width", 1); // Set the stroke width

        // Add Indigo bike stations as circles with color based on station count
        indigoStations.forEach(station => {
            const lat = parseFloat(station.Latitude); // Get the latitude of the station
            const lon = parseFloat(station.Longitude); // Get the longitude of the station
            const [x, y] = projection([lon, lat]); // Project the coordinates onto the map

            // Find the station count from the station count data
            const stationCount = stationCounts.find(d => d.Station_Name === station.Station_Name);
            const count = stationCount ? +stationCount.count : 0; // Get the count (default to 0 if not found)

            // Add a circle for each bike station
            g.append("circle")
                .attr("cx", x) // Set the x-coordinate for the circle
                .attr("cy", y) // Set the y-coordinate for the circle
                .attr("r", 3) // Set the radius of the circle
                .attr("fill", count > 0 ? countColorScale(count) : "lightgray") // Set color based on count
                .on("mouseover", function () {
                    // Enlarge the dot and display the station name and count on mouseover
                    d3.select(this)
                        .raise() // Bring the circle to the front
                        .attr("r", 10); // Increase the radius on hover

                    // Create a group for the tooltip content
                    const tooltipGroup = g.append("g").attr("id", "bike-tooltip");

                    // The text element showing the station name and count
                    const text = tooltipGroup.append("text")
                        .attr("x", x + 10)
                        .attr("y", y - 10)
                        .attr("fill", "black")
                        .attr("font-size", "12px")
                        .text(`${station.Station_Name} - Count: ${count}`);

                    // Get the bounding box of the text to position the background rectangle
                    const bbox = text.node().getBBox();

                    // Insert a rectangle behind the text for the tooltip background
                    tooltipGroup.insert("rect", "text")
                        .attr("x", bbox.x - 5) // Add some padding around the text
                        .attr("y", bbox.y - 3)
                        .attr("width", bbox.width + 10)
                        .attr("height", bbox.height + 6)
                        .attr("rx", 5) // Rounded corners for the tooltip
                        .attr("ry", 5)
                        .attr("fill", "white") // Set the background to white
                        .attr("opacity", 0.7) // Make it slightly transparent
                        .attr("stroke", "black") // Add a border around the tooltip
                        .attr("stroke-width", 0.5); // Set the stroke width
                })
                .on("mouseout", function () {
                    d3.select(this).attr("r", 3); // Reset the circle size on mouseout
                    g.select("#bike-tooltip").remove(); // Remove the tooltip when the mouse leaves
                });
        });
    }).catch(function (error) {
        console.error("Error loading data:", error); // Handle any data loading errors
    });
});
