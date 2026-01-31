import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';

import * as d3 from 'd3';
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  SankeyGraph,
  SankeyNode,
  SankeyLink,
} from 'd3-sankey';

type NodeData = { id: string; text: string };
type LinkData = { sourceId: string; targetId: string; value: number };

type SN = SankeyNode<NodeData, SL>;
type SL = SankeyLink<NodeData, SL>;

@Component({
  selector: 'app-sankey',
  templateUrl: './sankey.component.html',
  styleUrls: ['./sankey.component.scss'],
})
export class SankeyComponent implements AfterViewInit {
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', { static: true }) tooltipRef!: ElementRef<HTMLDivElement>;

  // “Theme/Background” uit je Blazor voorbeeld (simpel gehouden)
  backgroundColor: string | null = 'transparent';
  widthPercent = 90;

  // Data: 1-op-1 overgenomen uit je Blazor code
  nodes: NodeData[] = [
    { id: 'Solar', text: 'Solar' },
    { id: 'Wind', text: 'Wind' },
    { id: 'Hydro', text: 'Hydro' },
    { id: 'Nuclear', text: 'Nuclear' },
    { id: 'Coal', text: 'Coal' },
    { id: 'Natural Gas', text: 'Natural Gas' },
    { id: 'Oil', text: 'Oil' },
    { id: 'Electricity', text: 'Electricity' },
    { id: 'Heat', text: 'Heat' },
    { id: 'Fuel', text: 'Fuel' },
    { id: 'Residential', text: 'Residential' },
    { id: 'Commercial', text: 'Commercial' },
    { id: 'Industrial', text: 'Industrial' },
    { id: 'Transportation', text: 'Transportation' },
    { id: 'Energy Services', text: 'Energy Services' },
    { id: 'Losses', text: 'Losses' },
  ];

  links: LinkData[] = [
    { sourceId: 'Solar', targetId: 'Electricity', value: 100 },
    { sourceId: 'Wind', targetId: 'Electricity', value: 120 },
    { sourceId: 'Hydro', targetId: 'Electricity', value: 80 },
    { sourceId: 'Nuclear', targetId: 'Electricity', value: 90 },
    { sourceId: 'Coal', targetId: 'Electricity', value: 200 },
    { sourceId: 'Natural Gas', targetId: 'Electricity', value: 130 },
    { sourceId: 'Natural Gas', targetId: 'Heat', value: 80 },
    { sourceId: 'Oil', targetId: 'Fuel', value: 250 },

    { sourceId: 'Electricity', targetId: 'Residential', value: 170 },
    { sourceId: 'Electricity', targetId: 'Commercial', value: 160 },
    { sourceId: 'Electricity', targetId: 'Industrial', value: 210 },
    { sourceId: 'Heat', targetId: 'Residential', value: 40 },
    { sourceId: 'Heat', targetId: 'Commercial', value: 20 },
    { sourceId: 'Heat', targetId: 'Industrial', value: 20 },
    { sourceId: 'Fuel', targetId: 'Transportation', value: 200 },
    { sourceId: 'Fuel', targetId: 'Industrial', value: 50 },

    { sourceId: 'Residential', targetId: 'Energy Services', value: 180 },
    { sourceId: 'Commercial', targetId: 'Energy Services', value: 150 },
    { sourceId: 'Industrial', targetId: 'Energy Services', value: 230 },
    { sourceId: 'Transportation', targetId: 'Energy Services', value: 150 },
    { sourceId: 'Residential', targetId: 'Losses', value: 30 },
    { sourceId: 'Commercial', targetId: 'Losses', value: 30 },
    { sourceId: 'Industrial', targetId: 'Losses', value: 50 },
    { sourceId: 'Transportation', targetId: 'Losses', value: 50 },
  ];

  ngAfterViewInit(): void {
    this.render();
    // Optioneel: re-render op resize
    window.addEventListener('resize', () => this.render());
  }

  // Equivalent van jouw OnLabelRendering hook (pas hier je label aan)
  private labelText(n: SN): string {
    return n.id as string;
  }

  private render(): void {
    const host = this.hostRef.nativeElement;
    const tooltip = this.tooltipRef.nativeElement;

    // cleanup
    d3.select(host).select('svg').remove();

    const containerWidth = Math.max(300, Math.floor(host.clientWidth));
    const width = containerWidth;
    const height = 520;

    const svg = d3
      .select(host)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', this.backgroundColor ?? 'transparent');

    const graph: SankeyGraph<NodeData, LinkData> = {
      nodes: this.nodes.map((n) => ({ ...n })),
      links: this.links.map((l) => ({
        source: l.sourceId,
        target: l.targetId,
        value: l.value,
      })),
    };

    const sankeyGen = d3Sankey<NodeData, any>()
      .nodeId((d: any) => d.id)
      .nodeWidth(18)
      .nodePadding(12)
      .extent([
        [10, 10],
        [width - 10, height - 10],
      ]);

    const sankeyGraph = sankeyGen(graph as any) as unknown as SankeyGraph<NodeData, any>;
    const nodes = sankeyGraph.nodes as unknown as SN[];
    const links = sankeyGraph.links as unknown as SL[];

    // Links
    const linkG = svg.append('g').attr('fill', 'none').attr('stroke-opacity', 0.35);

    linkG
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', '#999')
      .attr('stroke-width', (d) => Math.max(1, d.width || 1))
      .on('mousemove', (event, d) => {
        const s = (d.source as any)?.id ?? '';
        const t = (d.target as any)?.id ?? '';
        this.showTooltip(tooltip, event, `${s} → ${t}: ${d.value}`);
      })
      .on('mouseleave', () => this.hideTooltip(tooltip));

    // Nodes
    const nodeG = svg.append('g');

    const node = nodeG
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g');

    node
      .append('rect')
      .attr('x', (d) => d.x0 ?? 0)
      .attr('y', (d) => d.y0 ?? 0)
      .attr('height', (d) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr('width', (d) => Math.max(1, (d.x1 ?? 0) - (d.x0 ?? 0)))
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('fill', '#666')
      .on('mousemove', (event, d) => {
        const id = (d.id as string) ?? '';
        const val = (d.value as number) ?? 0;
        this.showTooltip(tooltip, event, `${id}: ${val}`);
      })
      .on('mouseleave', () => this.hideTooltip(tooltip));

    // Labels
    node
      .append('text')
      .attr('x', (d) => ((d.x0 ?? 0) < width / 2 ? (d.x1 ?? 0) + 6 : (d.x0 ?? 0) - 6))
      .attr('y', (d) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d) => ((d.x0 ?? 0) < width / 2 ? 'start' : 'end'))
      .style('font-size', '12px')
      .text((d) => this.labelText(d)); // <-- OnLabelRendering equivalent
  }

  private showTooltip(el: HTMLDivElement, event: MouseEvent, text: string): void {
    const hostRect = this.hostRef.nativeElement.getBoundingClientRect();
    el.textContent = text;
    el.style.left = `${event.clientX - hostRect.left}px`;
    el.style.top = `${event.clientY - hostRect.top}px`;
    el.style.opacity = '1';
  }

  private hideTooltip(el: HTMLDivElement): void {
    el.style.opacity = '0';
  }
}
