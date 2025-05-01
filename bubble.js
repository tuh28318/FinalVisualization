const width = 900;
const height = 700;

// SVG container
const svg = d3.select("#bubble-chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Tooltip div
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

// Load the file
d3.csv("passholderType.csv").then(function(data) {

  // Bubble size based on total count
  const sizeScale = d3.scaleSqrt()
    .domain([0, d3.max(data, d => +d.count)])
    .range([30, 150]);

  // Pie layout and arc generator
  const pie = d3.pie()
    .value(d => d.value)
    .sort(null);

  const arc = d3.arc();

  // Color scale for electric vs standard bikes
  const sliceColor = d3.scaleOrdinal()
    .domain(["electric", "standard"])
    .range(["#93d500", "#002169"]);

  // Create groups for each pie bubble
  const pieGroups = svg.selectAll(".pieGroup")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "pieGroup");

  // Create pie slices in each group
  pieGroups.each(function(d) {
    const radius = sizeScale(+d.count);

    const pieData = pie([
      { key: "electric", value: +d.electriccount },
      { key: "standard", value: +d.standardcount }
    ]);

    const localArc = arc.innerRadius(0).outerRadius(radius);

    d3.select(this)
      .selectAll("path")
      .data(pieData)
      .enter()
      .append("path")
      .attr("d", localArc)
      .attr("fill", d => sliceColor(d.data.key))
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, slice) {
        const total = +d.count;
        const sliceValue = slice.data.value;
        const sliceKey = slice.data.key;
        const percent = ((sliceValue / total) * 100).toFixed(1) + "%";

        tooltip
          .style("visibility", "visible")
          .html(`
            
            ${sliceKey.charAt(0).toUpperCase() + sliceKey.slice(1)} Bike: ${percent}
          `)
          .style("top", (event.pageY + 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("top", (event.pageY + 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
      });
  });

  // Passholder type labels inside bubbles
  const labels = pieGroups
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .text(d => d.passholder_type)
    .style("pointer-events", "none")
    .style("fill", "white")
    .style("font-size", function(d) {
      const radius = sizeScale(+d.count);
      const estimatedTextWidth = d.passholder_type.length * 7;
      const scaleFactor = radius / (estimatedTextWidth * 1.2);
      return Math.min(2 * radius, Math.max(8, scaleFactor * 16)) + "px";
    });

  // Spread out bubbles
  const simulation = d3.forceSimulation(data)
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collide", d3.forceCollide(d => sizeScale(+d.count) + 5))
    .on("tick", ticked);

  function ticked() {
    pieGroups.attr("transform", d => `translate(${d.x},${d.y})`);
  }
});
