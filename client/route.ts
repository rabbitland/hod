/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import axios from "axios";
import * as d3 from "d3";
import * as geojson from "./assets/countries.geo.json";
import { get } from "./context";
import { emit } from "./ipc";
import { route as local } from "./local";
import * as t from "./types";

let citiesCache: t.City[];
let canvasCache;
let updateFnCache;

// A global var to pass data data from routeSelector to update().
const data = {
  // Selected route.
  route: null,
  // Search results.
  results: [],
  // Hovered item in search results.
  hover: null
};

export interface RouteSelectorElement extends HTMLDivElement {
  route: t.City[];
  show(): void;
}

export function routeSelector(): RouteSelectorElement {
  // Preload data.
  fetchData();

  const route = [];

  const block = document.createElement("div");
  block.id = "route-block";
  block.onclick = e => {
    if (e.target === block) {
      data.route = null;
      data.hover = null;
      data.results.length = 0;
      block.parentElement.removeChild(block);
    }
  };

  // Render view.

  const wrapper = document.createElement("div");
  wrapper.id = "route-wrapper";
  block.appendChild(wrapper);

  const mapWrapper = document.createElement("div");
  mapWrapper.id = "map-wrapper";
  wrapper.appendChild(mapWrapper);
  const update = renderMap(mapWrapper);

  const searchWrapper = document.createElement("div");
  searchWrapper.id = "route-search-wrapper";
  wrapper.appendChild(searchWrapper);

  const searchInputEl = document.createElement("input");
  searchWrapper.appendChild(searchInputEl);
  searchInputEl.placeholder = local.search;

  const serachResultsWrapper = document.createElement("div");
  serachResultsWrapper.id = "route-search-results";
  mapWrapper.appendChild(serachResultsWrapper);

  const routeWrapper = document.createElement("div");
  routeWrapper.id = "route-route-wrapper";
  wrapper.appendChild(routeWrapper);

  function updateRoute() {
    routeWrapper.innerHTML = "";
    for (let i = 0; i < route.length; ++i) {
      const city = route[i];
      const tmp = document.createElement("div");
      tmp.innerHTML = city.name;
      routeWrapper.appendChild(tmp);
      tmp.onclick = () => {
        route.splice(i, 1);
      };
      // TODO(qti3e) A better UI for this part!
    }
    updateBtn();
  }

  // Push city to route.
  // ctrl+enter on searchInputEl.
  // click on search result elements. (.result)
  function select(city?: t.City) {
    if (!city) {
      city = data.results[0];
    }
    if (city) {
      route.push(city);
      updateRoute();
    }
    searchInputEl.value = "";
    data.results.length = 0;
  }

  function updateSearchResults() {
    serachResultsWrapper.innerHTML = "";
    data.hover = null;
    const len = Math.min(6, data.results.length);
    for (let i = 0; i < len; ++i) {
      const city = data.results[i];
      const tmp = document.createElement("div");
      tmp.className = "result";
      tmp.innerText = city.name + " - " + city.country;
      serachResultsWrapper.appendChild(tmp);
      tmp.addEventListener("mouseover", () => {
        data.hover = city;
      });
      tmp.addEventListener("mouseout", () => {
        data.hover = null;
      });
      tmp.onclick = () => {
        select(city);
      };
    }
  }

  let time = 0;
  let ctrl = false;
  searchInputEl.addEventListener("keyup", e => {
    if (e.keyCode === 17) {
      ctrl = false;
    }
    if (Date.now() - time < 150) {
      return;
    }
    time = Date.now();
    const value = searchInputEl.value.trim().toLowerCase();
    const cities = citiesCache;
    data.results = [];
    if (value.length < 2) {
      updateSearchResults();
      return;
    }
    for (let i = 0; i < cities.length; ++i) {
      if (cities[i].name.toLowerCase().indexOf(value) > -1) {
        data.results.push(cities[i]);
      }
    }
    if (data.results.length < 51) {
      // Sort results.
      data.results.sort((a: t.City, b: t.City) => {
        const aStarts = a.name.toLowerCase().startsWith(value);
        const bStarts = b.name.toLowerCase().startsWith(value);
        if (aStarts && bStarts) {
          if (a.name.length < b.name.length) {
            return -1;
          } else {
            return 1;
          }
        }
        if (aStarts) {
          return -1;
        }
        if (bStarts) {
          return 1;
        }
        const aIran = a.country === "Iran";
        const bIran = b.country === "Iran";
        if (aIran && bIran) {
          if (a.name.length < b.name.length) {
            return -1;
          } else {
            return 1;
          }
        }
        if (aIran) {
          return -1;
        }
        if (bIran) {
          return 1;
        }
        return 0;
      });
    }
    updateSearchResults();
  });
  searchInputEl.addEventListener("keydown", e => {
    if (e.keyCode === 17) {
      ctrl = true;
    } else if (ctrl && e.keyCode === 13) {
      select();
    }
  });

  // End of rendering view.

  // Toggle Button.
  const btn = document.createElement("div") as RouteSelectorElement;
  btn.classList.add("route-selector");
  btn.route = route;

  const fromEl = document.createElement("div");
  fromEl.classList.add("city-name");
  const toEl = document.createElement("div");
  toEl.classList.add("city-name");

  btn.appendChild(fromEl);
  btn.appendChild(document.createElement("div")).className = "dot";
  btn.appendChild(document.createElement("div")).className = "dot";
  btn.appendChild(document.createElement("div")).className = "dot";
  btn.appendChild(toEl);
  updateBtn();

  btn.onclick = () => {
    show();
  };

  btn.show = show;

  // Function to show modal.
  function show() {
    const parent = btn.parentElement;
    parent.appendChild(block);
    data.route = btn.route;
    // Start animation loop.
    update();
  }

  // Updates btn.
  function updateBtn() {
    const route = btn.route;
    const len = route.length;
    const fromStr = len > 0 ? route[0].name : local.unknown;
    const toStr = len > 1 ? route[len - 1].name : local.unknown;
    fromEl.innerText = fromStr;
    toEl.innerText = toStr;
  }

  return btn;
}

function renderMap(wrapper: HTMLElement): () => void {
  if (canvasCache) {
    wrapper.appendChild(canvasCache);
    return updateFnCache;
  }
  const width = 850;
  const height = 400;

  const canvas = document.createElement("canvas");
  wrapper.appendChild(canvas);
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  const projection = d3
    .geoMercator()
    .scale(130)
    .translate([width / 2, height / 2]);

  const geoGenerator = d3
    .geoPath()
    .projection(projection)
    .pointRadius(4)
    .context(context);

  let u = 0;

  function update() {
    if (data.route === null) {
      console.log("Stop rendering");
      return;
    }

    context.clearRect(0, 0, width, height);

    context.lineWidth = 0.5;
    context.strokeStyle = "#213747";
    context.beginPath();
    geoGenerator({
      type: "FeatureCollection",
      features: geojson.features
    });
    context.stroke();

    if (data.hover) {
      // Only show hovered city.
      context.beginPath();
      context.fillStyle = "#26ff5f";
      geoGenerator.pointRadius(Math.abs((u - 0.5) * 15) + 5);
      geoGenerator({
        type: "Feature",
        features: undefined,
        geometry: {
          type: "Point",
          radius: 340,
          coordinates: data.hover.lngLat
        }
      });
      context.fill();
    } else {
      // Draw paths.
      for (let i = 1; i < data.route.length; ++i) {
        const fromLngLat = data.route[i - 1].lngLat;
        const toLngLat = data.route[i].lngLat;
        context.beginPath();
        context.strokeStyle = "#ff9b26";
        context.lineWidth = 3;
        geoGenerator({
          type: "Feature",
          features: undefined,
          geometry: {
            type: "LineString",
            coordinates: [fromLngLat, toLngLat]
          }
        });
        context.stroke();
        // Point
        // TODO(qti3e) Render only one point at a time.
        const geoInterpolator = d3.geoInterpolate(fromLngLat, toLngLat);
        context.beginPath();
        context.fillStyle = "#ff9b26";
        geoGenerator.pointRadius(4);
        geoGenerator({
          type: "Feature",
          features: undefined,
          geometry: {
            type: "Point",
            coordinates: geoInterpolator(u)
          }
        });
        context.fill();
      }
      // Render search results.
      const len = Math.min(data.results.length, 50);
      for (let i = 0; i < len; ++i) {
        context.beginPath();
        context.fillStyle = "#26ff5f";
        geoGenerator.pointRadius(Math.abs((u - 0.5) * 15) + 5);
        geoGenerator({
          type: "Feature",
          features: undefined,
          geometry: {
            type: "Point",
            radius: 340,
            coordinates: data.results[i].lngLat
          }
        });
        context.fill();
      }
    }

    u += 0.005;

    if (u > 1) {
      u = 0;
    }

    requestAnimationFrame(update);
  }

  updateFnCache = update;
  canvasCache = canvas;

  return update;
}

async function fetchData(): Promise<t.City[]> {
  if (citiesCache) {
    return citiesCache;
  }
  const token = get("currentToken");
  const server = get("server");
  const { data: res } = await axios.post(
    server + "/data/cities",
    {},
    {
      headers: {
        "hod-token": token
      }
    }
  );
  citiesCache = res.data;
  return res.data;
}

setTimeout(() => {
  emit("goto", "newCharter");
});
