document.addEventListener('DOMContentLoaded', function(){
  (async function(){
  // Chart.js visual defaults for consistent, professional look
  try{
    if(typeof Chart !== 'undefined'){
      Chart.defaults.font.family = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
      Chart.defaults.font.size = 13;
      Chart.defaults.color = '#273238';
      Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0,0,0,0.7)';
      Chart.defaults.plugins.tooltip.titleFont = { weight: 600 };
      Chart.defaults.plugins.legend.labels.boxWidth = 12;
      Chart.defaults.elements.point.radius = 3;
      Chart.defaults.responsive = true;
      Chart.defaults.maintainAspectRatio = false;
    }
  }catch(e){console.warn('Could not set Chart defaults', e);}
  // --- Helpers
  function safeNum(v){
    if(v===null||v===undefined||v==='') return NaN;
    const n = Number(String(v).replace(',', '.'));
    return isNaN(n)?NaN:n;
  }

  // Nullish coalescing helper for older browsers (replace `a ?? b`)
  function nullish(a, b){ return (a === null || a === undefined) ? b : a; }

  // Global JS error handlers to avoid entire-page crashes and show a minimal banner
  try{
    function showJsError(msg){
      try{
        let b = document.getElementById('jsErrorBanner');
        if(!b){ b = document.createElement('div'); b.id = 'jsErrorBanner'; b.style.position='fixed'; b.style.left='8px'; b.style.right='8px'; b.style.bottom='8px'; b.style.zIndex=99999; b.style.background='#fee'; b.style.border='1px solid #c00'; b.style.color='#300'; b.style.padding='8px 12px'; b.style.fontSize='13px'; b.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'; b.style.borderRadius='6px'; document.body.appendChild(b); }
        b.textContent = String(msg).slice(0,400);
      }catch(_){ /* ignore */ }
    }
    window.addEventListener('error', function(ev){ try{ console.error('Global error captured', ev.error || ev.message, ev); showJsError(ev.error && ev.error.message ? ev.error.message : (ev.message || 'Error occurred')); }catch(_){}});
    window.addEventListener('unhandledrejection', function(ev){ try{ console.error('Unhandled promise rejection', ev.reason); showJsError(ev.reason && ev.reason.message ? ev.reason.message : String(ev.reason)); }catch(_){}});
  }catch(e){ /* ignore if host environment restricts */ }

  

  // Init map
  const DEFAULT_MAP_CENTER = [44.0, 6.5];
  const DEFAULT_MAP_ZOOM = 7;
  // No visible border for communes by default
  const DEFAULT_COMMUNE_BORDER = 'transparent';
  const map = L.map('map', {center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM});
  // base layers (free/open providers)
  const baseLayers = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '© OpenStreetMap contributors'}),
    sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {attribution: 'Tiles © Esri'}),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {attribution: 'Map data: © OpenTopoMap (CC-BY-SA)'}),
    ign: L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {attribution: '© OSM France'})
  };
  let currentBaseLayer = baseLayers.osm.addTo(map);

  // Prevent 404 requests for default Leaflet marker icons by embedding small data-URIs
  try{
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
    if(L && L.Icon && L.Icon.Default && typeof L.Icon.Default.mergeOptions === 'function'){
      L.Icon.Default.mergeOptions({ iconUrl: tinyPng, iconRetinaUrl: tinyPng, shadowUrl: '' });
    }
  }catch(e){/* silent */}

  // create a pane for meteo (on top)
  map.createPane('meteoPane');
  map.getPane('meteoPane').style.zIndex = 650;

  // Tabs: Visualisation / Analytics / A propos
  (function(){
    try{
      const vBtn = document.getElementById('tabVisualisationBtn');
      const rBtn = document.getElementById('tabResumeBtn');
      const anBtn = document.getElementById('tabAnalyticsBtn');
      const sBtn = document.getElementById('tabStudyBtn');
      const abBtn = document.getElementById('tabAboutBtn');
      const vTab = document.getElementById('visualisationTab');
      const aTab = document.getElementById('analyticsTab');
      const sTab = document.getElementById('studyTab');
      const abTab = document.getElementById('aboutTab');
      const rTab = document.getElementById('resumeTab');
      const rightCol = document.querySelector('.right-col');
      if(!vBtn || !anBtn || !abBtn || !vTab || !aTab || !abTab) return;
      function clearAll(){
        [vBtn, rBtn, anBtn, sBtn, abBtn].forEach(b=>{ if(b) b.classList.remove('active'); if(b) b && b.setAttribute('aria-selected','false'); });
        [vTab, rTab, aTab, sTab, abTab].forEach(t=>{ if(t) t && t.classList.add('hidden'); });
        if(rightCol) rightCol.classList.add('hidden');
      }
      function showVisual(){ clearAll(); vBtn.classList.add('active'); vBtn.setAttribute('aria-selected','true'); if(vTab) vTab.classList.remove('hidden'); try{ const mc = document.getElementById('map'); if(mc) mc.style.display = ''; map.invalidateSize(); }catch(e){} }
      function showResume(){ clearAll(); if(rBtn) { rBtn.classList.add('active'); rBtn.setAttribute('aria-selected','true'); } if(rTab) rTab.classList.remove('hidden'); // copy KPI values into resume
        try{ const copy = (srcId,dstId)=>{ const s=document.getElementById(srcId); const d=document.getElementById(dstId); if(s && d) d.textContent = s.textContent || s.innerText || '—'; };
          copy('kpiIncendiesTotal','resume_kpiIncendiesTotal'); copy('kpiCommunesCount','resume_kpiCommunesCount'); copy('kpiStationsTotal','resume_kpiStationsTotal');
        }catch(e){}
        try{ const mc = document.getElementById('map'); if(mc) mc.style.display = 'none'; if(window.map) map.invalidateSize(); }catch(e){}
      }
      function showAnalytics(){ clearAll(); anBtn.classList.add('active'); anBtn.setAttribute('aria-selected','true'); if(aTab) aTab.classList.remove('hidden'); if(rightCol) rightCol.classList.remove('hidden'); try{ const mc = document.getElementById('map'); if(mc) mc.style.display = 'none'; }catch(e){} try{ refreshAnalyticsCharts(); }catch(_){ } }
      function refreshAnalyticsCharts(){
        // allow layout to settle then resize/update charts initialized while hidden
        setTimeout(function(){
          try{
            const charts = [donutSmall, donutTFV, incidentsYearChart, rrChartFull, txChartFull, ummChartFull, histChart, countChart, txChartSmall, rrChartSmall, ummChartSmall];
            charts.forEach(c=>{ if(c && typeof c.resize === 'function') try{ c.resize(); }catch(_){ } if(c && typeof c.update === 'function') try{ c.update(); }catch(_){ } });
            // also trigger a window resize as a fallback
            try{ window.dispatchEvent(new Event('resize')); }catch(_){ }
          }catch(e){ console.warn('refreshAnalyticsCharts failed', e); }
        }, 80);
      }
      function showAbout(){ clearAll(); abBtn.classList.add('active'); abBtn.setAttribute('aria-selected','true'); if(abTab) abTab.classList.remove('hidden'); try{ const mc = document.getElementById('map'); if(mc) mc.style.display = 'none'; }catch(e){} }
      function showStudy(){ clearAll(); if(sBtn){ sBtn.classList.add('active'); sBtn.setAttribute('aria-selected','true'); } if(sTab) sTab.classList.remove('hidden'); try{ const mc = document.getElementById('map'); if(mc) mc.style.display = 'none'; }catch(e){} }
      vBtn.addEventListener('click', showVisual);
      if(rBtn) rBtn.addEventListener('click', showResume);
      anBtn.addEventListener('click', showAnalytics);
      if(sBtn) sBtn.addEventListener('click', showStudy);
      abBtn.addEventListener('click', showAbout);
      // default: show Study area
      if(typeof showStudy === 'function') showStudy(); else showVisual();
    }catch(e){console.warn('Tabs init failed', e)}
  })();

  // stationLayer is not added to the map by default; we'll add it when a commune is selected
  let stationLayer = L.featureGroup([], {pane:'meteoPane'});
  // controller to abort in-flight fetches when user switches commune
  let currentFetchController = null;

  // GeoJSON overlays loader and control
  const geoOverlays = {};
  const geoControl = L.control.layers(null, {}, {collapsed:false, position:'topright'}).addTo(map);
  // CLC style mapping (lazy-loaded from static JSON)
  let clcStyle = null;
  // Resolve URLs for static hosting under a repository subpath and
  // optionally allow an external CDN base via `window.GEOJSON_CDN`.
  function resolveUrl(url){
    if(!url) return url;
    if(/^https?:\/\//i.test(url)) return url;
        // If user provided a CDN base, join it with the relative path
        if(window && window.GEOJSON_CDN){
          return String(window.GEOJSON_CDN).replace(/\/$/, '') + '/' + url.replace(/^\//, '');
    }
    // Strip leading slash to make path repository-relative on GitHub Pages
    return url.replace(/^\//, '');
  }
  // Return an absolute URL (useful for workers/XHR contexts)
  function resolveAbsoluteUrl(url){
    try{
      const rel = resolveUrl(url);
      return new URL(rel, location.href).href;
    }catch(e){
      return resolveUrl(url);
    }
  }
  async function safeFetchJson(url){
    try{
      const r = await fetch(resolveAbsoluteUrl(url));
      if(r.ok) return await r.json();
      console.warn('safeFetchJson: fetch returned', r.status, url);
      return null;
    }catch(e){ console.warn('safeFetchJson: fetch failed', url, e); return null; }
  }
  async function loadCLCStyle(){
    if(clcStyle !== null) return clcStyle;
    try{
      console.debug('loadCLCStyle: fetching static/data/clc12_style.json');
      clcStyle = await safeFetchJson('static/data/clc12_style.json');
      console.debug('loadCLCStyle: parsed style entries', clcStyle ? Object.keys(clcStyle).length : 0);
      if(!clcStyle){ clcStyle = null; return null; }
      return clcStyle;
    }catch(e){ console.warn('Could not load CLC style JSON', e); clcStyle = null; return null; }
  }

  function getCLCCode(feature){
    const p = feature && feature.properties ? feature.properties : {};
    const keys = ['CODE_12','CODE','code_12','code','CODE12','CLC_CODE','ID'];
    for(const k of keys){ if(p[k]!==undefined && p[k]!==null && String(p[k]).trim()!=='') return String(p[k]).trim(); }
    return null;
  }

  function createCLCLegend(mapping){
    const ctrl = L.control({position:'bottomright'});
    ctrl.onAdd = function(map){
      const div = L.DomUtil.create('div','info legend');
      const entries = Object.keys(mapping || {}).sort((a,b)=>Number(a)-Number(b));
      const parts = [];
      for(const k of entries){ const v = mapping[k]; if(!v) continue; const color = v.color || '#cccccc'; const op = (v.opacity===0 || v.opacity)?v.opacity:0.7; const title = v.title || k; const box = `<i style="background:${color};opacity:${op};width:18px;height:12px;display:inline-block;margin-right:6px;border:1px solid #333"></i>`; parts.push(`<div style="margin-bottom:4px">${box}${title} <small style="color:#666;margin-left:6px">(${k})</small></div>`); }
      div.innerHTML = '<div style="font-weight:bold;margin-bottom:6px">Corine Land Cover (CLC12)</div>' + parts.join('');
      return div;
    };
    return ctrl;
  }

  let _clcLegend = null;
  let _incLegend = null;

  async function loadGeoJSONOverlays(){
    let files = null;
    try{
      // Try backend endpoint first (if you have one). If it fails, try a static
      // JSON file that we can host on GitHub Pages. Use resolveUrl so leading
      // slashes don't point to the domain root when hosted under a repo path.
      let res = null;
      if(window && window.GEOJSON_CDN){
        try{ res = await fetch(resolveAbsoluteUrl('api/data-files.json')); }catch(_){}
      } else {
        try{ res = await fetch(resolveUrl('/api/data-files')); }catch(_){ }
        if(!res || !res.ok){ try{ res = await fetch(resolveAbsoluteUrl('api/data-files.json')); }catch(_){} }
      }
      if(res && res.ok){
        const ct = (res.headers.get('content-type')||'').toLowerCase();
        // GitHub raw can return text/plain for JSON; try parsing anyway.
        try{
          files = await res.json();
        }catch(e){
          if(ct.includes('application/json')){
            console.warn('loadGeoJSONOverlays: JSON parse failed despite JSON content-type', e);
          } else {
            console.warn('loadGeoJSONOverlays: non-JSON content-type and JSON parse failed, falling back', ct);
          }
        }
      } else {
        console.warn('loadGeoJSONOverlays: /api/data-files returned', res ? res.status : 'no response');
      }
    }catch(e){ console.warn('Could not list data files for geojson layers', e); }
    // fallback when running as static site (no backend endpoint)
    // Prefer the small placeholder dataset bundled with the app.
    if(!files) files = ['communes_stats_placeholder.geojson'];
    const gfiles = (files || []).filter(f => f.toLowerCase().endsWith('.geojson'));
      for(const fname of gfiles){
        try{
          // lazy-load non-essential geojson overlays: only load communes immediately
          const baseCommuneFile = 'communes_stats.geojson';
          if(fname.toLowerCase() === baseCommuneFile){
            // load communes immediately
            let data = null;
            const encoded = 'static/data/' + encodeURIComponent(fname);
              try{ const r = await fetch(resolveAbsoluteUrl(encoded)); if(r.ok) data = await r.json(); }catch(e){ console.warn('GeoJSON fetch error', fname, e); }
              if(!data){ try{ const r2 = await fetch(resolveAbsoluteUrl('static/data/' + fname)); if(r2.ok) data = await r2.json(); }catch(e){ console.warn('GeoJSON fetch (raw) error', fname, e); } }
            if(!data) continue;
            const isCLC = fname.toLowerCase().includes('clc12_promethee') || fname.toLowerCase().includes('clc12');
            let mapping = null; if(isCLC) mapping = await loadCLCStyle();
            const layer = L.geoJSON(data, {
              style: function(feature){
                if(isCLC && mapping){ const code = getCLCCode(feature); const def = mapping && mapping[code]; if(def){ return {color: def.border || '#222', weight:0.6, fillColor: def.color || '#cccccc', fillOpacity: (def.opacity===0 || def.opacity)?def.opacity:0.7}; } return {color:'#666', weight:0.5, fillColor:'#cccccc', fillOpacity:0.15}; }
                return {color: DEFAULT_COMMUNE_BORDER, weight:0.8, fillColor:'#f7f7f7', fillOpacity: 0.35};
              },
              onEachFeature: function(feature, lyr){ const props = feature.properties || {}; const keys = Object.keys(props).slice(0,6); const html = keys.map(k=>`<b>${k}</b>: ${props[k]}`).join('<br/>'); lyr.bindPopup(html); }
            });
            layer._overlayName = fname; geoOverlays[fname] = layer; geoControl.addOverlay(layer, fname); if(!map.hasLayer(layer)) layer.addTo(map);
          } else {
            // placeholder layer: will be fetched on overlayadd
            const placeholder = L.layerGroup();
            placeholder._overlayName = fname; placeholder._needsFetch = true; placeholder._filename = fname;
            geoOverlays[fname] = placeholder; geoControl.addOverlay(placeholder, fname);
          }
          }catch(e){ console.warn('Failed preparing geojson overlay', fname, e); }
      }
  }

  // load overlays (non-blocking)
  loadGeoJSONOverlays();

  // Populate overlay dropdown and wire single-overlay selection (restore dropdown behavior)
  (function setupOverlaySelector(){
    const sel = document.getElementById('selectOverlay');
    if(!sel) return;

    const titleMap = { 'communes_stats.geojson': 'Communes (statistiques)' };
    function prettyTitle(name){ if(!name) return name; if(titleMap[name]) return titleMap[name]; let n = name.replace(/\.geojson$/i,''); try{ n = decodeURIComponent(n);}catch(e){} n = n.replace(/[_\-\.]+/g,' ').trim(); return n.split(/\s+/).map(w=> w.charAt(0).toUpperCase()+w.slice(1)).join(' '); }

    async function ensureAndAddLayer(name){
      try{
        const existing = geoOverlays[name];
        if(!existing) return null;
        if(existing._needsFetch && existing._filename){
          const data = await safeFetchJson('static/data/' + existing._filename);
          if(!data) return null;
          const newLayer = L.geoJSON(data, {
            style: function(f){ return {color:'#666', weight:0.6, fillColor:'#f7f7f7', fillOpacity:0.5}; },
            onEachFeature: function(feature, lyr){ const props = feature.properties || {}; const keys = Object.keys(props).slice(0,6); const html = keys.map(k=>`<b>${k}</b>: ${props[k]}`).join('<br/>'); lyr.bindPopup(html); }
          });
          newLayer._overlayName = name; geoOverlays[name] = newLayer; return newLayer;
        }
        return existing;
      }catch(e){ console.warn('ensureAndAddLayer failed', e); return null; }
    }

    function buildOptions(){ sel.innerHTML = '<option value="">-- Aucune --</option>'; const keys = Object.keys(geoOverlays||{}).sort(); keys.forEach(k=>{ const opt = document.createElement('option'); opt.value=k; opt.textContent = prettyTitle(k); sel.appendChild(opt); }); }
    const waiter = setInterval(()=>{ try{ if(Object.keys(geoOverlays).length>0){ clearInterval(waiter); buildOptions(); } }catch(e){} }, 200);
    setTimeout(()=>{ try{ buildOptions(); clearInterval(waiter); }catch(e){} }, 3000);

    let currentOverlayLayer = null;
    sel.addEventListener('change', async function(ev){
      const val = String(this.value || '').trim();
      try{ if(currentOverlayLayer && map.hasLayer(currentOverlayLayer)) map.removeLayer(currentOverlayLayer); }catch(e){}
      if(!val){ currentOverlayLayer = null; return; }
      const lay = await ensureAndAddLayer(val);
      if(lay){ currentOverlayLayer = lay; try{ lay.addTo(map); map.fitBounds(lay.getBounds ? lay.getBounds() : map.getBounds()); }catch(e){ try{ lay.addTo(map);}catch(_){} } }
    });
  })();

  // Basemap switcher wiring
  (function setupBasemapSwitcher(){
    const sel = document.getElementById('selectBasemap');
    if(!sel) return;
    sel.addEventListener('change', function(){
      const v = String(this.value || 'osm');
      try{ if(currentBaseLayer && map.hasLayer(currentBaseLayer)) map.removeLayer(currentBaseLayer); }catch(e){}
      if(baseLayers[v]){ currentBaseLayer = baseLayers[v]; currentBaseLayer.addTo(map); }
      else { currentBaseLayer = baseLayers.osm; currentBaseLayer.addTo(map); }
    });
  })();

  // respond to overlay add/remove to show/hide CLC legend
  map.on('overlayadd', function(e){ try{ const l = e.layer; if(l && l._overlayName && l._overlayName.toLowerCase().includes('clc12_promethee')){ if(!_clcLegend){ loadCLCStyle().then(function(m){ if(!m) return; _clcLegend = createCLCLegend(m); _clcLegend.addTo(map); }).catch(function(){}); } } }catch(err){console.warn(err);} });
  map.on('overlayremove', function(e){ try{ const l = e.layer; if(l && l._overlayName && l._overlayName.toLowerCase().includes('clc12_promethee')){ if(_clcLegend){ _clcLegend.remove(); _clcLegend = null; } } }catch(err){console.warn(err);} });

  // debug logs for overlay events
  map.on('overlayadd', function(e){ console.debug('overlayadd event', e); try{ const l = e.layer; console.debug('overlayadd layer._overlayName=', l && l._overlayName); }catch(_){} });
  map.on('overlayremove', function(e){ console.debug('overlayremove event', e); try{ const l = e.layer; console.debug('overlayremove layer._overlayName=', l && l._overlayName); }catch(_){} });

  // charts
  // minimal placeholders (template expects canvases may be absent in v2)
  function makeEmptyChart(id, cfg){ try{ const el=document.getElementById(id); if(!el) return null; return new Chart(el.getContext('2d'), cfg);}catch(e){return null}};

  const donutSmall = makeEmptyChart('donutSmall', {type:'doughnut', data:{labels:[], datasets:[{data:[],backgroundColor:[]} ]}, options:{plugins:{legend:{display:false}}}});
  const donutTFV = makeEmptyChart('donutTFV', {type:'doughnut', data:{labels:[], datasets:[{data:[],backgroundColor:[]} ]}, options:{plugins:{legend:{display:false}}}});
  // helper to pick consistent palette
  function paletteColor(i){ const pal = ['#0ea5ff','#10b981','#f59e0b','#ef4444','#7c3aed','#06b6d4','#f97316','#84cc16']; return pal[i % pal.length]; }
  const countChart = makeEmptyChart('countChart', {type:'bar', data:{labels:[], datasets:[{label:'Records', data:[], backgroundColor:'#3b82f6'}]}, options:{responsive:true, scales:{y:{beginAtZero:true}}}});
  const txChartSmall = makeEmptyChart('txChartSmall', {type:'line', data:{labels:[], datasets:[{label:'Mean TX (°C)', data:[], borderColor:'#10b981', backgroundColor:'#10b98166', fill:false}]}, options:{responsive:true, scales:{y:{beginAtZero:false}}}});
  const rrChartSmall = makeEmptyChart('rrChartSmall', {type:'line', data:{labels:[], datasets:[{label:'RR (mm)', data:[], borderColor:'#3b82f6', backgroundColor:'#3b82f666', fill:false}]}, options:{responsive:true, scales:{y:{beginAtZero:true}}}});
  const ummChartSmall = makeEmptyChart('ummChartSmall', {type:'line', data:{labels:[], datasets:[{label:'UMM', data:[], borderColor:'#ff6600', backgroundColor:'#ff660066', fill:false}]}, options:{responsive:true, scales:{y:{beginAtZero:false}}}});
  // Top10 chart removed (inaccurate). Placeholder kept null to avoid errors.
  const top10Chart = null;
  // Histogram: create a minimal bar chart instance (safe/simple options)
  const histChart = makeEmptyChart('histChart', {type:'bar', data:{labels:[], datasets:[{label:'Incendies', data:[], backgroundColor:'#ef4444'}]}, options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}});
  const scatterChart = makeEmptyChart('scatterChart', {type:'scatter', data:{datasets:[{label:'Incendies vs %Forêt', data:[], backgroundColor:'#3b82f6'}]}, options:{plugins:{legend:{display:false}}, responsive:true, scales:{x:{title:{display:true,text:'% Forêt'}}, y:{title:{display:true,text:'Incendies'}}}}});

  // Full-size incidents evolution chart (global CSV)
  const incidentsYearChart = makeEmptyChart('incidentsYearChart', {type:'bar', data:{labels:[], datasets:[{label:'Incendies', data:[], backgroundColor:'#ef4444'}]}, options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}});

  // Full-size aggregated charts (global from CSV parts)
  const rrChartFull = makeEmptyChart('rrChartFull', {type:'line', data:{labels:[], datasets:[{label:'RR annual (mm)', data:[], borderColor:'#3b82f6', backgroundColor:'#3b82f666', fill:true}]}, options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}});
  const txChartFull = makeEmptyChart('txChartFull', {type:'line', data:{labels:[], datasets:[{label:'Mean TX (°C)', data:[], borderColor:'#10b981', backgroundColor:'#10b98166', fill:false}]}, options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:false}}}});
  const ummChartFull = makeEmptyChart('ummChartFull', {type:'line', data:{labels:[], datasets:[{label:'UMM', data:[], borderColor:'#ff6600', backgroundColor:'#ff660066', fill:false}]}, options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:false}}}});

  // Load and aggregate MENSQ CSV parts to populate the full charts
  (function loadGlobalMeteoCharts(){
    try{
      const parts = [
        'static/data/MENSQ_all_1950_2023_cleaned_part1.csv',
        'static/data/MENSQ_all_1950_2023_cleaned_part2.csv',
        'static/data/MENSQ_all_1950_2023_cleaned_part3.csv'
      ].map(p=>resolveAbsoluteUrl(p));
      const yearAgg = {}; // { year: {txSum, txCount, rrSum, rrCount, ummSum, ummCount} }

      function ingestRow(r){
        try{
          const y = yearFromRow(r); if(!y || y==='unknown') return;
          const tx = (function(){ for(const k of Object.keys(r)){ if(/\btx\b|tmax|tmm|temp|tmean/i.test(k)) return safeNum(r[k]); } return NaN; })();
          const rr = (function(){ for(const k of Object.keys(r)){ if(/\brr\b|precip|pluie|precipitation/i.test(k)) return safeNum(r[k]); } return NaN; })();
          const umm = (function(){ for(const k of Object.keys(r)){ if(/\bumm\b/i.test(k)) return safeNum(r[k]); } return NaN; })();
          if(!yearAgg[y]) yearAgg[y] = {txSum:0,txCount:0,rrSum:0,rrCount:0,ummSum:0,ummCount:0};
          if(!isNaN(tx)){ yearAgg[y].txSum += tx; yearAgg[y].txCount++; }
          if(!isNaN(rr)){ yearAgg[y].rrSum += rr; yearAgg[y].rrCount++; }
          if(!isNaN(umm)){ yearAgg[y].ummSum += umm; yearAgg[y].ummCount++; }
        }catch(e){ }
      }

      (async function(){
        for(const p of parts){
          try{
            const r = await fetch(p);
            if(!r.ok) continue;
            const text = await r.text();
            if(!text) continue;
            await new Promise((resolve, reject) => {
              try{
                Papa.parse(text, {
                  header: true,
                  skipEmptyLines: true,
                  delimiter: ';',
                  chunk: function(chunk){ try{ const rows = chunk && chunk.data ? chunk.data : []; rows.forEach(ingestRow); }catch(e){} },
                  complete: function(){ resolve(); },
                  error: function(err){ console.warn('Papa parse error global parts', err); resolve(); }
                });
              }catch(e){ resolve(); }
            });
          }catch(e){ console.warn('Fetch failed for global part', p, e); }
        }
        // finalize series
        const years = Object.keys(yearAgg).sort((a,b)=>{ const na=Number(a), nb=Number(b); if(!isNaN(na)&&!isNaN(nb)) return na-nb; return a.localeCompare(b); });
        const labels = years;
        const txData = years.map(y=> { const v = yearAgg[y]; return (v && v.txCount) ? (v.txSum / v.txCount) : NaN; });
        const rrData = years.map(y=> { const v = yearAgg[y]; return (v && v.rrCount) ? (v.rrSum / v.rrCount) : 0; });
        const ummData = years.map(y=> { const v = yearAgg[y]; return (v && v.ummCount) ? (v.ummSum / v.ummCount) : NaN; });
        try{ if(txChartFull){ txChartFull.data = {labels: labels, datasets:[{label:'Mean TX (°C)', data: txData, borderColor:'#10b981', backgroundColor:'#10b98133', fill:false}]}; txChartFull.update(); } }catch(e){}
        try{ if(rrChartFull){ rrChartFull.data = {labels: labels, datasets:[{label:'RR (mm)', data: rrData, borderColor:'#3b82f6', backgroundColor:'#3b82f633', fill:true}]}; rrChartFull.update(); } }catch(e){}
        try{ if(ummChartFull){ ummChartFull.data = {labels: labels, datasets:[{label:'UMM', data: ummData, borderColor:'#ff6600', backgroundColor:'#ff660033', fill:false}]}; ummChartFull.update(); } }catch(e){}
      })();
    }catch(e){ console.warn('loadGlobalMeteoCharts failed', e); }
  })();
  // Load global incidents CSV and populate the incidentsYearChart
  (function loadIncidentsYearChart(){
    (async function(){
      try{
        const incidentsRel = 'static/data/liste_incendies_ du_20_09_2022.csv';
        const sampleRel = 'static/data/liste_incendies_sample.csv';
        const url = resolveAbsoluteUrl(incidentsRel);
        let resp = null;
        try{ resp = await fetch(url, {cache:'no-store'}); }catch(e){ console.warn('Fetch failed for', url, e); }
        if(!resp || !resp.ok){
          try{ resp = await fetch(incidentsRel, {cache:'no-store'}); }catch(e){}
        }
        if(!resp || !resp.ok){
          console.warn('Could not fetch incidents CSV at', url, resp && resp.status, '— falling back to sample CSV');
          try{
            const sresp0 = await fetch(resolveAbsoluteUrl(sampleRel));
            if(sresp0 && sresp0.ok){
              resp = sresp0;
            } else {
              console.warn('Could not fetch sample CSV at', sampleRel, sresp0 && sresp0.status);
              return;
            }
          }catch(e){
            console.warn('Failed to fetch sample CSV', e);
            return;
          }
        }
        let text = await resp.text();
        if(!text || !text.length) return;

        // If the server returns a Git LFS pointer (common when large files aren't published),
        // fall back to a small sample CSV bundled with the repo so the chart can still render.
        if(text.trim().startsWith('version https://git-lfs.github.com/spec/v1')){
          console.warn('Incidents CSV appears to be a Git LFS pointer — falling back to sample CSV');
          try{
            const sresp = await fetch(resolveAbsoluteUrl(sampleRel));
            if(sresp && sresp.ok){ text = await sresp.text(); }
            else { console.warn('Could not fetch sample CSV at', sampleRel, sresp && sresp.status); return; }
          }catch(e){ console.warn('Failed to fetch sample CSV', e); return; }
        }

        // parse and populate the chart; if parsing yields no rows, try the sample file as a fallback
        function parseAndPopulate(csvText){
          return new Promise((resolve)=>{
            try{
              Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                delimiter: ';',
                complete: function(results){
                  try{
                    const rows = results && results.data ? results.data : [];
                    if(!rows || rows.length === 0){ resolve(false); return; }
                    const fields = (results && results.meta && results.meta.fields) ? results.meta.fields.map(f=>String(f).trim()) : (rows.length ? Object.keys(rows[0]).map(f=>String(f).trim()) : []);
                    const yearField = fields.find(f=>/annee|année|year/i.test(f)) || fields.find(f=>/date/i.test(f));
                    const yearCounts = {};
                    rows.forEach(r=>{
                      try{
                        let y = yearField ? String(r[yearField]||'').trim() : '';
                        if(!y && r['Année']) y = String(r['Année']).trim();
                        if(!y){ const maybe = Object.values(r).map(v=>String(v||'')); for(const v of maybe){ const m = v.match(/(19|20)\d{2}/); if(m){ y = m[0]; break; } } }
                        if(!y) return;
                        yearCounts[y] = (yearCounts[y]||0) + 1;
                      }catch(e){}
                    });
                    const years = Object.keys(yearCounts).sort((a,b)=>{ const na=Number(a), nb=Number(b); if(!isNaN(na)&&!isNaN(nb)) return na-nb; return a.localeCompare(b); });
                    const labels = years;
                    const data = years.map(y=> yearCounts[y] || 0);
                    if(incidentsYearChart){ incidentsYearChart.data = {labels: labels, datasets:[{label:'Incendies', data: data, backgroundColor: labels.map(()=> '#ef4444')}]}; try{ incidentsYearChart.update(); }catch(e){} }
                    resolve(true);
                  }catch(e){ console.warn('Error processing global incidents CSV', e); resolve(false); }
                },
                error: function(err){ console.warn('PapaParse incidents parse error', err); resolve(false); }
              });
            }catch(e){ console.warn('PapaParse invocation failed', e); resolve(false); }
          });
        }

        let ok = await parseAndPopulate(text);
        if(!ok){
          // try sample
          try{
            const sresp2 = await fetch(resolveAbsoluteUrl(sampleRel));
            if(sresp2 && sresp2.ok){ const st = await sresp2.text(); await parseAndPopulate(st); }
          }catch(e){ console.warn('Failed to fetch/parse sample CSV as fallback', e); }
        }
      }catch(e){ console.warn('Could not load global incidents CSV', e); }
    })();
  })();

  // Density key and categories (we display only the label value for selected commune)
  let densityKey = null;
  let densityCategories = [];
  let populationKey = null;

  // Histogram helpers removed. Histogram/chart logic disabled to avoid Chart.js runtime issues.

  // Commune selector (replace former file select)
  const communeInput = document.getElementById('communeInput');
  const communeList = document.getElementById('communeList');

  let communesData = null; // GeoJSON
  let communesLayer = null;
  let selectedCommuneLayer = null;
  const communesIndex = {}; // insee -> feature properties & geometry
  const communeLabelIndex = {}; // normalized label -> insee

  function normalizeStr(s){ if(!s) return ''; try{ return String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }catch(e){ return String(s).trim().toLowerCase(); } }

  async function loadCommunesStats(){
    try{
      // Try main GeoJSON first; if unavailable, fall back to a small placeholder
      let data = null;
      try{
        const r = await fetch(resolveAbsoluteUrl('static/data/communes_stats.geojson'));
        if(r.ok) data = await r.json();
        else console.warn('loadCommunesStats: static/data/communes_stats.geojson returned', r.status);
      }catch(e){ console.warn('Failed to fetch static/data/communes_stats.geojson', e); }

      if(!data){
        try{
          const r2 = await fetch(resolveAbsoluteUrl('static/data/communes_stats_placeholder.geojson'));
          if(r2.ok) data = await r2.json();
          else console.warn('loadCommunesStats: placeholder returned', r2.status);
        }catch(e){ console.warn('Failed to fetch placeholder communes geojson', e); }
      }

      if(!data) throw new Error('Could not fetch communes_stats.geojson or placeholder');
      // quick sanity check on coordinates to detect CRS mismatch
      try{
        const sample = (data.features && data.features[0] && data.features[0].geometry && data.features[0].geometry.coordinates) ? data.features[0].geometry.coordinates : null;
        if(sample){
          // find first numeric coordinate pair
          function findFirstCoord(coords){
            if(!coords) return null;
            if(typeof coords[0] === 'number' && typeof coords[1] === 'number') return coords;
            for(const c of coords){ const f = findFirstCoord(c); if(f) return f; }
            return null;
          }
          const coord = findFirstCoord(sample);
          if(coord){ const lon = Math.abs(Number(coord[0])||0); const lat = Math.abs(Number(coord[1])||0); if(lon>180 || lat>90){ console.warn('communes_stats.geojson appears to be in projected CRS (coords out of lon/lat range). Re-generate in EPSG:4326. Sample coord:', coord); }
          }
        }
      }catch(e){ console.warn('Could not verify communes_stats.geojson coordinates', e); }
      communesData = data;
      // sort features by numeric INSEE (fall back to name when absent)
      const features = (data.features || []).slice().sort((a,b)=>{
        const pa = a.properties || {};
        const pb = b.properties || {};
        const pa_code = String(pa.insee || pa.INSEE || pa.code || pa.CODE || '').trim();
        const pb_code = String(pb.insee || pb.INSEE || pb.code || pb.CODE || '').trim();
        // push Corsican INSEE starting with 2A/2B to the end (they lack CLC/stations)
        const pa_is2 = /^2[AB]/i.test(pa_code);
        const pb_is2 = /^2[AB]/i.test(pb_code);
        if(pa_is2 && !pb_is2) return 1;
        if(pb_is2 && !pa_is2) return -1;
        const ia = Number(pa_code) || 0;
        const ib = Number(pb_code) || 0;
        if(ia !== ib) return ia - ib;
        const na = normalizeStr(pa.nom || pa.NOM || pa.name || '');
        const nb = normalizeStr(pb.nom || pb.NOM || pb.name || '');
        return na.localeCompare(nb);
      });
      // add to map using sorted features
      if(communesLayer) map.removeLayer(communesLayer);
      const fc = { type: 'FeatureCollection', features: features };

      // detect the incendies column (try several heuristics)
      function detectIncendiesKey(props){
        if(!props) return null;
        const keys = Object.keys(props);
        // prefer exact substring matches
        const prefers = ['liste_incendies','incendies','incendie','nombre'];
        for(const p of keys){ const lp = p.toLowerCase(); if(lp.includes('liste_incendies') || lp.includes('incendies')) return p; }
        for(const p of keys){ const lp = p.toLowerCase(); if(lp.includes('incendie')) return p; }
        for(const p of keys){ const lp = p.toLowerCase(); if(lp.includes('nombre') && lp.includes('anne')) return p; }
        // fallback: any numeric-like key
        for(const p of keys){ const sample = Number(props[p]); if(!isNaN(sample)) return p; }
        return null;
      }

      const sampleProps = (features[0] && features[0].properties) || {};
      // Prefer the explicit total-incendies column when available
      const preferredIncKey = 'liste_incendies_ du_20_09_2022_INSEE_Nombre de Année';
      let incendiesKey = null;
      if(sampleProps && Object.prototype.hasOwnProperty.call(sampleProps, preferredIncKey)){
        incendiesKey = preferredIncKey;
      } else {
        incendiesKey = detectIncendiesKey(sampleProps);
      }
      let minInc = Infinity, maxInc = -Infinity;
      const vals = [];
      if(incendiesKey){
        features.forEach(f => {
          const v = Number((f.properties && f.properties[incendiesKey]) || 0) || 0;
          vals.push(Math.max(0, v));
          if(v < minInc) minInc = v;
          if(v > maxInc) maxInc = v;
        });
        if(minInc === Infinity) minInc = 0;
        if(maxInc === -Infinity) maxInc = 0;
      }

      // detect density key (grille_densite_7_niveaux_2021_LIBDENS or similar)
      function detectDensityKey(props){
        if(!props) return null;
        const keys = Object.keys(props);
        for(const p of keys){ const lp = p.toLowerCase(); if(lp.includes('grille') && lp.includes('libdens')) return p; }
        for(const p of keys){ const lp = p.toLowerCase(); if(lp.includes('libdens') || lp.includes('lib_dens')) return p; }
        for(const p of keys){ const lp = p.toLowerCase(); if(lp.includes('densit') || lp.includes('dens')) return p; }
        return null;
      }
      densityKey = detectDensityKey(sampleProps);
      if(densityKey){
        const cats = new Set();
        features.forEach(f=>{ const v = f.properties && f.properties[densityKey]; if(v!==undefined && v!==null) cats.add(String(v).trim()); });
        densityCategories = Array.from(cats);
        const allNumeric = densityCategories.every(c=>!isNaN(Number(c)));
        if(allNumeric) densityCategories.sort((a,b)=>Number(a)-Number(b)); else densityCategories.sort();
      }

      // detect population key (PMUN2022 / base-pop-historiques-1876-2022__PMUN2022)
      function detectPopulationKey(props){
        if(!props) return null;
        const keys = Object.keys(props);
        // common patterns
        for(const p of keys){ const lp = p.toLowerCase(); if(lp.includes('pmun') || lp.includes('pmun2022') || lp.includes('base-pop') || lp.includes('pmun_2022') ) return p; }
        // fallback: any key containing '2022' and 'mun' or 'pop'
        for(const p of keys){ const lp = p.toLowerCase(); if(lp.includes('2022') && (lp.includes('mun') || lp.includes('pop'))) return p; }
        // last resort: any field that looks numeric and long name containing 'pop'
        for(const p of keys){ const lp = p.toLowerCase(); if(lp.includes('pop')) return p; }
        return null;
      }
      populationKey = detectPopulationKey(sampleProps);

      // Build classification: quantiles on log10(vals+1)
      function log10(x){ return Math.log10(x + 1); }
      let breaks = [];
      const nClasses = 5;
      if(incendiesKey && vals.length){
        const lvals = vals.map(v=>log10(v)).sort((a,b)=>a-b);
        for(let i=0;i<=nClasses;i++){
          const q = i/(nClasses);
          const idx = Math.floor(q * (lvals.length - 1));
          breaks.push(lvals[idx]);
        }
      }

      // continuous color ramp between min and max (based on log10(value+1))
      // white (min) -> bright red #ff0000 (max)
      const colorMin = '#ffffff'; // white at minimum
      const colorMax = '#ff0000'; // bright red at maximum

      function hexToRgb(hex){ const h = hex.replace('#',''); return {r:parseInt(h.substring(0,2),16), g:parseInt(h.substring(2,4),16), b:parseInt(h.substring(4,6),16)} }
      function rgbToHex(r,g,b){ const toHex = v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0'); return '#'+toHex(r)+toHex(g)+toHex(b); }
      function interpHex(a,b,t){ const A=hexToRgb(a), B=hexToRgb(b); return rgbToHex(A.r + (B.r-A.r)*t, A.g + (B.g-A.g)*t, A.b + (B.b-A.b)*t); }

      // compute log-min/log-max for normalization
      let logMin = 0, logMax = 0;
      if(incendiesKey && vals.length){ const lvals = vals.map(v=>log10(v)); logMin = Math.min(...lvals); logMax = Math.max(...lvals); }

      function styleByValue(feature){
        try{
          if(!incendiesKey) return { color: 'transparent', weight:0, fillOpacity:0.05 };
          const p = feature.properties || {};
          const v = Math.max(0, Number(p[incendiesKey]) || 0);
          const lv = log10(v);
          const t = (logMax === logMin) ? 0 : ((lv - logMin) / (logMax - logMin));
          const fill = interpHex(colorMin, colorMax, t);
          // make border transparent
          return { color: 'transparent', weight:0, fillColor: fill, fillOpacity:0.95 };
        }catch(e){ return { color:'transparent', weight:0, fillOpacity:0.05 }; }
      }

      // remove previous legend if any (clear container)
      try{ const lc = document.getElementById('mapLegendContainer'); if(lc) lc.innerHTML = ''; _incLegend = null; }catch(e){}

      communesLayer = L.geoJSON(fc, {
        style: styleByValue,
        onEachFeature: function(f,l){
          l._insee = (f.properties && (f.properties.insee || f.properties.INSEE)) || null;
          try{
            const val = incendiesKey ? (f.properties && f.properties[incendiesKey]) : null;
            if(val !== null && val !== undefined){ l.bindPopup(`<b>${f.properties && (f.properties.nom || f.properties.NOM || '')}</b><br/>${incendiesKey}: ${val}`); }
          }catch(e){}
        }
      }).addTo(map);

      // add continuous legend (gradient) for the incendies layer into the UI container
      if(incendiesKey && vals.length){
        try{
          const minVal = Math.round((Math.pow(10, logMin) - 1));
          const maxVal = Math.round((Math.pow(10, logMax) - 1));
          const grad = `linear-gradient(90deg, ${colorMin}, ${colorMax})`;
          const html = `<div class="info legend" style="background:rgba(255,255,255,0.95);padding:8px;border-radius:6px;box-shadow:0 6px 18px rgba(16,24,40,0.06)"><div style=\"font-weight:700;margin-bottom:6px\">Nombre d\'incendie</div><div style=\"height:12px;border:1px solid #ddd;background:${grad};margin-bottom:6px\"></div><div style=\"display:flex;justify-content:space-between;font-size:12px;color:#333\"><span>${minVal}</span><span>${maxVal}</span></div></div>`;
          const lc = document.getElementById('mapLegendContainer'); if(lc) lc.innerHTML = html; _incLegend = true;
        }catch(e){ console.warn('Could not render legend into container', e); }
      }
      // Build Top10, Histogram (log) and Scatter datasets
      try{
        // helper to get inc value
        const getInc = f => Number((f.properties && f.properties[incendiesKey]) || 0) || 0;
        const getForestPercent = (f) => {
          const p = f.properties || {};
          // direct field
          const keys = Object.keys(p).map(k=>k.toLowerCase());
          for(const k of Object.keys(p)){
            const lk = k.toLowerCase();
            if(lk.includes('foret') || lk.includes('forest') || lk === 'pct_foret' || lk === 'pourcent_foret') return Number(p[k]) || 0;
          }
          // sum tfv_ fields if present
          const tfvVals = Object.keys(p).filter(k=>k.toLowerCase().startsWith('tfv_')).map(k=>Number(p[k])||0);
          if(tfvVals.length) return tfvVals.reduce((a,b)=>a+b,0);
          // fallback: try any '%foret' pattern
          for(const k of Object.keys(p)){ if(k.indexOf('%')>=0 && k.toLowerCase().includes('fore')) return Number(p[k])||0; }
          return NaN;
        };

        const all = features.map(f=>({insee: (f.properties&& (f.properties.insee||f.properties.INSEE))||'', label: (f.properties && (f.properties.nom||f.properties.NOM||''))||'', inc: getInc(f), forest: getForestPercent(f)}));
        // Top10 placeholder (not implemented)

        // Scatter (forest%, incidents)
        const scatterData = all.filter(x=>!isNaN(x.forest)).map(x=>({x: x.forest, y: x.inc, label: `${x.label} (${x.insee})`}));
        try{
          console.debug('SummaryCharts: updating scatterChart, points=', scatterData.length);
          if(scatterChart){
            // If dataset is large, decimate by sampling to reduce Chart.js work
            const MAX_POINTS = 1200;
            let dataToUse = scatterData;
            if(Array.isArray(scatterData) && scatterData.length > MAX_POINTS){
              const step = Math.ceil(scatterData.length / MAX_POINTS);
              const sampled = [];
              for(let i=0;i<scatterData.length;i+=step) sampled.push(scatterData[i]);
              dataToUse = sampled;
              console.debug('SummaryCharts: scatterChart decimated to', dataToUse.length);
            }
            scatterChart.data = {datasets:[{label:'Incendies vs %Forêt', data: dataToUse, backgroundColor:'#3b82f6'}]};
            try{
              // disable animation and schedule update on next rAF to avoid blocking
              const prevAnim = scatterChart.options && scatterChart.options.animation;
              try{ if(scatterChart.options) scatterChart.options.animation = false; }catch(_){ }
              requestAnimationFrame(function(){
                try{ scatterChart.update(); }catch(e){ console.error('SummaryCharts: scatterChart.update failed', e); }
                try{ if(scatterChart.options) scatterChart.options.animation = prevAnim; }catch(_){ }
                console.debug('SummaryCharts: scatterChart update done');
              });
            }catch(e){ console.error('SummaryCharts: scatterChart.update failed', e); }
          }
        }catch(e){ console.error('SummaryCharts: scatterChart update failed', e); }
      }catch(e){ console.warn('Could not build summary charts', e); }
      // populate datalist (communeInput suggestions) and build lookup maps
      communeList.innerHTML = '';
      features.forEach(fe => {
        const p = fe.properties || {};
        const insee = String(p.insee || p.INSEE || p.code || '').trim();
        const label = (p.nom || p.NOM || p.name || insee);
        if(!insee) return;
        communesIndex[insee] = fe;
        const display = `${label} (${insee})`;
        const opt = document.createElement('option'); opt.value = display; communeList.appendChild(opt);
        // normalized lookups
        const nlabel = normalizeStr(label);
        if(nlabel) communeLabelIndex[nlabel] = insee;
        communeLabelIndex[normalizeStr(display)] = insee;
      });
      // initialize density categories (no chart — we only show the label)
      try{ /* densityCategories initialized above; label displayed when commune selected */ }catch(e){}
      // show communes layer by default
      communesLayer.addTo(map);
      console.debug('Loaded communes_stats.geojson: features=', data.features ? data.features.length : 0);
      // set KPI tiles if present
      try{
        const commCountEl = document.getElementById('kpiCommunesCount');
        if(commCountEl) commCountEl.innerText = (data.features || []).length;
        // also update resume KPI element if present
        const resumeComm = document.getElementById('resume_kpiCommunesCount'); if(resumeComm) resumeComm.innerText = (data.features || []).length;
        const totalInc = (vals && vals.length) ? vals.reduce((a,b)=>a+b,0) : 0;
        const incEl = document.getElementById('kpiIncendiesTotal') || document.getElementById('kpiTotalIncidents');
        if(incEl) incEl.innerText = totalInc;
        const resumeInc = document.getElementById('resume_kpiIncendiesTotal'); if(resumeInc) resumeInc.innerText = totalInc;
      }catch(e){/* ignore KPI failures */}
      return data;
    }catch(e){ console.error('Failed to load communes_stats.geojson', e); }
  }

  await loadCommunesStats();

  // Center default view on the loaded communes layer (only once)
  try{
    if(communesLayer && typeof communesLayer.getBounds === 'function'){
      const b = communesLayer.getBounds();
      if(b && b.isValid && b.isValid()){
        // pad slightly so features are not at the edges
        map.fitBounds(b.pad(0.03));
      }
    }
  }catch(e){ console.warn('Could not fit map to communes layer bounds', e); }

  function yearFromRow(row){
    const keys = Object.keys(row);
    const possible = ['AAAAMM','AAAAMMA','AAAA','DATE','ANNEE','annee','AAAA_MM'];
    for(const k of possible){ if(row[k] !== undefined && row[k] !== ''){ const s = String(row[k]); const m = s.match(/(\d{4})/); if(m) return m[1]; } }
    for(const k of keys){ const s = String(row[k]); if(/^\d{6}$/.test(s)){ return s.slice(0,4); } }
    return 'unknown';
  }

  function addStationMarker(station){
    const lat = station.lat, lon = station.lon;
    if(isNaN(lat) || isNaN(lon)) return null;
    const color = tempToColor(station.meanTx);
    const radius = Math.min(14, 3 + Math.log((station.count||1) + 1) * 2);
    const popup = `<b>${station.name || station.num_poste}</b><br/>Records: ${station.count}<br/>Mean TX: ${isNaN(station.meanTx) ? '-' : station.meanTx.toFixed(2)+' °C'}<br/>Alt: ${isNaN(station.meanAlt) ? '-' : station.meanAlt.toFixed(0)+' m'}`;
    const m = L.circleMarker([lat,lon], { radius: radius, color: '#222', weight: 0.6, fillColor: color, fillOpacity: 0.9, pane:'meteoPane' }).bindPopup(popup);
    stationLayer.addLayer(m);
    return m;
  }

  // point-in-polygon (ray casting) for simple Polygon/MultiPolygon GeoJSON
  function pointInPolygon(pt, geom){
    const x = Number(pt[0]), y = Number(pt[1]);
    if(!geom) return false;
    const type = geom.type || (geom.geometry && geom.geometry.type);
    const coords = geom.coordinates || geom.geometry && geom.geometry.coordinates;
    function pip(x,y, poly){
      let inside = false;
      for(let i=0,j=poly.length-1;i<poly.length;j=i++){
        const xi=poly[i][0], yi=poly[i][1];
        const xj=poly[j][0], yj=poly[j][1];
        const intersect = ((yi>y)!=(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi);
        if(intersect) inside = !inside;
      }
      return inside;
    }
    if(type === 'Polygon'){
      // coords: [ [ring], [hole], ...]
      const rings = coords;
      if(pip(x,y, rings[0])){
        // ensure not in hole
        for(let i=1;i<rings.length;i++) if(pip(x,y, rings[i])) return false;
        return true;
      }
      return false;
    }else if(type === 'MultiPolygon'){
      for(const poly of coords){ if(pip(x,y, poly[0])) return true; }
      return false;
    }
    return false;
  }

  let lastParsed = null;

  function processParsed(parsed, startYear, endYear){
    try{
      const allRows = parsed.data || [];
      const rows = allRows.filter(r=>{ const y = yearFromRow(r); if(!y || y==='unknown') return false; if(startYear && y < startYear) return false; if(endYear && y > endYear) return false; return true; });
      const fields = (parsed && parsed.meta && parsed.meta.fields) ? parsed.meta.fields.map(f=>String(f).trim()) : (parsed && parsed.data && parsed.data.length ? Object.keys(parsed.data[0]).map(f=>String(f).trim()) : []);
      const fieldLower = fields.map(f=>f.toLowerCase());
      const latKey = nullish(nullish(fields[fieldLower.indexOf('lat')], fields[fieldLower.indexOf('latitude')]), fields.find(f=>/lat/i.test(f)));
      const lonKey = nullish(nullish(fields[fieldLower.indexOf('lon')], fields[fieldLower.indexOf('longitude')]), fields.find(f=>/lon|lng/i.test(f)));
      const txKey = nullish(nullish(fields[fieldLower.indexOf('tx')], fields.find(f=>/^\s*tx\s*$/i.test(f))), fields.find(f=>/tmax|temp|tmm/i.test(f)));
      const altKey = nullish(fields[fieldLower.indexOf('alti')], fields.find(f=>/alt/i.test(f)));
      const numKey = fields.find(f=>/num|poste|id/i.test(f)) || fields[0];
      const nameKey = fields.find(f=>/nom|name|usuel/i.test(f)) || fields[1];

      const stations = new Map();
      const yearCounts = {};
      let totalTxSum=0, totalTxCount=0, totalAltSum=0, totalAltCount=0;

      for(const r of rows){
        const num = nullish(nullish(r[numKey], r['NUM_POSTE']), r[numKey]);
        const name = nullish(nullish(r[nameKey], r['NOM_USUEL']), '');
        const lat = latKey ? safeNum(r[latKey]) : NaN;
        const lon = lonKey ? safeNum(r[lonKey]) : NaN;
        const tx = txKey ? safeNum(r[txKey]) : NaN;
        const alt = altKey ? safeNum(r[altKey]) : NaN;
        const year = yearFromRow(r);
        yearCounts[year] = (yearCounts[year]||0) + 1;
        if(!isNaN(tx)){ totalTxSum += tx; totalTxCount++; }
        if(!isNaN(alt)){ totalAltSum += alt; totalAltCount++; }
        const key = String(num||'').trim() || (name||'').trim() || `${lat}_${lon}`;
        if(!stations.has(key)){ stations.set(key, {num_poste:num, name:name, lat:lat, lon:lon, count:0, txSum:0, txCount:0, altSum:0, altCount:0}); }
        const st = stations.get(key);
        st.count++; if(!isNaN(tx)){ st.txSum += tx; st.txCount++; } if(!isNaN(alt)){ st.altSum += alt; st.altCount++; }
        if((isNaN(st.lat) || isNaN(st.lon)) && !isNaN(lat) && !isNaN(lon)){ st.lat = lat; st.lon = lon; }
      }

      const stationArray = [];
      stations.forEach(st=>{ st.meanTx = st.txCount ? (st.txSum/st.txCount) : NaN; st.meanAlt = st.altCount ? (st.altSum/st.altCount) : NaN; stationArray.push(st); });

      const validStations = stationArray.filter(s => (s.count||0) > 0 && !isNaN(s.lat) && !isNaN(s.lon));
      const maxCount = validStations.length ? Math.max(...validStations.map(s => s.count || 0)) : 0;
      const threshold = Math.ceil(maxCount * 0.3);
      const filteredStations = validStations.filter(s => (s.count || 0) >= threshold);
      stationArray.length = 0; filteredStations.forEach(s => stationArray.push(s));

      document.getElementById('kpiTotalStations') && (document.getElementById('kpiTotalStations').innerText = stationArray.length);
      document.getElementById('kpiTotalRecords') && (document.getElementById('kpiTotalRecords').innerText = rows.length);
      const meanTxGlobal = totalTxCount ? (totalTxSum/totalTxCount) : NaN;
      document.getElementById('kpiMeanTx') && (document.getElementById('kpiMeanTx').innerText = isNaN(meanTxGlobal) ? '-' : meanTxGlobal.toFixed(2) + ' °C');

      stationLayer.clearLayers();
      stationArray.forEach(st=>{ addStationMarker(st); });
      // Do not fit bounds to stations here: keep the map view on the selected commune

    }catch(err){ console.error('Error processing parsed data', err); alert('Erreur lors du traitement des données : ' + err.message); }
  }

  // Handle commune selection (datalist input + manual INSEE)
  function parseInseeFromInput(v){
    if(!v) return null;
    v = String(v).trim();
    // try explicit (Label (12345)) or plain digits
    const m = v.match(/\((\d{5,6})\)/);
    if(m) return m[1];
    const m2 = v.match(/(\d{5,6})/);
    if(m2) return m2[1];
    // try exact or fuzzy name match (normalized)
    const nv = normalizeStr(v);
    if(communeLabelIndex[nv]) return communeLabelIndex[nv];
    for(const key in communeLabelIndex){ if(key.startsWith(nv) || key.includes(nv)){ return communeLabelIndex[key]; } }
    return null;
  }

  communeInput && communeInput.addEventListener('change', function(){ const v = (this.value||'').trim(); const insee = parseInseeFromInput(v); if(!insee) return alert('Entrez un code INSEE valide'); showCommuneByInsee(insee); });
  communeInput && communeInput.addEventListener('keyup', function(e){ if(e.key === 'Enter'){ const v = (this.value||'').trim(); const insee = parseInseeFromInput(v); if(!insee) return alert('Entrez un code INSEE valide'); showCommuneByInsee(insee); } });

  function clearSelectedCommune(){
    try{
        if(selectedCommuneLayer){
        // if the selected layer is part of the communesLayer, reset its style (no visible border)
        if(typeof selectedCommuneLayer.setStyle === 'function'){
          selectedCommuneLayer.setStyle({color: 'transparent', weight:0, fillOpacity:0.05});
        } else {
          map.removeLayer(selectedCommuneLayer);
        }
        selectedCommuneLayer = null;
      }
    }catch(e){ console.warn('Error clearing selected commune', e); }
    stationLayer.clearLayers();
    try{ if(map && map.hasLayer && map.hasLayer(stationLayer)){ map.removeLayer(stationLayer); } }catch(e){}
    const scEl = document.getElementById('stationCount'); if(scEl) scEl.innerText = '0';
  }

  // Clear in-memory caches related to station CSV parsing and UI for a fresh commune selection
  function clearCacheForCommune(){
    try{
      // clear accumulated papa parse rows
      try{ if(typeof papaAccum !== 'undefined' && papaAccum){ papaAccum.length = 0; } }catch(_){ }
      // abort any in-flight fetches
      try{ if(currentFetchController){ try{ currentFetchController.abort(); }catch(_){ } currentFetchController = null; } }catch(_){ }
      // clear last parsed snapshot
      try{ lastParsed = null; }catch(_){ }
      // remove existing station markers
      try{ if(stationLayer && typeof stationLayer.clearLayers === 'function') stationLayer.clearLayers(); }catch(_){ }
      // also remove layer from map to free references
      try{ if(map && map.hasLayer && map.hasLayer(stationLayer)){ map.removeLayer(stationLayer); } }catch(_){ }
      // null large globals if present
      try{ if(window.papaAccumGlobal){ window.papaAccumGlobal = null; } }catch(_){ }
      // reset station counters and small charts
      try{ const scEl = document.getElementById('stationCount'); if(scEl) scEl.innerText = '0'; }catch(_){ }
      try{ const scElUMM = document.getElementById('stationCountUMM'); if(scElUMM) scElUMM.innerText = '0'; }catch(_){ }
      try{ if(txChartSmall){ txChartSmall.data = {labels: [], datasets: []}; txChartSmall.update(); } }catch(_){ }
      try{ if(rrChartSmall){ rrChartSmall.data = {labels: [], datasets: []}; rrChartSmall.update(); } }catch(_){ }
      try{ if(ummChartSmall){ ummChartSmall.data = {labels: [], datasets: []}; ummChartSmall.update(); } }catch(_){ }
      // remove error banner if present
      try{ const b = document.getElementById('jsErrorBanner'); if(b) b.remove(); }catch(_){ }
    }catch(e){ console.warn('clearCacheForCommune failed', e); }
  }

  function showCommuneByInsee(insee){ try{
    const fe = communesIndex[insee]; if(!fe) return alert('Commune INSEE non trouvée: '+insee);
    clearSelectedCommune();
    // clear any cached station parsing/results before loading new commune
    try{ clearCacheForCommune(); }catch(e){}
    // try to find the corresponding layer inside the already-loaded communesLayer
    let foundLayer = null;
    try{
      if(communesLayer && typeof communesLayer.eachLayer === 'function'){
        communesLayer.eachLayer(function(l){
          try{
            const props = (l.feature && l.feature.properties) || {};
            const lid = String(props.insee || props.INSEE || l._insee || props.code || '').trim();
            if(lid === String(insee)){
              foundLayer = l;
            }
          }catch(e){}
        });
      }
    }catch(e){ console.warn('Error searching communesLayer', e); }

    if(foundLayer){
      // ensure the Visualisation tab is shown so the map is visible
      try{ const vBtn = document.getElementById('tabVisualisationBtn'); if(vBtn) vBtn.click(); }catch(e){}
      selectedCommuneLayer = foundLayer;
      try{ foundLayer.setStyle({color:'#e65a00', weight:2, fillOpacity:0.15}); }catch(e){}
      const b = foundLayer.getBounds(); if(b && b.isValid && b.isValid()){
        try{ map.fitBounds(b.pad(0.2)); }catch(e){}
        // ensure Leaflet recalculates size after tab shown
        setTimeout(function(){ try{ map.invalidateSize(); }catch(_){ } }, 300);
      }
    }else{
      // fallback: create a temporary layer from the feature
      try{ const vBtn = document.getElementById('tabVisualisationBtn'); if(vBtn) vBtn.click(); }catch(e){}
      selectedCommuneLayer = L.geoJSON(fe, {style:{color:'#e65a00', weight:2, fillOpacity:0.15}}).addTo(map);
      const layerBounds = selectedCommuneLayer.getBounds(); if(layerBounds.isValid()){
        try{ map.fitBounds(layerBounds.pad(0.2)); }catch(e){}
        setTimeout(function(){ try{ map.invalidateSize(); }catch(_){ } }, 300);
      }
    }
    // ensure stationLayer is shown when a commune is selected
    try{ if(map && map.hasLayer && !map.hasLayer(stationLayer)){ stationLayer.addTo(map); } }catch(e){}
    // update charts from properties: small donut = CLC (clc_), TFV donut = TFV (tfv_)
    const props = fe.properties || {};
    // CLC (CODE_12) values — try multiple common key patterns (case-insensitive)
    const clcKeys = Object.keys(props).filter(k => /(^clc_|clc12|code[_]?12|corine|corine_land)/i.test(k));
    const clcData = clcKeys.map(k=>({k,label:k.replace(/^(clc_|CLC_|code[_]?12[_-]?)/i,'').replace(/_/g,' '),v: Number(props[k]||0)})).filter(x=>x.v>0);
    clcData.sort((a,b)=>b.v-a.v);
    const clcLabels = clcData.map(x=>x.label);
    const clcVals = clcData.map(x=>Math.round(x.v*1000)/10);
    if(donutSmall){
      // try to map codes to human-friendly titles using clcStyle
      try{
        if(!clcVals || clcVals.length === 0){
          donutSmall.data = {labels: ['Aucune donnée'], datasets:[{data:[1], backgroundColor:['#e5e7eb']}]};
          donutSmall.update();
        } else if(clcStyle){
          const display = clcLabels.map(code => (clcStyle[String(code)] && clcStyle[String(code)].title) ? clcStyle[String(code)].title : String(code));
          donutSmall.data = {labels: display, datasets:[{data: clcVals, backgroundColor: display.map((_,i)=>`hsl(${(i*47)%360},65%,55%)`)}]};
          donutSmall.update();
        } else {
          // fallback to codes for now, then attempt to load style and re-render
          donutSmall.data = {labels: clcLabels, datasets:[{data: clcVals, backgroundColor: clcLabels.map((_,i)=>`hsl(${(i*47)%360},65%,55%)`)}]};
          donutSmall.update();
          loadCLCStyle().then(m => {
            try{
              if(!m) return;
              const display = clcLabels.map(code => (m[String(code)] && m[String(code)].title) ? m[String(code)].title : String(code));
              donutSmall.data = {labels: display, datasets:[{data: clcVals, backgroundColor: display.map((_,i)=>`hsl(${(i*47)%360},65%,55%)`)}]};
              donutSmall.update();
            }catch(e){console.warn('Could not update donutSmall with CLC titles', e);} 
          }).catch(()=>{});
        }
      }catch(e){ console.warn('Error mapping CLC labels', e); }
    }

    // TFV values (forest/TFV fields) — accept several naming patterns
    const tfvKeys = Object.keys(props).filter(k => /(^tfv_|\btfv\b|foret|forest|pct_foret|pourcent_foret)/i.test(k));
    const tfvData = tfvKeys.map(k=>({k,label:k.replace(/^(tfv_|TFV_|pct[_-]?foret|pourcent[_-]?foret)/i,'').replace(/_/g,' '),v: Number(props[k]||0)})).filter(x=>x.v>0);
    tfvData.sort((a,b)=>b.v-a.v);
    const tfvLabels = tfvData.map(x=>x.label);
    const tfvVals = tfvData.map(x=>Math.round(x.v*1000)/10);
    if(donutTFV){
      if(!tfvVals || tfvVals.length === 0){ donutTFV.data = {labels:['Aucune donnée'], datasets:[{data:[1], backgroundColor:['#e5e7eb']}]}; donutTFV.update(); }
      else { donutTFV.data = {labels: tfvLabels, datasets:[{data: tfvVals, backgroundColor: tfvLabels.map((_,i)=>`hsl(${(i*47)%360},65%,55%)`)}]}; donutTFV.update(); }
    }
    // density: immediate update from properties when available
    try{
      const dl = document.getElementById('densityLabel');
      if(densityKey){ const dv = props && props[densityKey] ? String(props[densityKey]) : null; if(dl) dl.innerText = dv || '—'; }
    }catch(e){}
    // population 2022 label update (prefer exact PMUN2022 column; format numbers)
    try{
      const pl = document.getElementById('pop2022Label');
      const preferredPopKey = 'base-pop-historiques-1876-2022__PMUN2022';
      let pv = null;
      // helper: find a property key by normalizing (case-insensitive, strip punctuation)
      const normalizeKey = k => String(k||'').toLowerCase().replace(/[^a-z0-9]/g,'');
      const pkeys = Object.keys(props||{});
      // try exact normalized match first
      const foundPreferred = pkeys.find(k => normalizeKey(k) === normalizeKey(preferredPopKey));
      if(foundPreferred){ pv = props[foundPreferred]; populationKey = foundPreferred; }
      // if not found, try common patterns (pmun / base-pop / pmun2022)
      if(pv === null || pv === undefined){
        const detected = pkeys.find(k => /pmun|base-pop|pmun2022|pmun_2022|pmun2022/i.test(k));
        if(detected){ pv = props[detected]; populationKey = detected; }
      }
      // final fallback: any key containing '2022' and 'pop' or any 'pop' key
      if(pv === null || pv === undefined){
        const detected2 = pkeys.find(k => /2022/.test(k) && /pop|mun/i.test(k));
        if(detected2){ pv = props[detected2]; populationKey = detected2; }
      }
      if(pv === null || pv === undefined){
        const detected3 = pkeys.find(k => /pop/i.test(k));
        if(detected3){ pv = props[detected3]; populationKey = detected3; }
      }
      // If value equals the INSEE code (possible mis-mapping), try to find another numeric pop key
      try{
        const inseeVal = String(props && (props.insee || props.INSEE || props.code || '') || '').trim();
        if(String(pv || '').trim() === inseeVal){
          const alt = pkeys.find(k => /pmun|base-pop|pop/i.test(k) && String(props[k]).trim() !== inseeVal && !/insee/i.test(k) );
          if(alt){ pv = props[alt]; populationKey = alt; }
        }
      }catch(_){ }
      // format numeric values with thousand separators
      let display = null;
      if(pv !== null && pv !== undefined){
        const num = Number(String(pv).replace(/\s+/g,'').replace(',','.'));
        if(!isNaN(num)){
          display = Math.round(num).toLocaleString('fr-FR');
        } else {
          display = String(pv);
        }
      }
      if(pl) pl.innerText = nullish(display, '—');
      try{ const resumePop = document.getElementById('kpiPop2022'); if(resumePop) resumePop.innerText = nullish(display, '—'); }catch(_){ }
    }catch(e){ console.warn('Population label update failed', e); }

    // also set resume density/pop KPIs if present
    try{
      try{
        const densityEl = document.getElementById('kpiDensityClass');
        if(densityEl){
          const raw = (props && (_densityKey||densityKey) && props[_densityKey||densityKey]) ? String(props[_densityKey||densityKey]) : '—';
          // map numeric codes to human-readable labels (7-level grid fallback)
          const num = Number(String(raw).replace(/\s+/g,'').replace(',','.'));
          const map = {1:'Très faible',2:'Faible',3:'Peu dense',4:'Moyenne',5:'Relativement dense',6:'Dense',7:'Très dense'};
          let dv = raw;
          if(!isNaN(num) && map[num]) dv = map[num];
          else {
            const m = String(raw || '').match(/^\s*([1-7])\b/);
            if(m && map[Number(m[1])]) dv = map[Number(m[1])];
          }
          densityEl.innerText = dv;
        }
      }catch(_){ }
    }catch(e){}
    // load station CSV parts and compute yearly mean TX inside polygon using streaming/chunked parsing
    const csvParts = [
      'static/data/MENSQ_all_1950_2023_cleaned_part1.csv',
      'static/data/MENSQ_all_1950_2023_cleaned_part2.csv',
      'static/data/MENSQ_all_1950_2023_cleaned_part3.csv'
    ].map(p=>resolveAbsoluteUrl(p));
    // capture current commune-local variables to avoid race conditions if user selects another commune
    const _fe = fe;
    const _props = props;
    const _insee = insee;
    const _densityKey = densityKey;

    (async function(){
      try{
        console.debug('Streaming CSV parts for INSEE=', _insee, csvParts);
        // aggregators to avoid storing full CSV in memory
        const stationsMap = new Map(); // key -> { num_poste, name, lat, lon, count, txSum, txCount, rrSum, ummSum, ummCount }
        const yearMap = {}; // mean TX: { sum, count }
        const yearMapRR = {}; // cumulative RR
        const yearMapUMM = {};
        let latKey, lonKey, txKey, rrKey, ummKey, numKey, nameKey;
        let fieldsDetected = false;
        let rowsMatched = 0;

        for(const p of csvParts){
          try{
            // abort previous fetch if any
            try{ if(currentFetchController){ try{ currentFetchController.abort(); }catch(_){ } currentFetchController = null; } }catch(_){ }
            currentFetchController = new AbortController();
            const r = await fetch(p, {cache:'no-store', signal: currentFetchController.signal});
            if(!r || !r.ok){ console.debug('Part not available:', p); continue; }
            const t = await r.text();
            if(t && t.trim().startsWith('version https://git-lfs.github.com/spec/v1')){ console.warn('Part appears to be LFS pointer, skipping', p); continue; }
            if(!t || !t.length) continue;
            console.debug('Fetched part', p, 'size', t.length);

            await new Promise((resolvePart, rejectPart) => {
              try{
                Papa.parse(t, {
                  header: true,
                  skipEmptyLines: true,
                  delimiter: ';',
                  worker: false,
                  chunk: function(resultsChunk){
                    try{
                      const rows = resultsChunk && resultsChunk.data ? resultsChunk.data : [];
                      if(!fieldsDetected){
                        const metaFields = resultsChunk && resultsChunk.meta && Array.isArray(resultsChunk.meta.fields) ? resultsChunk.meta.fields : [];
                        const fields = (metaFields || []).map(f=>String(f).trim());
                        const fl = fields.map(f=>f.toLowerCase());
                        latKey = nullish(nullish(fields[fl.indexOf('lat')], fields[fl.indexOf('latitude')]), fields.find(f=>/lat/i.test(f)));
                        lonKey = nullish(nullish(fields[fl.indexOf('lon')], fields[fl.indexOf('longitude')]), fields.find(f=>/lon|lng/i.test(f)));
                        txKey = nullish(nullish(fields[fl.indexOf('tx')], fields.find(f=>/^\s*tx\s*$/i.test(f) ? fields.find(f=>/^\s*tx\s*$/i.test(f)) : undefined)), fields.find(f=>/tmax|temp|tmm/i.test(f)));
                        rrKey = nullish(fields[fl.indexOf('rr')], fields.find(f=>/\brr\b|precip|pluie|precipitation|precipitations/i.test(f)));
                        ummKey = nullish(fields[fl.indexOf('umm')], fields.find(f=>/\bumm\b/i.test(f)));
                        numKey = fields.find(f=>/num|poste|id/i.test(f)) || fields[0];
                        nameKey = fields.find(f=>/nom|name|usuel/i.test(f)) || fields[1];
                        fieldsDetected = true;
                        if(!latKey || !lonKey) console.warn('Streaming parser: could not detect lat/lon keys from fields', fields);
                      }
                      if(rows.length){
                        const geom = (_fe && (_fe.geometry || _fe)) || null;
                        for(let i=0;i<rows.length;i++){
                          const rrow = rows[i];
                          const lat = latKey ? safeNum(rrow[latKey]) : NaN;
                          const lon = lonKey ? safeNum(rrow[lonKey]) : NaN;
                          if(isNaN(lat) || isNaN(lon)) continue;
                          if(!pointInPolygon([lon,lat], geom)) continue;
                          rowsMatched++;
                          const tx = txKey ? safeNum(rrow[txKey]) : NaN;
                          const rr = rrKey ? safeNum(rrow[rrKey]) : NaN;
                          const umm = ummKey ? safeNum(rrow[ummKey]) : NaN;
                          const num = nullish(nullish(rrow[numKey], rrow['NUM_POSTE']), rrow[numKey]);
                          const name = nullish(nullish(rrow[nameKey], rrow['NOM_USUEL']), '');
                          const key = String(num||'').trim() || (name||'').trim() || `${lat}_${lon}`;
                          if(!stationsMap.has(key)){
                            stationsMap.set(key, {num_poste: num, name: name, lat: lat, lon: lon, count:0, txSum:0, txCount:0, rrSum:0, ummSum:0, ummCount:0});
                          }
                          const st = stationsMap.get(key);
                          st.count++;
                          if(!isNaN(tx)){ st.txSum += tx; st.txCount = (st.txCount||0) + 1; }
                          if(!isNaN(rr)){ st.rrSum = (st.rrSum||0) + rr; }
                          if(!isNaN(umm)){ st.ummSum = (st.ummSum||0) + umm; st.ummCount = (st.ummCount||0) + 1; }
                          // update yearly aggregators
                          const y = yearFromRow(rrow);
                          if(y && y !== 'unknown'){
                            if(!isNaN(tx)){
                              yearMap[y] = yearMap[y] || {sum:0,count:0}; yearMap[y].sum += tx; yearMap[y].count++;
                            }
                            if(!isNaN(rr)){
                              yearMapRR[y] = (yearMapRR[y]||0) + rr;
                            }
                            if(!isNaN(umm)){
                              yearMapUMM[y] = yearMapUMM[y] || {sum:0,count:0}; yearMapUMM[y].sum += umm; yearMapUMM[y].count++;
                            }
                          }
                        }
                      }
                    }catch(e){ console.warn('Streaming chunk parse error', e); }
                  },
                  complete: function(){ resolvePart(); },
                  error: function(err){ console.error('PapaParse part error', err); rejectPart(err); }
                });
              }catch(err){ rejectPart(err); }
            }).catch(e=>{ console.warn('Part parse promise rejected', e); });
          }catch(e){ if(e && e.name === 'AbortError'){ console.debug('Fetch aborted for part', p); break; } console.warn('Error fetching/processing part', p, e); }
        }

        // finalize: build stations array and charts from aggregators
        try{
          const stationArray = [];
          stationsMap.forEach(st => {
            st.meanTx = st.txCount ? (st.txSum / st.txCount) : NaN;
            st.meanUmm = st.ummCount ? (st.ummSum / st.ummCount) : NaN;
            stationArray.push(st);
          });
          const validStations = stationArray.filter(s => (s.count||0) > 0 && !isNaN(s.lat) && !isNaN(s.lon));
          const maxCount = validStations.length ? Math.max(...validStations.map(s => s.count || 0)) : 0;
          const threshold = Math.ceil(maxCount * 0.3);
          const filteredStations = validStations.filter(s => (s.count || 0) >= threshold);
          // populate station markers
          stationLayer.clearLayers();
          filteredStations.forEach(st => { addStationMarker(st); });
          // update KPIs
          try{ const scEl = document.getElementById('stationCount'); if(scEl) scEl.innerText = filteredStations.length; }catch(e){}
          try{ const scElRR = document.getElementById('stationCountRR'); if(scElRR) scElRR.innerText = filteredStations.length; }catch(e){}
          try{ const ks = document.getElementById('kpiStationsTotal'); if(ks) ks.innerText = filteredStations.length; }catch(e){}
          try{ const ksResume = document.getElementById('resume_kpiStationsTotal'); if(ksResume) ksResume.innerText = filteredStations.length; }catch(e){}

          // prepare year series
          const years = Array.from(new Set(Object.keys(yearMap).concat(Object.keys(yearMapRR)).concat(Object.keys(yearMapUMM)))).sort((a,b)=>{ const na=Number(a), nb=Number(b); if(!isNaN(na) && !isNaN(nb)) return na-nb; return a.localeCompare(b); });
          const labelsY = years;
          const dataY = years.map(y=> (yearMap[y] && yearMap[y].count) ? (yearMap[y].sum / yearMap[y].count) : NaN);
          const dataYRR = years.map(y=> yearMapRR[y] ? yearMapRR[y] : 0);
          const dataYUMM = years.map(y=> (yearMapUMM[y] && yearMapUMM[y].count) ? (yearMapUMM[y].sum / yearMapUMM[y].count) : NaN);
          if(filteredStations.length === 0){
            if(txChartSmall){ txChartSmall.data = {labels: [], datasets: []}; try{ txChartSmall.update(); }catch(_){ } }
            if(rrChartSmall){ rrChartSmall.data = {labels: [], datasets: []}; try{ rrChartSmall.update(); }catch(_){ } }
            if(ummChartSmall){ ummChartSmall.data = {labels: [], datasets: []}; try{ ummChartSmall.update(); }catch(_){ } }
            try{ const dl = document.getElementById('densityLabel'); if(dl) dl.innerText = '—'; }catch(_){ }
          } else {
            if(txChartSmall){ txChartSmall.data = {labels: labelsY, datasets:[{label:'Mean TX (°C)', data: dataY, borderColor:'#10b981', backgroundColor:'#10b98166', fill:false}]}; try{ txChartSmall.update(); }catch(_){ } }
            if(rrChartSmall){ rrChartSmall.data = {labels: labelsY, datasets:[{label:'RR (mm)', data: dataYRR, borderColor:'#3b82f6', backgroundColor:'#3b82f666', fill:false}]}; try{ rrChartSmall.update(); }catch(_){ } }
            if(ummChartSmall){ ummChartSmall.data = {labels: labelsY, datasets:[{label:'UMM', data: dataYUMM, borderColor:'#ff6600', backgroundColor:'#ff660066', fill:false}]}; try{ ummChartSmall.update(); }catch(_){ } }
            try{
              const dl = document.getElementById('densityLabel');
              if(dl && _densityKey){
                const raw = _props && _props[_densityKey] ? String(_props[_densityKey]) : '—';
                const num = Number(String(raw).replace(/\s+/g,'').replace(',','.'));
                const map = {1:'Très faible',2:'Faible',3:'Peu dense',4:'Moyenne',5:'Relativement dense',6:'Dense',7:'Très dense'};
                let val = raw;
                if(!isNaN(num) && map[num]) val = map[num];
                else {
                  const m = String(raw || '').match(/^\s*([1-7])\b/);
                  if(m && map[Number(m[1])]) val = map[Number(m[1])];
                }
                dl.innerText = val;
              }
            }catch(e){}
          }
        }catch(e){ console.error('Finalizing streamed station parse failed', e); }

        // clear controller reference
        try{ currentFetchController = null; }catch(_){ }
        return;
      }catch(e){ console.warn('Streaming CSV parts failed', e); }
    })();
    // load incidents CSV and update histogram for the selected commune (use Code INSEE and Année columns)
    try{
      const incidentsFile = 'liste_incendies_ du_20_09_2022.csv';
      Papa.parse(resolveAbsoluteUrl('static/data/' + encodeURIComponent(incidentsFile)), {
        download: true,
        header: true,
        skipEmptyLines: true,
        delimiter: ';',
        worker: false,
        complete: function(results){ try{
          const rows = results && results.data ? results.data : [];
          const fields = (results && results.meta && results.meta.fields) ? results.meta.fields.map(f=>String(f).trim()) : (rows.length ? Object.keys(rows[0]).map(f=>String(f).trim()) : []);
          const inseeField = fields.find(f=>f.toLowerCase().includes('insee')) || fields.find(f=>/code.*insee/i.test(f));
          const yearField = fields.find(f=>f.toLowerCase().includes('ann')) || fields.find(f=>/year|annee/i.test(f));
          if(!inseeField || !yearField){ console.warn('Incidents CSV: could not find INSEE or Year field', fields); return; }
          const filtered = rows.filter(r=> String((r[inseeField]||'')).trim() === String(insee));
          const yearCounts = {};
          filtered.forEach(r=>{ const y = String(r[yearField]).trim(); if(!y) return; yearCounts[y] = (yearCounts[y]||0) + 1; });
          // sort years numerically when possible
          const years = Object.keys(yearCounts).sort((a,b)=>{ const na = Number(a), nb = Number(b); if(!isNaN(na) && !isNaN(nb)) return na-nb; return a.localeCompare(b); });
          if(years.length === 0){ console.debug('Incidents: no years for INSEE', insee); return; }
          const labels = years.map(y=>y);
          const data = years.map(y=> yearCounts[y]);
          console.debug('Incidents per year for INSEE', insee, labels, data);
            try{
              if(histChart){
                histChart.data = {labels: labels, datasets:[{label:'Incendies', data: data, backgroundColor: labels.map(()=>'#ef4444')} ] };
                try{ histChart.update(); }catch(e){ console.warn('histChart.update failed', e); }
                try{ const totalInc = (data || []).reduce((a,b)=>a+(Number(b)||0),0); const incEl = document.getElementById('kpiIncendiesTotal') || document.getElementById('kpiTotalIncidents'); if(incEl) incEl.innerText = totalInc; const resumeIncLocal = document.getElementById('resume_kpiIncendiesTotal'); if(resumeIncLocal) resumeIncLocal.innerText = totalInc; }catch(e){}
              } else {
              // create on-the-fly if initial creation failed
              const el = document.getElementById('histChart');
              if(el){ try{ const ctx = el.getContext('2d'); window._tempHist = new Chart(ctx, {type:'bar', data:{labels:labels, datasets:[{label:'Incendies', data:data, backgroundColor: labels.map(()=>'#ef4444')} ]}, options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}}); }catch(e){ console.warn('Could not create fallback hist chart', e); } }
              try{ const totalInc = (data || []).reduce((a,b)=>a+(Number(b)||0),0); const incEl = document.getElementById('kpiIncendiesTotal') || document.getElementById('kpiTotalIncidents'); if(incEl) incEl.innerText = totalInc; }catch(e){}
            }
          }catch(e){ console.warn('Error updating histChart', e); }
        }catch(e){ console.error('Error processing incidents CSV', e); } }, error: function(err){ console.error('PapaParse incidents error', err); }
      });
    }catch(e){ console.warn('Could not load incidents CSV', e); }
  }catch(err){ console.error(err); alert('Erreur affichage commune: '+err.message);} }

  function tempToColor(temp){ if(isNaN(temp)) return '#888888'; const t = Math.max(-10, Math.min(35, temp)); const ratio = (t + 10) / (35 + 10); const hue = (1 - ratio) * 240; return `hsl(${hue.toFixed(0)},75%,45%)`; }

  // Reset view button: recentre la carte et efface la sélection
  try{
    const resetBtn = document.getElementById('resetViewBtn');
    if(resetBtn){
      resetBtn.addEventListener('click', function(){
        try{
          map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
          // clear highlighted commune and station markers
          try{ clearSelectedCommune(); }catch(e){}
          try{ stationLayer.clearLayers(); }catch(e){}
        }catch(err){ console.warn('Erreur lors du reset de la vue', err); }
      });
    }
  }catch(e){ console.warn('Reset view handler not attached', e); }

  })();
});

// Initialize cell toggles: attach to buttons added in template
document.addEventListener('DOMContentLoaded', function(){
  try{
    const ICON_EYE = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    const ICON_EYE_SLASH = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a21.86 21.86 0 0 1 5.06-6.94"></path><path d="M1 1l22 22"></path></svg>';

    // Helper normalizer
    function _localNormalize(s){ try{ return String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0000-\u036f]/g,''); }catch(e){ return String(s||'').trim().toLowerCase(); } }

    // Cell toggle buttons
    try{
      const buttons = document.querySelectorAll('.cell-toggle');
      buttons.forEach(btn=>{
        try{
          const parent = btn.closest('.selector-grid > div');
          const headerEl = parent && parent.querySelector('.cell-header .small');
          const rawKey = headerEl ? headerEl.textContent.trim() : (parent ? parent.getAttribute('data-cell-id') || 'cell' : 'cell');
          const storageKey = 'cellState:' + _localNormalize(rawKey).slice(0,60);
          const stored = (window.localStorage && localStorage.getItem(storageKey)) || null;
          if(stored === 'collapsed'){
            parent && parent.classList.add('collapsed');
            btn.innerHTML = ICON_EYE_SLASH;
            btn.setAttribute('aria-expanded','false');
          } else {
            btn.innerHTML = ICON_EYE;
            btn.setAttribute('aria-expanded','true');
          }
          btn.addEventListener('click', function(){
            if(!parent) return;
            const isCollapsed = parent.classList.toggle('collapsed');
            btn.setAttribute('aria-expanded', String(!isCollapsed));
            btn.innerHTML = isCollapsed ? ICON_EYE_SLASH : ICON_EYE;
            try{ if(window.localStorage) localStorage.setItem(storageKey, isCollapsed ? 'collapsed' : 'expanded'); }catch(e){}
            try{ const canvas = parent.querySelector('canvas'); const id = canvas && canvas.id; if(id){ const ch = Chart.getChart(id); if(ch) ch.update(); } }catch(e){}
          }); }catch(err){ console.warn('cell-toggle init error', err); }
      });
    }catch(e){ console.warn('Cell toggle setup failed', e); }

    // Export handlers
    try{
      const exports = document.querySelectorAll('.cell-export');
      exports.forEach(ex => {
        ex.addEventListener('click', function(){
          try{
            const parent = ex.closest('.selector-grid > div');
            if(!parent) return;
            const canvas = parent.querySelector('canvas');
            if(!canvas) return alert('Aucun graphique à exporter dans cette cellule');
            try{
              const ch = Chart.getChart(canvas.id);
              const dataUrl = (ch && typeof ch.toBase64Image === 'function') ? ch.toBase64Image() : (canvas.toDataURL && canvas.toDataURL('image/png'));
              const a = document.createElement('a');
              const titleEl = parent.querySelector('.cell-header .small');
              const title = titleEl ? titleEl.textContent.trim().replace(/[^a-z0-9-_\.]/gi, '_') : (canvas.id||'chart');
              a.href = dataUrl; a.download = `${title}.png`; document.body.appendChild(a); a.click(); a.remove();
            }catch(e){ console.warn('Export failed', e); alert('Impossible d\'exporter le graphique : '+(e && e.message ? e.message : e)); }
          }catch(err){ console.warn('Export handler error', err); }
        });
      });
    }catch(e){ console.warn('Export handlers init failed', e); }

    // CSV export buttons
    try{
      const ctrlWrappers = document.querySelectorAll('.cell-controls');
      ctrlWrappers.forEach(wrapper => {
        if(wrapper.querySelector('.cell-csv')) return;
        const btn = document.createElement('button');
        btn.className = 'cell-csv';
        btn.title = 'Exporter CSV';
        btn.setAttribute('aria-label','Exporter CSV');
        btn.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15V5a2 2 0 0 0-2-2H7L3 6v9a2 2 0 0 0 2 2h14"></path><path d="M7 10h7M7 14h7"></path></svg>';
        const toggle = wrapper.querySelector('.cell-toggle');
        if(toggle) wrapper.insertBefore(btn, toggle);
        else wrapper.appendChild(btn);
        btn.addEventListener('click', function(){
          try{
            const parent = btn.closest('.selector-grid > div');
            if(!parent) return alert('Aucune cellule cible');
            const canvas = parent.querySelector('canvas');
            if(!canvas) return alert('Aucun graphique dans cette cellule');
            const ch = Chart.getChart(canvas.id);
            if(!ch) return alert('Aucun Chart.js trouvé pour ce canvas');
            let csv = '';
            const ds = ch.data.datasets || [];
            const labels = ch.data.labels || [];
            if(labels && labels.length && ds.length){
              csv += 'label,' + ds.map(d=>('"'+(d.label||'series')+'"')).join(',') + '\n';
              for(let i=0;i<labels.length;i++){
                const row = [ '"'+String(labels[i])+'"' ];
                for(const d of ds){ const v = Array.isArray(d.data) ? d.data[i] : (d.data && d.data[i]) ; row.push(v==null? '': String(v)); }
                csv += row.join(',') + '\n';
              }
            } else {
              for(const d of ds){
                csv += 'dataset,'+('"'+(d.label||'series')+'"')+'\n';
                if(Array.isArray(d.data)){
                  if(d.data.length && typeof d.data[0] === 'object'){
                    csv += 'x,y,label\n';
                    d.data.forEach(pt=>{ csv += `${pt.x||''},${pt.y||''},"${pt.label||''}"\n`; });
                  } else {
                    csv += 'index,value\n'; d.data.forEach((v,i)=>{ csv += `${i},${v}\n`; });
                  }
                }
              }
            }
            const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
            const a = document.createElement('a'); const url = URL.createObjectURL(blob);
            const titleEl = parent.querySelector('.cell-header .small');
            const title = titleEl ? titleEl.textContent.trim().replace(/[^a-z0-9-_\.]/gi, '_') : (canvas.id||'chart');
            a.href = url; a.download = `${title}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
          }catch(err){ console.warn('CSV export failed', err); alert('Erreur export CSV: '+(err && err.message ? err.message : err)); }
        });
      });
    }catch(e){ console.warn('CSV buttons init failed', e); }

  }catch(e){console.warn('Cell toggles init failed', e);} 
});
