document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
        d3.json("philadelphiaMap.geojson"), // Map of Philly
        d3.csv("indegoStations.csv"),       // Indego station locations
        d3.csv("indegoStationLatLong.csv")  // Station's Lat and Long
    ]).then(function ([geojson, indigoStations, stationData]) {
        const width = window.innerWidth;   
        const height = window.innerHeight; 

        // SVG container
        const svg = d3.select("#electric-ratio-map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const g = svg.append("g")
            .attr("transform", "translate(0, -60)"); // This moves the map up by 60

         // Map projection and is centered on Philly
        const projection = d3.geoMercator()
            .center([-75.1652, 40.0000])  // Center on Philadelphia
            .scale(180000);

        const path = d3.geoPath().projection(projection);

        // zoom controls
        const zoom = d3.zoom()
            .scaleExtent([1, 20]) 
            .on("zoom", (event) => {
                const transform = event.transform;
                const newProjection = projection.scale(transform.k * 50000);
                path.projection(newProjection);
                g.attr("transform", transform);
            });

        // Apply zoom to the SVG container
        svg.call(zoom);

        // Zoom in button
        document.getElementById("zoom-in-electric").addEventListener("click", () => {
            svg.transition().call(zoom.scaleBy, 1.2);
        });

        // Zoom out button
        document.getElementById("zoom-out-electric").addEventListener("click", () => {
            svg.transition().call(zoom.scaleBy, 0.8);
        });

        // Reset zoom button
        document.getElementById("reset-zoom-electric").addEventListener("click", () => {
            svg.transition().call(zoom.transform, d3.zoomIdentity);
        });

        g.selectAll("path.zip")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("class", "zip")
    .attr("d", path)
    .attr("fill", "gray")
    .attr("stroke", "black")
    .attr("stroke-width", 1)

        // Draw station circles and add tooltips
        stationData.forEach(station => {
            const lat = parseFloat(station.Latitude);
            const lon = parseFloat(station.Longitude);
            const [x, y] = projection([lon, lat]);

            const electricCount = +station.electric_count; 
            const standardCount = +station.standard_count;

            g.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 3)
                .attr("fill", electricCount > standardCount ? "#93d500" : "#002169")
                .on("mouseover", function () {
                    d3.select(this)
                        .raise()
                        .attr("r", 10);

                    const tooltipGroup = g.append("g")
                        .attr("id", "bike-tooltip");

                    const text = tooltipGroup.append("text")
                        .attr("x", x + 10)
                        .attr("y", y - 10)
                        .attr("fill", "black")
                        .attr("font-size", "12px")
                        .text(`${station.start_station} - Electric Count: ${electricCount} - Standard Count: ${standardCount}`);

                    const bbox = text.node().getBBox();

                    tooltipGroup.insert("rect", "text")
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
                    g.select("#bike-tooltip").remove();
                });
        });

    //}).catch(function (error) {
    //    console.error("Error loading data:", error);
    });
});
