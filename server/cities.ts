/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import * as fs from "fs";
import md5 from "md5";
import * as t from "./types";

// This file is here to parse cities.csv

const cities: t.City[] = [];

export = cities;

const csv = fs.readFileSync(__dirname + "/cities.csv").toString();
const lines = csv.split(/\n/g);

console.log("Loading cities...");
for (let i = 1; i < lines.length; ++i) {
  const line = lines[i];
  if (line.trim().length === 0) {
    continue;
  }
  const cols = parseCSVLine(line);
  const name = cols[1];
  const lat = Number(cols[2]);
  const lng = Number(cols[3]);
  cities.push({
    id: md5(lat.toFixed(4) + "-" + lng.toFixed(4)),
    name,
    lat,
    lng
  });
}
console.log("Loading cities is done.");

function parseCSVLine(line: string): string[] {
  const cols = [];
  let col = "";
  // Number of `"`.
  let nQ = 0;
  for (let i = 0; i < line.length; ++i) {
    if (line[i] === `"` && (i === 0 || line[i - 1] !== "\\")) {
      nQ++;
      continue;
    }
    if (nQ % 2 === 1) {
      // We are inside a quotation mark.
      col += line[i];
    } else if (line[i] === ",") {
      cols.push(col.trim());
      col = "";
    } else {
      col += line[i];
    }
  }
  return cols;
}