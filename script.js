const width = 1350;
const height = 1080;
const svg = d3.select("svg");
const g = svg.append("g");

const projection = d3.geoAlbersUsa()
  .translate([width / 2, height / 2])
  .scale(1000);

const path = d3.geoPath().projection(projection);
const phillyCoords = [-75.1652, 39.9526];

let usMapLoaded = false;
let phillyMapLoaded = false;

// Load US states map
d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(us => {
  const states = topojson.feature(us, us.objects.states);

  g.selectAll("path.state")
    .data(states.features)
    .enter().append("path")
    .attr("class", "state")
    .attr("fill", "#ccc")
    .attr("stroke", "#333")
    .attr("d", path);

  usMapLoaded = true;
});

const startScale = 1000;
const endScale = 20000;
const interpolateScale = d3.interpolate(startScale, endScale);

function zoomToPhiladelphia(t) {
  const scale = interpolateScale(t);

  const newProjection = d3.geoAlbersUsa()
    .scale(scale)
    .translate([width / 2, height / 2])
    .center(phillyCoords);

  const newPath = d3.geoPath().projection(newProjection);

  g.selectAll("path.state").attr("d", newPath);
  g.selectAll("path.neighborhood").attr("d", newPath);

  // Load Philly neighborhoods only once
  if (t > 0.75 && !phillyMapLoaded) {
    d3.json("https://raw.githubusercontent.com/opendataphilly/open-geo-data/master/philadelphia-neighborhoods/philadelphia-neighborhoods.geojson")
      .then(philly => {
        g.selectAll("path.neighborhood")
          .data(philly.features)
          .enter()
          .append("path")
          .attr("class", "neighborhood")
          .attr("fill", "#69b3a2")
          .attr("stroke", "#222")
          .attr("d", newPath);
        phillyMapLoaded = true;
      });
  }
}

// Scrolling triggers zooming
document.querySelector(".text-container").addEventListener("scroll", () => {
  if (!usMapLoaded) return;

  const textContainer = document.querySelector(".text-container");
  const scrollY = textContainer.scrollTop;
  const maxScroll = textContainer.scrollHeight - textContainer.clientHeight;
  const t = Math.min(scrollY / maxScroll, 1);

  zoomToPhiladelphia(t);
});
