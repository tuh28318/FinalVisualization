const width = 900;
const height = 700;

// Append SVG to the chart div
const svg = d3.select("#bubble-chart")
              .append("svg")
              .attr("width", width)
              .attr("height", height);

// Create a tooltip
const tooltip = d3.select("body")
                  .append("div")
                  .attr("class", "tooltip");

// Load the CSV file
d3.csv("passholder_type_counts.csv").then(function(data) {

  // Define your custom colors
  const customColors = ["#0082ca", "#002169","#5f8a01", "#93d500", "#004f7a"];

  // Create the color scale
  const colorScale = d3.scaleOrdinal()
                       .domain(data.map(d => d.passholder_type))
                       .range(customColors);

  // Define size scale based on counts
  const sizeScale = d3.scaleSqrt()
                      .domain([0, d3.max(data, d => +d.count)])
                      .range([20, 100]);

  // Force simulation
  const simulation = d3.forceSimulation(data)
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collide", d3.forceCollide(d => sizeScale(d.count) + 5))
    .on("tick", ticked);

  // Create bubbles
  const bubbles = svg.selectAll(".bubble")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "bubble")
    .attr("r", d => sizeScale(d.count))
    .attr("fill", d => colorScale(d.passholder_type))
    .attr("stroke", "#333")
    .attr("stroke-width", 1)
    .attr("opacity", 0.8)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("opacity", 1);
      tooltip.style("visibility", "visible")
             .text(d.passholder_type + ": " + d.count);
    })
    .on("mousemove", function(event) {
      tooltip.style("top", (event.pageY - 10) + "px")
             .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("opacity", 0.8);
      tooltip.style("visibility", "hidden");
    });

  // Add text inside bubbles
  const labels = svg.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .text(d => d.passholder_type)
    .style("pointer-events", "none")
    .style("fill", "white")
    .style("font-size", function(d) {
      // Compute font size once, based on radius and text length
      const radius = sizeScale(d.count);
      const fakeText = d.passholder_type;
      const estimatedTextWidth = fakeText.length * 7; // Approximate width
      const scaleFactor = radius / (estimatedTextWidth * 1.2);
      const fontSize = Math.min(2 * radius, Math.max(8, scaleFactor * 16));
      return fontSize + "px";
    });

  // Ticked function
  function ticked() {
    bubbles
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    labels
      .attr("x", d => d.x)
      .attr("y", d => d.y);
  }

});
