document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
        d3.json("philadelphiaMap.geojson"), // GeoJSON for ZIP boundaries
        d3.csv("indegoStations.csv"),      // CSV for Indego stations
        d3.csv("indegoStationLatLong.csv")  // CSV with electric and standard counts and lat/lon
    ]).then(function ([geojson, indigoStations, stationData]) {
        const width = window.innerWidth;   // Get the window width
        const height = window.innerHeight; // Get the window height

        // Create an SVG element for the map
        const svg = d3.select("#electric-ratio-map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const g = svg.append("g")
            .attr("transform", "translate(0, -60)"); // This moves the map up by 60 pixels

        // Set up the Mercator projection for the map with the center at Philadelphia
        const projection = d3.geoMercator()
            .center([-75.1652, 40.0000])  // Center on Philadelphia
            .scale(180000); // Set an appropriate scale for the map

        const path = d3.geoPath().projection(projection);

        // Create a zoom behavior with the ability to scale the map
        const zoom = d3.zoom()
            .scaleExtent([1, 20]) // Limit the zoom-in and zoom-out scale range
            .on("zoom", (event) => {
                const transform = event.transform;
                const newProjection = projection.scale(transform.k * 50000); // Scale the map based on zoom level
                path.projection(newProjection); // Update path projection
                g.attr("transform", transform); // Apply the zoom transform to the group
            });

        // Apply zoom behavior to the SVG container
        svg.call(zoom);

        // Zoom in button event handler for Electric Ratio Map
        document.getElementById("zoom-in-electric").addEventListener("click", () => {
            svg.transition().call(zoom.scaleBy, 1.2); // Zoom in by a factor of 1.2
        });

        // Zoom out button event handler for Electric Ratio Map
        document.getElementById("zoom-out-electric").addEventListener("click", () => {
            svg.transition().call(zoom.scaleBy, 0.8); // Zoom out by a factor of 0.8
        });

        // Reset zoom button event handler for Electric Ratio Map
        document.getElementById("reset-zoom-electric").addEventListener("click", () => {
            svg.transition().call(zoom.transform, d3.zoomIdentity); // Reset zoom to default scale
        });

        g.selectAll("path.zip")
    .data(geojson.features) // Bind the data to the path elements
    .enter()
    .append("path") // Append a new path for each ZIP region
    .attr("class", "zip")
    .attr("d", path) // Set the path data based on the projection
    .attr("fill", "gray") // Set the fill color of the ZIP regions
    .attr("stroke", "black") // Set the stroke color
    .attr("stroke-width", 1) // Set the stroke width
    
    
    //.on("mouseout", function () {
        // Remove the color change on mouse out as well
        // d3.select(this).attr("fill", "gray");
        
        //g.select("#zip-label").remove();
    ;


        // Add Indigo bike stations as circles with color based on electric_to_standard_ratio
        stationData.forEach(station => {
            const lat = parseFloat(station.Latitude); // Get the latitude of the station
            const lon = parseFloat(station.Longitude); // Get the longitude of the station
            const [x, y] = projection([lon, lat]); // Project the coordinates onto the map

            const electricCount = +station.electric_count; // Get the electric bike count
            const standardCount = +station.standard_count; // Get the standard bike count

            g.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 3) // Set the radius
                .attr("fill", electricCount > standardCount ? "#93d500" : "#002169") // Color based on bike type
                .on("mouseover", function () {
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
                        .text(`${station.start_station} - Electric Count: ${electricCount} - Standard Count: ${standardCount}`);

                    // After the text is created, we know its size
                    const bbox = text.node().getBBox();

                    // Add a rectangle behind the text
                    tooltipGroup.insert("rect", "text") // insert rect *before* text
                        .attr("x", bbox.x - 5)
                        .attr("y", bbox.y - 3)
                        .attr("width", bbox.width + 10)
                        .attr("height", bbox.height + 6)
                        .attr("rx", 5)
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
