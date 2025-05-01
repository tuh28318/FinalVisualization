document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
      d3.json("philadelphiaMap.geojson"),    // Map of Philly
      d3.csv("indegoStations.csv"),          // Indego station locations
      d3.csv("indegoStationCount.csv")       // Trip counts per station
    ]).then(function ([geojson, stations, counts]) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const center = [width / 2, height / 2];
  
      // SVG container
      const svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
  
      const g = svg.append("g")
        .attr("transform", "translate(0, -60)");
  
      // Map projection and is centered on Philly
      const projection = d3.geoMercator()
        .center([-75.1652, 40.0000])
        .scale(180000);
  
      const path = d3.geoPath().projection(projection);
  
      // zoom controls
      const zoom = d3.zoom()
        .scaleExtent([1, 20])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });
  
      svg.call(zoom);
  
      // Zoom button handlers
      document.getElementById("zoom-in").addEventListener("click", () => {
        svg.transition().call(zoom.scaleBy, 1.2, center);
      });
  
      document.getElementById("zoom-out").addEventListener("click", () => {
        svg.transition().call(zoom.scaleBy, 0.8, center);
      });
  
      document.getElementById("reset-zoom").addEventListener("click", () => {
        svg.transition()
          .duration(750)
          .ease(d3.easeCubicOut)
          .call(zoom.transform, d3.zoomIdentity);
      });
  
      // Color scale based on trip counts
      const countValues = counts.map(d => +d.count);
      const countScale = d3.scaleSequential()
        .domain([d3.min(countValues), d3.max(countValues)])
        .range(["#e5e8f0", "#002169"]);
  
      // Zip code boundaries
      g.selectAll("path.zip")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("class", "zip")
        .attr("d", path)
        .attr("fill", "gray")
        .attr("stroke", "black")
        .attr("stroke-width", 1);
  
      // Plot each station as a circle
      stations.forEach(station => {
        const lat = parseFloat(station.Latitude);
        const lon = parseFloat(station.Longitude);
        const [x, y] = projection([lon, lat]);
  
        // Match station with its trip count
        const match = counts.find(d => d.Station_Name === station.Station_Name);
        const tripCount = match ? +match.count : 0;
  
        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 3)
          .attr("fill", tripCount > 0 ? countScale(tripCount) : "lightgray")
          .on("mouseover", function () {
            d3.select(this)
              .raise()
              .attr("r", 10);
  
            // Tooltip group
            const tooltip = g.append("g").attr("id", "bike-tooltip");
  
            const text = tooltip.append("text")
              .attr("x", x + 10)
              .attr("y", y - 10)
              .attr("fill", "black")
              .attr("font-size", "12px")
              .text(`${station.Station_Name} - Count: ${tripCount}`);
  
            const bbox = text.node().getBBox();
  
            tooltip.insert("rect", "text")
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
      // console.error("Data loading failed:", error);
    });
  });
  
