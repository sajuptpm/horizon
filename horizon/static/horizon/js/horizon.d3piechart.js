/*
  Draw pie charts in d3.

  To use, a div is required with the class .d3_pie_chart_usage or
  .d3_pie_chart_distribution, and a data-used attribute in the div
  that stores the data used to fill the chart.

  Example (usage):
    <div class="d3_pie_chart_usage"
      data-used="{% widthratio current_val max_val 100 %}">
    </div>

  Example (distribution):
    <div class="d3_pie_chart_distribution"
      data-used="Controller=1|Compute=2|Object Storage=3|Block Storage=4">
    </div>
*/

// Pie chart dimensions
var WIDTH = 100;
var HEIGHT = 100;
var RADIUS = 45;

// Colors
var BKGRND = "#F2F2F2";
var FRGRND = "#006CCF";
var FULL = "#D0342B";
var NEARLY_FULL = "#FFA500";
var STROKE = "#CCCCCC";


function create_vis(chart) {
  return d3.select(chart).append("svg:svg")
    .attr("class", "chart")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .append("g")
    .attr("transform",
      "translate(" + (RADIUS + 2) + "," + (RADIUS + 2) + ")");
}

function create_arc() {
  return d3.svg.arc()
    .outerRadius(RADIUS)
    .innerRadius(0);
}

function create_pie(param) {
  return d3.layout.pie()
    .sort(null)
    .value(function(d){ return d[param]; });
}


horizon.d3_pie_chart_usage = {
  init: function() {
    var self = this;

    // Pie Charts
    var pie_chart_data = $(".d3_pie_chart_usage");
    self.chart = d3.selectAll(".d3_pie_chart_usage");

    for (var i = 0; i < pie_chart_data.length; i++) {
      var used = Math.min(parseInt($(pie_chart_data[i]).data("used")), 100);
      self.data = [{"percentage":used}, {"percentage":100 - used}];
      self.pieChart(i);
    }
  },
  // Draw a pie chart
  pieChart: function(i) {
    var self = this;
    var vis = create_vis(self.chart[0][i]);
    var arc = create_arc();
    var pie = create_pie("percentage");

    // Draw an empty pie chart
    vis.selectAll(".arc")
      .data(pie([{"percentage":10}]))
      .enter()
      .append("path")
      .attr("class","arc")
      .attr("d", arc)
      .style("fill", BKGRND)
      .style("stroke", STROKE)
      .style("stroke-width", 1)
      .each(function(d) {
        self.current = d;
        return d;
      });

    // Animate filling the pie chart
    var animate = function(data) {
      vis.selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("class","arc")
        .attr("d", arc)
        .style("fill", function(){
          if (self.data[0].percentage >= 100) {
            return FULL;
          } else if (self.data[0].percentage >= 80) {
            return NEARLY_FULL;
          } else {
            return FRGRND;
          }
        })
        .style("stroke", STROKE)
        .style("stroke-width", function() {
          if (self.data[0].percentage <= 0 || self.data[0].percentage >= 100) {
            return 0;
          } else {
            return 1;
          }
        })
        .each(function(d) {
          self.current = d;
          return d;
        })
        .transition()
        .duration(500)
        .attrTween("d", function(start) {
          start.endAngle = start.startAngle = 0;
          var end = {
            startAngle: 0,
            endAngle: 2 * Math.PI * (100 - start.value) / 100
          };
          var tween = d3.interpolate(start, end);
          return function(t) { return arc(tween(t)); };
        });
    };

    animate(self.data);
  }
};


horizon.d3_pie_chart_distribution = {
  colors: d3.scale.category20(),

  init: function() {
    var self = this;
    var pie_chart_data = $(".d3_pie_chart_distribution");
    self.chart = d3.selectAll(".d3_pie_chart_distribution");

    for (var i = 0; i < pie_chart_data.length; i++) {
      var parts = $(pie_chart_data[i]).data("used").split("|");
      self.data = [];
      self.keys = [];
      for (var j = 0; j < parts.length; j++) {
        var key_value = parts[j].split("=");
        var d = {};
        d["key"] = key_value[0];
        d["value"] = key_value[1];
        self.data.push(d);
        self.keys.push(key_value[0]);
      }
      self.pieChart(i);
    }
  },
  // Draw a pie chart
  pieChart: function(i) {
    var self = this;
    var vis = create_vis(self.chart[0][i]);
    var arc = create_arc();
    var pie = create_pie("value");

    var total = 0;
    for (var j = 0; j < self.data.length; j++) {
      total = total + parseInt(self.data[j]["value"]);
    }

    // Draw an empty pie chart
    vis.selectAll(".arc")
      .data(pie([]))
      .enter()
      .append("path")
      .attr("class","arc")
      .attr("d", arc)
      .style("stroke", STROKE)
      .style("stroke-width", 1);

    // Animate filling the pie chart
    var animate = function(data) {
      vis.selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("class","arc")
        .attr("d", arc)
        .style("fill", function(d) { return self.colors(d.data.key); })
        .style("stroke", STROKE)
        .style("stroke-width", 1)
        .transition()
        .duration(500)
        .attrTween("d", function(start) {
          start.endAngle = start.startAngle;
          var end = jQuery.extend({}, start);
          end.endAngle = end.startAngle + 2 * Math.PI / total * end.value;
          var tween = d3.interpolate(start, end);
          return function(t) { return arc(tween(t)); };
        });
    };

    animate(self.data);

    // Add a legend
    var legend = d3.select(self.chart[0][i])
      .append("svg")
      .attr("class", "legend")
      .attr("width", WIDTH * 2)
      .attr("height", self.data.length * 18 + 20)
      .selectAll("g")
      .data(self.keys)
      .enter()
      .append("g")
      .attr("transform", function(d, i) {
        return "translate(0," + i * 20 + ")";
      });

    legend.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", self.colors);

    legend.append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .text(function(d) {
        var value = 0;
        for (var j = 0; j < self.data.length; j++) {
          if (self.data[j]["key"] == d) {
            value = self.data[j]["value"];
            break;
          }
        }
        return d + " " + Math.round(value/total * 100) + "%";
      });
  }
};


horizon.addInitFunction(function () {
  horizon.d3_pie_chart_usage.init();
});


horizon.addInitFunction(function () {
  horizon.d3_pie_chart_distribution.init();
});
