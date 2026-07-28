(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MAP_WIDTH = 500;
  const MAP_HEIGHT = 480;
  const MAP_PADDING = 18;
  const mapCenters = {};

  async function refreshSources() {
    const app = window.ElectionApp;
    if (!app) return;
    try {
      const response = await fetch(`/api/sources?ts=${Date.now()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Falha ao consultar fontes');
      app.state.sources = data.sources || app.state.sources;
      app.renderSources();
    } catch {
      app.renderSources();
    }
  }

  function addOfficialMapStyles() {
    if (document.getElementById('officialBrazilMapStyles')) return;
    const style = document.createElement('style');
    style.id = 'officialBrazilMapStyles';
    style.textContent = `
      .brazil-map #mapShape{display:none!important}
      .brazil-map .official-state{fill:#061d31;stroke:#118cf1;stroke-width:1;vector-effect:non-scaling-stroke;cursor:pointer;opacity:0;animation:officialMapIn .55s ease forwards;transition:fill .2s ease,stroke .2s ease,filter .2s ease}
      .brazil-map .official-state:hover,.brazil-map .official-state:focus{fill:#0b3557;stroke:#63c2ff;filter:drop-shadow(0 0 5px rgba(17,140,241,.48));outline:none}
      .brazil-map #mapPoints{pointer-events:none}
      .brazil-map .map-point{stroke:#020b15;stroke-width:2;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 4px currentColor)}
      .brazil-map .official-map-note{fill:#8ea9c1;font:700 9px var(--font-display);letter-spacing:.08em}
      .brazil-map .official-map-error{fill:#f7cf18;font:700 11px var(--font-display);text-anchor:middle}
      @keyframes officialMapIn{from{opacity:0;transform:scale(.985);transform-origin:center}to{opacity:1;transform:scale(1)}}
    `;
    document.head.appendChild(style);
  }

  function svgNode(name, attributes = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function visitCoordinates(coordinates, callback) {
    if (!Array.isArray(coordinates)) return;
    if (coordinates.length >= 2 && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1])) {
      callback(coordinates);
      return;
    }
    coordinates.forEach(item => visitCoordinates(item, callback));
  }

  function createProjection(features) {
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    features.forEach(feature => visitCoordinates(feature.geometry?.coordinates, ([lon, lat]) => {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }));

    const longitudeSpan = maxLon - minLon || 1;
    const latitudeSpan = maxLat - minLat || 1;
    const scale = Math.min(
      (MAP_WIDTH - MAP_PADDING * 2) / longitudeSpan,
      (MAP_HEIGHT - MAP_PADDING * 2) / latitudeSpan
    );
    const offsetX = (MAP_WIDTH - longitudeSpan * scale) / 2;
    const offsetY = (MAP_HEIGHT - latitudeSpan * scale) / 2;

    return ([lon, lat]) => [
      offsetX + (lon - minLon) * scale,
      offsetY + (maxLat - lat) * scale
    ];
  }

  function ringPath(ring, project) {
    if (!Array.isArray(ring) || ring.length < 3) return '';
    return ring.map((point, index) => {
      const [x, y] = project(point);
      return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join('') + 'Z';
  }

  function geometryPath(geometry, project) {
    if (!geometry) return '';
    if (geometry.type === 'Polygon') {
      return geometry.coordinates.map(ring => ringPath(ring, project)).join('');
    }
    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.flatMap(polygon => polygon.map(ring => ringPath(ring, project))).join('');
    }
    return '';
  }

  function projectedRingArea(ring, project) {
    const points = ring.map(project);
    let area = 0;
    for (let index = 0; index < points.length - 1; index += 1) {
      area += points[index][0] * points[index + 1][1] - points[index + 1][0] * points[index][1];
    }
    return area / 2;
  }

  function projectedRingCentroid(ring, project) {
    const points = ring.map(project);
    let areaFactor = 0;
    let centerX = 0;
    let centerY = 0;

    for (let index = 0; index < points.length - 1; index += 1) {
      const cross = points[index][0] * points[index + 1][1] - points[index + 1][0] * points[index][1];
      areaFactor += cross;
      centerX += (points[index][0] + points[index + 1][0]) * cross;
      centerY += (points[index][1] + points[index + 1][1]) * cross;
    }

    if (Math.abs(areaFactor) < 0.0001) {
      const sum = points.reduce((accumulator, point) => [accumulator[0] + point[0], accumulator[1] + point[1]], [0, 0]);
      return [sum[0] / points.length, sum[1] / points.length];
    }

    return [centerX / (3 * areaFactor), centerY / (3 * areaFactor)];
  }

  function featureCenter(geometry, project) {
    const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.coordinates || [];
    let selectedRing = null;
    let selectedArea = -Infinity;

    polygons.forEach(polygon => {
      const outerRing = polygon?.[0];
      if (!outerRing) return;
      const area = Math.abs(projectedRingArea(outerRing, project));
      if (area > selectedArea) {
        selectedArea = area;
        selectedRing = outerRing;
      }
    });

    return selectedRing ? projectedRingCentroid(selectedRing, project) : null;
  }

  function normalizeName(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function positionMapPoints() {
    const pointsGroup = document.getElementById('mapPoints');
    const stateNames = window.ELECTION_DATA?.stateNames || {};
    if (!pointsGroup) return;

    const ufByName = new Map(Object.entries(stateNames).map(([uf, name]) => [normalizeName(name), uf]));
    const nudges = {
      DF: [0, -3], ES: [5, 1], RJ: [4, 5], SC: [2, 3],
      SE: [7, 2], AL: [8, -1], PB: [7, -3], RN: [7, -6]
    };

    pointsGroup.querySelectorAll('circle').forEach(circle => {
      const title = circle.querySelector('title')?.textContent || '';
      const stateName = title.split(':')[0];
      const uf = ufByName.get(normalizeName(stateName));
      const center = uf && mapCenters[uf];
      if (!center) return;
      const nudge = nudges[uf] || [0, 0];
      circle.setAttribute('cx', (center[0] + nudge[0]).toFixed(2));
      circle.setAttribute('cy', (center[1] + nudge[1]).toFixed(2));
      circle.setAttribute('data-uf', uf);
    });
  }

  function filterByState(uf) {
    const select = document.getElementById('localUf');
    if (!select || !Array.from(select.options).some(option => option.value === uf)) return;
    select.value = uf;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function loadOfficialBrazilMap() {
    addOfficialMapStyles();

    const container = document.getElementById('brazilMap');
    const svg = container?.querySelector('svg');
    const oldShape = document.getElementById('mapShape');
    const pointsGroup = document.getElementById('mapPoints');
    if (!container || !svg || !pointsGroup) return;

    container.setAttribute('aria-label', 'Mapa oficial do Brasil com as 27 unidades da Federação');
    svg.setAttribute('viewBox', `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);

    const loading = svgNode('text', {
      id: 'officialMapLoading',
      x: MAP_WIDTH / 2,
      y: MAP_HEIGHT / 2,
      class: 'official-map-error'
    });
    loading.textContent = 'CARREGANDO MALHA OFICIAL…';
    svg.insertBefore(loading, pointsGroup);

    try {
      const response = await fetch('/api/brazil-map', { cache: 'force-cache' });
      const geojson = await response.json();
      if (!response.ok || geojson?.type !== 'FeatureCollection') throw new Error(geojson?.error || 'Mapa inválido');

      const features = geojson.features.filter(feature => feature?.geometry);
      const project = createProjection(features);
      const stateGroup = svgNode('g', { id: 'mapStates', 'aria-label': 'Unidades da Federação' });

      features.forEach((feature, index) => {
        const properties = feature.properties || {};
        const uf = String(properties.sigla || properties.SIGLA || '').toUpperCase();
        const name = properties.nomeabrev || properties.NOMEABREV || window.ELECTION_DATA?.stateNames?.[uf] || uf;
        const pathData = geometryPath(feature.geometry, project);
        if (!pathData || !uf) return;

        const path = svgNode('path', {
          d: pathData,
          class: 'official-state',
          'data-uf': uf,
          'fill-rule': 'evenodd',
          role: 'button',
          tabindex: '0',
          'aria-label': `Filtrar pesquisas de ${name}`
        });
        path.style.animationDelay = `${Math.min(index * 22, 420)}ms`;
        const title = svgNode('title');
        title.textContent = `${name} — ${uf}`;
        path.appendChild(title);
        path.addEventListener('click', () => filterByState(uf));
        path.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            filterByState(uf);
          }
        });
        stateGroup.appendChild(path);

        const center = featureCenter(feature.geometry, project);
        if (center) mapCenters[uf] = center;
      });

      svg.insertBefore(stateGroup, pointsGroup);
      oldShape?.remove();
      loading.remove();

      const note = svgNode('text', { x: 10, y: MAP_HEIGHT - 7, class: 'official-map-note' });
      note.textContent = 'MALHA GEOGRÁFICA: IBGE';
      svg.appendChild(note);

      positionMapPoints();
      new MutationObserver(positionMapPoints).observe(pointsGroup, { childList: true, subtree: true });
    } catch (error) {
      loading.textContent = 'MALHA OFICIAL TEMPORARIAMENTE INDISPONÍVEL';
      console.error('[official-brazil-map]', error);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    refreshSources();
    loadOfficialBrazilMap();
    setInterval(refreshSources, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshSources();
    });
  });
})();
