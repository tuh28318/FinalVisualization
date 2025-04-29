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
d3.csv("passholderType.csv").then(function(data) {

  // Define your custom colors
  const customColors = ["#0082ca", "#002169","#587f00", "#93d500", "#4c6396"];

  // Create the color scale
  const colorScale = d3.scaleOrdinal()
    .domain(data.map(d => d.passholder_type))
    .range(customColors);

  // Define size scale based on counts
  const sizeScale = d3.scaleSqrt()
    .domain([0, d3.max(data, d => +d.count)])
    .range([30, 150]);

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
    .attr("opacity", 1)
    .on("mouseover", function(event, d) {
      // Bring the bubble and its label to the front
      d3.select(this).raise(); // raise the bubble
      labels.filter(l => l.passholder_type === d.passholder_type).raise(); // raise the label
    
      // Animate bubble bigger
      d3.select(this)
        .transition()
        .duration(300)
        .attr("r", sizeScale(d.count) * 1.2);
    
      // Calculate percentage
      const total = d3.sum(data, d => +d.count);
      const percentage = ((d.count / total) * 100).toFixed(1) + "%";
    
      // Update label text
      labels
        .filter(l => l.passholder_type === d.passholder_type)
        .text(percentage);
    })
    .on("mouseout", function(event, d) {
      // Animate bubble smaller
      d3.select(this)
        .transition()
        .duration(300)
        .attr("r", sizeScale(d.count));
    
      // Reset label text
      labels
        .filter(l => l.passholder_type === d.passholder_type)
        .text(d.passholder_type);
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
