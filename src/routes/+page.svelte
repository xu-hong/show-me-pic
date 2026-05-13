<script lang="ts">
  import { onMount, tick } from 'svelte';
  import * as d3 from 'd3';
  import { gsap } from 'gsap';
  import { derivedNumbers, sourceConstants, storyScenes, type StoryScene } from '$lib/storyData';
  import { formatNumber, formatRatio } from '$lib/format';

  type SvgRoot = d3.Selection<SVGGElement, unknown, null, undefined>;

  let activeIndex = 0;
  let vizSvg: SVGSVGElement;
  let cueCard: HTMLElement;
  let progressBar: HTMLDivElement;
  let prefersReducedMotion = false;
  let isMounted = false;
  let activeTimeline: gsap.core.Timeline | undefined;

  $: scene = storyScenes[activeIndex];

  function goTo(index: number) {
    activeIndex = Math.max(0, Math.min(storyScenes.length - 1, index));
  }

  function nextScene() {
    goTo(activeIndex + 1);
  }

  function previousScene() {
    goTo(activeIndex - 1);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'PageDown') nextScene();
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') previousScene();
  }

  function renderViz(currentScene: StoryScene) {
    if (!vizSvg) return;

    activeTimeline?.kill();
    gsap.killTweensOf(cueCard);
    gsap.killTweensOf(progressBar);

    const rect = vizSvg.getBoundingClientRect();
    const width = Math.max(rect.width, 360);
    const height = Math.max(rect.height, 360);
    const svg = d3.select(vizSvg);

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const root = svg.append('g').attr('transform', `translate(${width * 0.055}, ${height * 0.055})`);
    const innerWidth = width * 0.89;
    const innerHeight = height * 0.89;
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    drawGrid(root, innerWidth, innerHeight);

    if (currentScene.kind === 'year') renderYear(root, innerWidth, innerHeight, timeline);
    if (currentScene.kind === 'cutdown') renderCutdown(root, innerWidth, innerHeight, timeline);
    if (currentScene.kind === 'sixth') renderSixth(root, innerWidth, innerHeight, timeline);
    if (currentScene.kind === 'week') renderWeek(root, innerWidth, innerHeight, timeline);
    if (currentScene.kind === 'race') renderRace(root, innerWidth, innerHeight, timeline);

    if (prefersReducedMotion) {
      timeline.progress(1).kill();
      gsap.set(cueCard, { autoAlpha: 1, y: 0 });
      gsap.set(progressBar, { scaleX: (activeIndex + 1) / storyScenes.length });
      return;
    }

    gsap.fromTo(cueCard, { autoAlpha: 0.72, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.28 });
    gsap.to(progressBar, {
      scaleX: (activeIndex + 1) / storyScenes.length,
      duration: 0.5,
      ease: 'expo.out'
    });

    activeTimeline = timeline;
  }

  function drawGrid(root: SvgRoot, width: number, height: number) {
    const spacing = 34;
    root
      .append('g')
      .attr('class', 'plot-grid')
      .selectAll('line.vertical')
      .data(d3.range(0, width + spacing, spacing))
      .join('line')
      .attr('x1', (d) => d)
      .attr('x2', (d) => d)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'rgba(246,232,207,0.06)');

    root
      .select('.plot-grid')
      .selectAll('line.horizontal')
      .data(d3.range(0, height + spacing, spacing))
      .join('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => d)
      .attr('y2', (d) => d)
      .attr('stroke', 'rgba(246,232,207,0.06)');
  }

  function renderYear(root: SvgRoot, width: number, height: number, timeline: gsap.core.Timeline) {
    const cols = 73;
    const rows = 5;
    const gap = Math.max(1.4, width * 0.0024);
    const tileWidth = (width * 0.9 - gap * (cols - 1)) / cols;
    const tileHeight = Math.min(96, (height * 0.56 - gap * (rows - 1)) / rows);
    const x0 = width * 0.05;
    const y0 = height * 0.22;
    const tiles = d3.range(365).map((index) => ({
      index,
      x: x0 + (index % cols) * (tileWidth + gap),
      y: y0 + Math.floor(index / cols) * (tileHeight + gap)
    }));

    const tileGroup = root.append('g').attr('class', 'annual-tiles');

    tileGroup
      .selectAll('rect.tile')
      .data(tiles)
      .join('rect')
      .attr('class', 'tile')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('width', tileWidth)
      .attr('height', tileHeight)
      .attr('fill', '#ff4d2e')
      .attr('opacity', 0)
      .attr('rx', 1);

    root
      .append('text')
      .attr('class', 'svg-number')
      .attr('x', x0)
      .attr('y', y0 - 34)
      .text('$213B');

    root
      .append('text')
      .attr('class', 'svg-caption')
      .attr('x', x0)
      .attr('y', y0 + tileHeight * rows + 42)
      .text('365 identical blocks. Each block is one day.');

    timeline
      .fromTo('.tile', { opacity: 0, y: '+=18' }, { opacity: 1, y: '-=18', stagger: 0.006, duration: 0.28 })
      .fromTo('.svg-number', { opacity: 0, x: x0 - 22 }, { opacity: 1, x: x0, duration: 0.35 }, 0.25)
      .fromTo('.svg-caption', { opacity: 0 }, { opacity: 1, duration: 0.35 }, 0.6);
  }

  function renderCutdown(root: SvgRoot, width: number, height: number, timeline: gsap.core.Timeline) {
    const cols = 73;
    const rows = 5;
    const gap = Math.max(1.4, width * 0.0024);
    const tileWidth = (width * 0.86 - gap * (cols - 1)) / cols;
    const tileHeight = Math.min(56, (height * 0.32 - gap * (rows - 1)) / rows);
    const gridX = width * 0.07;
    const gridY = height * 0.08;
    const selectedIndex = 180;
    const tiles = d3.range(365).map((index) => ({
      index,
      x: gridX + (index % cols) * (tileWidth + gap),
      y: gridY + Math.floor(index / cols) * (tileHeight + gap)
    }));
    const selected = tiles[selectedIndex];
    const dayX = width * 0.16;
    const dayY = height * 0.38;
    const dayWidth = width * 0.68;
    const dayHeight = height * 0.2;
    const dotX = dayX + dayWidth * 0.56;
    const dotY = dayY + dayHeight * 0.52;
    const secondX = width * 0.2;
    const secondY = height * 0.68;
    const secondWidth = width * 0.6;
    const secondHeight = height * 0.12;
    const sliceWidth = secondWidth / 6;

    const annualGrid = root.append('g').attr('class', 'annual-zoom-grid');

    annualGrid
      .selectAll('rect.zoom-source-tile')
      .data(tiles)
      .join('rect')
      .attr('class', 'zoom-source-tile')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('width', tileWidth)
      .attr('height', tileHeight)
      .classed('selected-day', (d) => d.index === selectedIndex)
      .attr('fill', (d) => (d.index === selectedIndex ? '#f6e8cf' : '#ff4d2e'))
      .attr('opacity', (d) => (d.index === selectedIndex ? 1 : 0.32))
      .attr('rx', 1);

    const dayShell = root
      .append('rect')
      .attr('class', 'day-shell')
      .attr('x', selected.x)
      .attr('y', selected.y)
      .attr('width', tileWidth)
      .attr('height', tileHeight)
      .attr('fill', '#f6e8cf')
      .attr('stroke', 'rgba(246,232,207,0.42)')
      .attr('stroke-width', 2)
      .attr('rx', 4);

    const secondDot = root
      .append('circle')
      .attr('class', 'second-dot')
      .attr('cx', dotX)
      .attr('cy', dotY)
      .attr('r', 0)
      .attr('fill', '#0f0d0a')
      .attr('stroke', '#f6e8cf')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    const secondShell = root
      .append('rect')
      .attr('class', 'second-shell')
      .attr('x', dotX)
      .attr('y', dotY)
      .attr('width', 1)
      .attr('height', 1)
      .attr('fill', 'rgba(255,77,46,0.22)')
      .attr('stroke', 'rgba(246,232,207,0.42)')
      .attr('stroke-width', 2)
      .attr('rx', 4)
      .attr('opacity', 0);

    const slices = root
      .append('g')
      .attr('class', 'zoom-slices')
      .selectAll('rect.zoom-slice')
      .data(d3.range(6))
      .join('rect')
      .attr('class', 'zoom-slice')
      .attr('x', (d) => secondX + d * sliceWidth)
      .attr('y', secondY)
      .attr('width', sliceWidth - 2)
      .attr('height', secondHeight)
      .attr('fill', (d) => (d === 0 ? '#f6e8cf' : '#ff4d2e'))
      .attr('opacity', 0);

    const blades = root
      .append('g')
      .attr('class', 'zoom-blades')
      .selectAll('line.zoom-blade')
      .data(d3.range(1, 6))
      .join('line')
      .attr('class', 'zoom-blade')
      .attr('x1', (d) => secondX + d * sliceWidth)
      .attr('x2', (d) => secondX + d * sliceWidth)
      .attr('y1', secondY - 18)
      .attr('y2', secondY + secondHeight + 18)
      .attr('stroke', '#f6e8cf')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    const labelY = secondY + secondHeight + 78;
    const prefixX = secondX;
    const suffixX = secondX + Math.min(width * 0.155, 176);

    const secondPrefix = root
      .append('text')
      .attr('class', 'svg-number second-prefix')
      .attr('x', prefixX)
      .attr('y', labelY)
      .attr('opacity', 0);

    secondPrefix.append('tspan').text('1');

    const sixthPrefix = root
      .append('text')
      .attr('class', 'svg-number sixth-prefix')
      .attr('x', prefixX)
      .attr('y', labelY)
      .attr('opacity', 0)
      .text('1/6');

    root
      .append('text')
      .attr('class', 'svg-number musk-second-suffix')
      .attr('x', suffixX)
      .attr('y', labelY)
      .attr('opacity', 0)
      .text('MUSK SECOND');

    root
      .append('text')
      .attr('class', 'svg-caption sixth-value-label')
      .attr('x', secondX)
      .attr('y', secondY + secondHeight + 116)
      .attr('opacity', 0)
      .text(`$${formatNumber(derivedNumbers.muskPerSecond / 6, 0)}`);

    timeline
      .fromTo('.annual-zoom-grid', { opacity: 0 }, { opacity: 1, duration: 0.25 })
      .to('.zoom-source-tile:not(.selected-day)', { opacity: 0.12, duration: 0.28 }, 0.3)
      .to(
        dayShell.node(),
        {
          attr: { x: dayX, y: dayY, width: dayWidth, height: dayHeight },
          fill: 'rgba(246,232,207,0.18)',
          duration: 0.86,
          ease: 'expo.inOut'
        },
        0.42
      )
      .to('.annual-zoom-grid', { opacity: 0.1, scale: 0.96, transformOrigin: '50% 50%', duration: 0.48 }, 0.65)
      .to(secondDot.node(), { opacity: 1, attr: { r: 6 }, duration: 0.22 }, 1.18)
      .to(secondDot.node(), { attr: { r: 12 }, duration: 0.18, yoyo: true, repeat: 1 }, 1.42)
      .to(secondShell.node(), { opacity: 1, duration: 0.08 }, 1.58)
      .to(
        secondShell.node(),
        {
          attr: { x: secondX, y: secondY, width: secondWidth, height: secondHeight },
          duration: 0.62,
          ease: 'expo.inOut'
        },
        1.6
      )
      .to(dayShell.node(), { opacity: 0.18, duration: 0.34 }, 1.78)
      .fromTo('.second-prefix, .musk-second-suffix', { opacity: 0, y: '+=14' }, { opacity: 1, y: '-=14', duration: 0.28 }, 2.04)
      .to(blades.nodes(), { opacity: 1, stagger: 0.055, duration: 0.1 }, 2.46)
      .fromTo(slices.nodes(), { opacity: 0 }, { opacity: 1, stagger: 0.045, duration: 0.16 }, 2.58)
      .to(slices.nodes().slice(1), { opacity: 0.28, duration: 0.2 }, 2.92)
      .to('.second-prefix', { opacity: 0, y: '-=10', duration: 0.16 }, 3.14)
      .fromTo('.sixth-prefix', { opacity: 0, y: '+=10' }, { opacity: 1, y: '-=10', duration: 0.18 }, 3.26)
      .fromTo('.sixth-value-label', { opacity: 0, y: '+=8' }, { opacity: 1, y: '-=8', duration: 0.18 }, 3.42);
  }

  function renderSixth(root: SvgRoot, width: number, height: number, timeline: gsap.core.Timeline) {
    const sourceX = width * 0.12;
    const sourceY = height * 0.18;
    const sourceWidth = width * 0.76;
    const sourceHeight = height * 0.13;
    const sliceWidth = sourceWidth / 6;
    const exactShare = sourceConstants.medianWeeklyEarnings / derivedNumbers.muskPerSecond;
    const centerWidth = sourceWidth / 6;
    const centerHeight = height * 0.18;
    const centerX = width * 0.5 - centerWidth / 2;
    const centerY = height * 0.44;

    const slices = d3.range(6).map((index) => ({ index, x: sourceX + index * sliceWidth }));

    root
      .append('rect')
      .attr('class', 'second-outline')
      .attr('x', sourceX)
      .attr('y', sourceY)
      .attr('width', sourceWidth)
      .attr('height', sourceHeight)
      .attr('fill', 'rgba(255,77,46,0.2)')
      .attr('stroke', 'rgba(246,232,207,0.4)');

    const sliceNodes = root
      .append('g')
      .attr('class', 'slices')
      .selectAll('rect.slice')
      .data(slices)
      .join('rect')
      .attr('class', 'slice')
      .attr('x', (d) => d.x)
      .attr('y', sourceY)
      .attr('width', sliceWidth - 2)
      .attr('height', sourceHeight)
      .attr('fill', (_, index) => (index === 0 ? '#f6e8cf' : '#ff4d2e'))
      .attr('opacity', 0);

    const movingSlice = root
      .append('rect')
      .attr('class', 'moving-week')
      .attr('x', sourceX)
      .attr('y', sourceY)
      .attr('width', sliceWidth - 2)
      .attr('height', sourceHeight)
      .attr('fill', '#f6e8cf')
      .attr('opacity', 0);

    const sixthLabel = root
      .append('text')
      .attr('class', 'svg-number compact sixth-start-label')
      .attr('x', sourceX)
      .attr('y', sourceY + sourceHeight + 52)
      .attr('opacity', 0)
      .text('1/6 MUSK SECOND');

    const weekLabel = root
      .append('text')
      .attr('class', 'svg-number person-week-label')
      .attr('x', width * 0.5)
      .attr('y', centerY + centerHeight + 92)
      .attr('text-anchor', 'middle')
      .attr('opacity', 0);

    weekLabel.append('tspan').text('1 AVERAGE PERSON ');
    weekLabel.append('tspan').attr('class', 'accent-word').text('WEEK');

    root
      .append('text')
      .attr('class', 'svg-caption median-caption')
      .attr('x', width * 0.5)
      .attr('y', centerY + centerHeight + 126)
      .attr('text-anchor', 'middle')
      .attr('opacity', 0)
      .text(`$${formatNumber(sourceConstants.medianWeeklyEarnings, 0)} per week`);

    timeline
      .fromTo(sliceNodes.nodes(), { opacity: 0, y: '+=14' }, { opacity: 1, y: '-=14', stagger: 0.07, duration: 0.24 })
      .to(sliceNodes.nodes().slice(1), { opacity: 0.24, duration: 0.28 }, 0.65)
      .fromTo(movingSlice.node(), { opacity: 0 }, { opacity: 1, duration: 0.18 }, 0.76)
      .fromTo(sixthLabel.node(), { opacity: 0, y: '+=12' }, { opacity: 1, y: '-=12', duration: 0.24 }, 0.84)
      .to(movingSlice.node(), {
        attr: {
          x: centerX,
          y: centerY,
          width: centerWidth,
          height: centerHeight
        },
        duration: 0.62,
        ease: 'expo.inOut'
      }, 1.15)
      .to('.second-outline, .slices, .sixth-start-label', { opacity: 0.12, duration: 0.28 }, 1.22)
      .to(movingSlice.node(), { attr: { width: sourceWidth * exactShare }, duration: 0.28 }, 1.74)
      .fromTo('.person-week-label', { opacity: 0, y: '+=16' }, { opacity: 1, y: '-=16', duration: 0.3 }, 1.78)
      .fromTo('.median-caption', { opacity: 0 }, { opacity: 1, duration: 0.24 }, 1.94);
  }

  function renderWeek(root: SvgRoot, width: number, height: number, timeline: gsap.core.Timeline) {
    const x = width * 0.08;
    const y1 = height * 0.32;
    const y2 = height * 0.58;
    const rulerWidth = width * 0.84;
    const scale = d3.scaleLog().domain([1_000, derivedNumbers.muskPerWeek]).range([4, rulerWidth]);
    const topWidth = scale(sourceConstants.medianWeeklyEarnings);
    const bottomWidth = scale(derivedNumbers.muskPerWeek);

    root
      .append('line')
      .attr('x1', x)
      .attr('x2', x + rulerWidth)
      .attr('y1', height * 0.82)
      .attr('y2', height * 0.82)
      .attr('stroke', 'rgba(246,232,207,0.28)');

    const topGroup = root.append('g').attr('class', 'week-row top-week').attr('transform', `translate(${x}, ${y1})`);
    const bottomGroup = root.append('g').attr('class', 'week-row bottom-week').attr('transform', `translate(${x}, ${y2})`);

    const topBar = topGroup
      .append('rect')
      .attr('class', 'week-bar top-bar')
      .attr('width', 0)
      .attr('height', 42)
      .attr('fill', '#f6e8cf')
      .attr('rx', 2);

    const bottomBar = bottomGroup
      .append('rect')
      .attr('class', 'week-bar bottom-bar')
      .attr('width', 0)
      .attr('height', 42)
      .attr('fill', '#ff4d2e')
      .attr('rx', 2);

    topGroup
      .append('text')
      .attr('class', 'svg-number compact top-label')
      .attr('x', 0)
      .attr('y', -18)
      .attr('opacity', 0)
      .text('$1,192');

    bottomGroup
      .append('text')
      .attr('class', 'svg-number compact bottom-label')
      .attr('x', 0)
      .attr('y', -18)
      .attr('opacity', 0)
      .text('$4.10B');

    root
      .append('text')
      .attr('class', 'svg-caption ratio-label')
      .attr('x', x)
      .attr('y', height * 0.18)
      .attr('opacity', 0)
      .text(`${formatRatio(derivedNumbers.weeklyRatio)} on the same week.`);

    timeline
      .to(topBar.node(), { attr: { width: rulerWidth }, duration: 0.55, ease: 'expo.out' }, 0)
      .to('.top-label', { opacity: 1, duration: 0.22 }, 0.08)
      .to(bottomBar.node(), { attr: { width: bottomWidth }, duration: 1.65, ease: 'power2.inOut' }, 0.72)
      .to(topBar.node(), { attr: { width: topWidth }, duration: 1.65, ease: 'power2.inOut' }, 0.72)
      .to('.bottom-label', { opacity: 1, duration: 0.25 }, 0.88)
      .fromTo('.ratio-label', { opacity: 0, y: '-=10' }, { opacity: 1, y: '+=10', duration: 0.3 }, 2.1);
  }

  function renderRace(root: SvgRoot, width: number, height: number, timeline: gsap.core.Timeline) {
    const x = width * 0.09;
    const laneWidth = width * 0.78;
    const muskY = height * 0.3;
    const normalY = height * 0.58;
    const barHeight = 18;
    const yearScale = d3.scaleLog().domain([1, 3436371]).range([8, laneWidth]);
    const states = [
      { label: 'Musk, 1 day', musk: '$583.6M', years: 9415 },
      { label: 'Musk, 1 week', musk: '$4.10B', years: 65900 },
      { label: 'Musk, 1 year', musk: '$213B', years: 3436371 }
    ];

    const muskLabel = root
      .append('text')
      .attr('class', 'svg-caption lane-label')
      .attr('x', x)
      .attr('y', muskY - 18)
      .text(states[0].label);

    const muskValue = root
      .append('text')
      .attr('class', 'svg-number compact lane-value')
      .attr('x', x + laneWidth)
      .attr('y', muskY - 10)
      .attr('text-anchor', 'end')
      .attr('opacity', 0)
      .text(states[0].musk);

    const yearValue = root
      .append('text')
      .attr('class', 'svg-caption year-value')
      .attr('x', x + laneWidth)
      .attr('y', muskY + 43)
      .attr('text-anchor', 'end')
      .attr('opacity', 0)
      .text(`≈${formatNumber(states[0].years, 0)} years`);

    root
      .append('text')
      .attr('class', 'svg-caption lane-label')
      .attr('x', x)
      .attr('y', normalY - 18)
      .text('Normal people');

    const normalLabel = root
      .append('text')
      .attr('class', 'svg-number compact normal-label')
      .attr('x', x + laneWidth)
      .attr('y', normalY - 10)
      .attr('text-anchor', 'end')
      .attr('opacity', 0)
      .text('equivalent years');

    const normalYears = root
      .append('text')
      .attr('class', 'svg-caption normal-years')
      .attr('x', x + laneWidth)
      .attr('y', normalY + 43)
      .attr('text-anchor', 'end')
      .attr('opacity', 0)
      .text('≈9,415 years');

    root
      .append('rect')
      .attr('class', 'lane-bg musk-bg')
      .attr('x', x)
      .attr('y', muskY)
      .attr('width', laneWidth)
      .attr('height', 42)
      .attr('fill', 'rgba(246,232,207,0.08)')
      .attr('stroke', 'rgba(246,232,207,0.18)');

    const fills = root
      .append('rect')
      .attr('class', 'race-fill')
      .attr('x', x)
      .attr('y', muskY)
      .attr('width', 0)
      .attr('height', barHeight)
      .attr('fill', '#ff4d2e');

    const contrast = root
      .append('rect')
      .attr('class', 'normal-fill')
      .attr('x', x)
      .attr('y', normalY)
      .attr('width', 0)
      .attr('height', barHeight)
      .attr('fill', '#f6e8cf')
      .attr('opacity', 0.9);

    const muskTicks = root
      .append('g')
      .attr('class', 'race-ticks musk-ticks')
      .selectAll('rect.race-tick')
      .data(d3.range(96))
      .join('rect')
      .attr('class', 'race-tick')
      .attr('x', (d) => x + d * (laneWidth / 96))
      .attr('y', muskY)
      .attr('width', Math.max(2, laneWidth / 96 - 2))
      .attr('height', barHeight)
      .attr('fill', '#f6e8cf')
      .attr('opacity', 0);

    const normalTicks = root
      .append('g')
      .attr('class', 'race-ticks normal-ticks')
      .selectAll('rect.race-tick')
      .data(d3.range(96))
      .join('rect')
      .attr('class', 'race-tick')
      .attr('x', (d) => x + d * (laneWidth / 96))
      .attr('y', normalY)
      .attr('width', Math.max(2, laneWidth / 96 - 2))
      .attr('height', barHeight)
      .attr('fill', '#f6e8cf')
      .attr('opacity', 0);

    const setState = (stateIndex: number) => {
      const state = states[stateIndex];
      muskLabel.text(state.label);
      muskValue.text(state.musk);
      yearValue.text(`≈${formatNumber(state.years, 0)} normal-worker years`);
      normalYears.text(`≈${formatNumber(state.years, 0)} years`);
    };

    states.forEach((state, index) => {
      const start = index * 1.65;
      const nextNormal = yearScale(state.years);

      timeline
        .call(setState, [index], start)
        .to([muskValue.node(), yearValue.node(), normalLabel.node(), normalYears.node()], { opacity: 0, duration: 0.08 }, start)
        .set(fills.node(), { attr: { width: 0 } }, start + 0.08)
        .to(fills.node(), { attr: { width: laneWidth }, duration: 0.52, ease: 'expo.out' }, start + 0.1)
        .to(muskTicks.nodes(), { opacity: 0.72, stagger: 0.002, duration: 0.06 }, start + 0.08)
        .to(normalTicks.nodes(), { opacity: 0.56, stagger: 0.002, duration: 0.06 }, start + 0.08)
        .to(muskTicks.nodes(), { opacity: 0.14, duration: 0.12 }, start + 0.34)
        .to(normalTicks.nodes(), { opacity: 0.12, duration: 0.12 }, start + 0.34)
        .to(contrast.node(), { attr: { width: nextNormal }, duration: 0.9, ease: 'power2.inOut' }, start + 0.28)
        .to([muskValue.node(), yearValue.node(), normalLabel.node(), normalYears.node()], { opacity: 1, duration: 0.2 }, start + 0.45);
    });
  }

  function handleResize() {
    renderViz(scene);
  }

  onMount(() => {
    isMounted = true;
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', handleResize);
    renderViz(scene);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('resize', handleResize);
      activeTimeline?.kill();
    };
  });

  $: if (isMounted && scene) {
    tick().then(() => renderViz(scene));
  }
</script>

<svelte:head>
  <title>Every 0.18 Seconds</title>
</svelte:head>

<main class="experience" aria-label="Interactive data story">
  <div class="grain" aria-hidden="true"></div>
  <div class="progress-shell" aria-hidden="true">
    <div class="progress-bar" bind:this={progressBar}></div>
  </div>

  <section class="story-frame">
    <aside class="cue-card" bind:this={cueCard}>
      <p class="section-label">Narration / cue card</p>
      <p class="step">{scene.step}</p>
      <h1>{scene.keyNumber}</h1>
      <p class="cue">“{scene.cue}”</p>
      <p class="formula">{scene.formula}</p>

      <nav class="controls" aria-label="Story controls">
        <button type="button" class="nav-button" on:click={previousScene} disabled={activeIndex === 0}>
          Back
        </button>
        <span class="step-count">{activeIndex + 1} / {storyScenes.length}</span>
        <button
          type="button"
          class="nav-button primary"
          on:click={nextScene}
          disabled={activeIndex === storyScenes.length - 1}
        >
          Next
        </button>
      </nav>

      <div class="dots" aria-label="Scene progress">
        {#each storyScenes as item, index}
          <button
            type="button"
            class:active={index === activeIndex}
            aria-label={`Go to ${item.step}`}
            aria-current={index === activeIndex ? 'step' : undefined}
            on:click={() => goTo(index)}
          ></button>
        {/each}
      </div>
    </aside>

    <section class="visualization" aria-label="Visualization">
      <svg bind:this={vizSvg} role="img" aria-label={`${scene.step}: ${scene.keyNumber}`}></svg>
    </section>
  </section>

</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    min-width: 320px;
    background: #0f0d0a;
    color: #f6e8cf;
    font-family:
      Georgia,
      'Times New Roman',
      serif;
  }

  :global(button),
  :global(a) {
    font: inherit;
  }

  :global(.svg-number) {
    fill: #f6e8cf;
    font-family:
      Impact,
      Haettenschweiler,
      'Arial Narrow Bold',
      sans-serif;
    font-size: clamp(38px, 7vw, 88px);
    letter-spacing: 0;
  }

  :global(.svg-number.compact) {
    font-size: clamp(28px, 4vw, 56px);
  }

  :global(.svg-caption),
  :global(.cut-label) {
    fill: rgba(246, 232, 207, 0.76);
    font-size: clamp(13px, 1.7vw, 19px);
  }

  :global(.method-label) {
    font-size: 14px;
  }

  .experience {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    padding: clamp(14px, 2.5vw, 34px);
    background:
      linear-gradient(90deg, rgba(255, 77, 46, 0.16), transparent 34%),
      linear-gradient(135deg, rgba(246, 232, 207, 0.08), transparent 42%),
      #0f0d0a;
  }

  .grain {
    pointer-events: none;
    position: absolute;
    inset: 0;
    opacity: 0.22;
    background-image:
      linear-gradient(rgba(246, 232, 207, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(246, 232, 207, 0.05) 1px, transparent 1px);
    background-size: 18px 18px;
    mix-blend-mode: overlay;
  }

  .progress-shell {
    position: relative;
    z-index: 2;
    height: 6px;
    overflow: hidden;
    border: 1px solid rgba(246, 232, 207, 0.28);
    background: rgba(246, 232, 207, 0.06);
  }

  .progress-bar {
    width: 100%;
    height: 100%;
    transform: scaleX(0);
    transform-origin: left center;
    background: #ff4d2e;
  }

  .story-frame {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(320px, 38vw) minmax(0, 1fr);
    min-height: calc(100vh - 74px);
    border: 1px solid rgba(246, 232, 207, 0.22);
    background: rgba(15, 13, 10, 0.72);
    overflow: hidden;
  }

  .cue-card {
    display: grid;
    align-content: start;
    min-width: 0;
    min-height: 100%;
    overflow: hidden;
    padding: clamp(22px, 4vw, 48px);
    border-right: 1px solid rgba(246, 232, 207, 0.22);
  }

  .section-label,
  .step,
  .step-count {
    margin: 0;
    color: rgba(246, 232, 207, 0.62);
    font-size: 0.78rem;
    text-transform: uppercase;
  }

  .step {
    margin-top: clamp(34px, 8vh, 86px);
    color: #ff4d2e;
    font-family:
      Impact,
      Haettenschweiler,
      'Arial Narrow Bold',
      sans-serif;
    font-size: clamp(1.1rem, 2.2vw, 1.65rem);
  }

  h1 {
    max-width: 100%;
    margin: 14px 0 0;
    font-family:
      Impact,
      Haettenschweiler,
      'Arial Narrow Bold',
      sans-serif;
    font-size: clamp(2.8rem, 4.6vw, 5.8rem);
    font-weight: 900;
    line-height: 0.88;
    letter-spacing: 0;
    text-transform: uppercase;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .cue {
    max-width: 24ch;
    margin: 28px 0 0;
    color: rgba(246, 232, 207, 0.88);
    font-size: clamp(1.22rem, 2.3vw, 2.1rem);
    line-height: 1.08;
  }

  .formula {
    max-width: 38ch;
    margin: 22px 0 0;
    color: rgba(246, 232, 207, 0.58);
    font-size: 0.92rem;
    line-height: 1.4;
  }

  .controls {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 12px;
    align-items: center;
    margin-top: clamp(36px, 10vh, 120px);
  }

  .nav-button {
    min-height: 46px;
    border: 1px solid rgba(246, 232, 207, 0.45);
    color: #f6e8cf;
    background: transparent;
    cursor: pointer;
    text-transform: uppercase;
  }

  .nav-button.primary {
    border-color: #ff4d2e;
    background: #ff4d2e;
    color: #0f0d0a;
  }

  .nav-button:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }

  .dots {
    display: flex;
    gap: 8px;
    margin-top: 18px;
  }

  .dots button {
    width: 12px;
    height: 12px;
    border: 1px solid rgba(246, 232, 207, 0.48);
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
  }

  .dots button.active {
    border-color: #ff4d2e;
    background: #ff4d2e;
  }

  .visualization {
    position: relative;
    min-width: 0;
    min-height: calc(100vh - 76px);
    overflow: hidden;
    background:
      linear-gradient(180deg, rgba(246, 232, 207, 0.05), transparent 24%),
      rgba(246, 232, 207, 0.025);
  }

  .visualization::before {
    content: 'Visualization';
    position: absolute;
    top: 22px;
    right: 24px;
    z-index: 1;
    color: rgba(246, 232, 207, 0.32);
    font-size: 0.78rem;
    text-transform: uppercase;
  }

  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  @media (max-width: 860px) {
    .story-frame {
      grid-template-columns: 1fr;
      min-height: auto;
    }

    .cue-card {
      border-right: 0;
      border-bottom: 1px solid rgba(246, 232, 207, 0.22);
    }

    .step {
      margin-top: 28px;
    }

    .controls {
      margin-top: 30px;
    }

    .visualization {
      min-height: 520px;
    }
  }

  @media (max-width: 560px) {
    .experience {
      padding: 12px;
    }

    h1 {
      font-size: clamp(3rem, 18vw, 5.2rem);
    }

    .controls {
      grid-template-columns: 1fr 1fr;
    }

    .step-count {
      grid-column: 1 / -1;
      grid-row: 1;
      text-align: center;
    }

    .visualization {
      min-height: 430px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.001ms !important;
    }
  }
</style>
