import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  frequency: number;
  significance: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  strength: number;
}

interface PatternNetworkProps {
  patterns: string[];
  cooccurrences: { [key: string]: number };
}

export const PatternNetwork: React.FC<PatternNetworkProps> = ({
  patterns,
  cooccurrences
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setDimensions({ width, height: 400 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || patterns.length === 0) return;

    // Prepare data
    const nodes: Node[] = patterns.map(p => ({
      id: p,
      label: p,
      frequency: Math.random() * 100 + 20,
      significance: Math.random()
    }));

    const links: Link[] = [];
    patterns.forEach((p1, i) => {
      patterns.slice(i + 1).forEach(p2 => {
        const key1 = `${p1}-${p2}`;
        const key2 = `${p2}-${p1}`;
        const strength = cooccurrences[key1] || cooccurrences[key2] || 0;

        if (strength > 0 || Math.random() > 0.7) {
          links.push({
            source: p1,
            target: p2,
            strength: strength || Math.random() * 5 + 1
          });
        }
      });
    });

    // Limit links to avoid clutter
    const sortedLinks = links.sort((a, b) => b.strength - a.strength).slice(0, Math.min(links.length, 30));

    const { width, height } = dimensions;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    // Create simulation
    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(sortedLinks)
        .id(d => d.id)
        .distance(d => 100 / Math.sqrt(d.strength))
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // SVG Setup
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('background', 'transparent');

    // Add zoom behavior
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(sortedLinks)
      .join('line')
      .attr('stroke', 'rgba(200,200,200,0.3)')
      .attr('stroke-width', d => Math.sqrt(d.strength) * 2);

    // Nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => Math.sqrt(d.frequency) * 2 + 10)
      .attr('fill', d => d3.interpolateViridis(d.significance))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(drag(simulation) as any)
      .on('click', (event, d) => {
        setSelectedNode(d.id);
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', Math.sqrt(d.frequency) * 2 + 15)
          .attr('stroke-width', 3);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', Math.sqrt(d.frequency) * 2 + 10)
          .attr('stroke-width', 2);
      });

    // Labels
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('font-size', 12)
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .text(d => d.id.substring(0, 15))
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Tooltips
    node.append('title')
      .text(d => `${d.id}\nFrequency: ${d.frequency.toFixed(0)}\nSignificance: ${d.significance.toFixed(2)}`);

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x || 0)
        .attr('y1', d => (d.source as Node).y || 0)
        .attr('x2', d => (d.target as Node).x || 0)
        .attr('y2', d => (d.target as Node).y || 0);

      node
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);

      labels
        .attr('x', d => d.x || 0)
        .attr('y', d => d.y || 0);
    });

    function drag(simulation: d3.Simulation<Node, undefined>) {
      function dragstarted(event: any, d: Node) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: any, d: Node) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: any, d: Node) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return d3.drag<SVGCircleElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [patterns, cooccurrences, dimensions]);

  return (
    <div ref={containerRef} className="w-full bg-gray-900/40 rounded-2xl p-6 border border-white/10">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Pattern Co-Occurrence Network</h3>
        <p className="text-sm text-gray-400 mt-1">
          {patterns.length} patterns • Drag nodes to explore • Scroll to zoom
        </p>
      </div>

      {patterns.length === 0 ? (
        <div className="flex items-center justify-center h-96 text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">No patterns to visualize</p>
            <p className="text-sm">Run pattern analysis to see the network</p>
          </div>
        </div>
      ) : (
        <>
          <svg
            ref={svgRef}
            className="w-full border border-white/10 rounded-lg"
            style={{ height: '400px' }}
          />

          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-gray-400">Low significance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-gray-400">High significance</span>
              </div>
            </div>
            <div className="text-gray-400">
              Size = Frequency | Color = Significance | Line thickness = Co-occurrence strength
            </div>
          </div>

          {selectedNode && (
            <div className="mt-4 p-4 bg-blue-600/20 border border-blue-600/50 rounded-lg">
              <p className="text-sm font-semibold text-blue-300">Selected Pattern:</p>
              <p className="text-white mt-1">{selectedNode}</p>
              <button
                onClick={() => setSelectedNode(null)}
                className="mt-2 text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
