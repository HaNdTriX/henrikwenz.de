'use strict';
/* eslint-disable no-shadow, no-use-before-define */

function createSkillchart() {
  var margin = 10;
  var parent = document.getElementById('skill-chart').parentElement;
  var diameter = parent.clientHeight;
  var width = window.outerWidth;

  var color = d3.scale.linear()
    .domain([-1, 5])
    .range(['hsl(206,41%,15%)', 'hsl(206,41%,80%)'])
    .interpolate(d3.interpolateHcl);

  var pack = d3.layout.pack()
    .padding(2)
    .size([diameter - margin, diameter - margin])
    .value(function(d) {
      return d.size;
    });

  var svg = d3.select('#skill-chart')
    .attr('width', width)
    .attr('height', diameter);

  var group = svg.append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + diameter / 2 + ')');

  d3.json('data/skills.json', function(error, root) {
    if (error) {
      throw error;
    }

    var focus = root,
      nodes = pack.nodes(root),
      view;

    var circle = group.selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', function(d) {
        return d.parent ? d.children ? 'node' : 'node node--leaf' : 'node node--root';
      })
      .style('fill', function(d) {
        if (d.depth === 0) {
          return 'transparent';
        }
        return d.children ? color(d.depth - 2) : null;
      })
      .on('click', function(d) {
        if (focus !== d) {
          zoom(d);
          d3.event.stopPropagation();
        }
      });

    group.selectAll('text')
      .data(nodes)
      .enter().append('text')
      .attr('class', 'label')
      .style('fill-opacity', function(d) {
        return d.parent === root ? 1 : 0;
      })
      .style('display', function(d) {
        return d.parent === root ? null : 'none';
      })
      .text(function(d) {
        return d.name;
      });

    var node = group.selectAll('circle,text');

    d3.select('body')
      .on('click', function() {
        zoom(root);
      });

    function zoomTo(v) {
      var k = diameter / v[2];
      view = v;
      node.attr('transform', function(d) {
        return 'translate(' + (d.x - v[0]) * k + ',' + (d.y - v[1]) * k + ')';
      });
      circle.attr('r', function(d) {
        return d.r * k;
      });
    }

    function zoom(d) {
      var focus = d;

      var transition = d3.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween('zoom', function() {
          var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
          return function(t) {
            zoomTo(i(t));
          };
        });

      transition.selectAll('text')
        .filter(function(d) {
          return d.parent === focus || this.style.display === 'inline';
        })
        .style('fill-opacity', function(d) {
          return d.parent === focus ? 1 : 0;
        })
        .each('start', function(d) {
          if (d.parent === focus) {
            this.style.display = 'inline';
          }
        })
        .each('end', function(d) {
          if (d.parent !== focus) {
            this.style.display = 'none';
          }
        });
    }


    zoomTo([root.x, root.y, root.r * 2 + margin]);

  });

  d3.select(self.frameElement).style('height', diameter + 'px');

  // onResize
  window.addEventListener('resize', function() {
    width = window.outerWidth;
    console.log('resize', width);
    svg
      .attr('width', window.outerWidth)
      .select('g')
      .attr('transform', 'translate(' + width / 2 + ',' + diameter / 2 + ')');
  });
}

createSkillchart();
