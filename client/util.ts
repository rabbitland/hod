/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { get } from "./context";
import * as t from "./types";

export function delay(t?: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, t));
}

export function len(o: {}): number {
  return Object.keys(o).length;
}

export function onEnter(el: HTMLElement, cb): void {
  el.addEventListener("keyup", e => {
    if (e.keyCode === 13) {
      cb();
    }
  });
}

export function prepend(parent: HTMLElement, el: HTMLElement): void {
  parent.insertBefore(el, parent.childNodes[0]);
}

export function nodeRequire(module: string): any {
  return require(module);
}

export function fa(icon: string | string[], reqular = false): HTMLElement {
  if (typeof icon === "string") {
    const span = document.createElement("span");
    span.classList.add(reqular ? "far" : "fa");
    span.classList.add("fa-" + icon);
    return span;
  } else {
    const wrapper = document.createElement("div");
    wrapper.classList.add("icon");
    if (icon.length > 2) {
      throw new Error(
        "Icon group with more than 2 icons is not yet implemented."
      );
    }
    icon.forEach(i => {
      wrapper.appendChild(fa(i));
    });
    return wrapper;
  }
}

export function resetValue(...elements: HTMLInputElement[]) {
  for (const element of elements) {
    element.value = "";
  }
}

export function cacheForUser<V>() {
  const map = new Map<string, V>();
  return {
    get(): V {
      const token = get("currentToken");
      return map.get(token);
    },
    set(data: V): void {
      const token = get("currentToken");
      map.set(token, data);
    },
    has(): boolean {
      const token = get("currentToken");
      return map.has(token);
    },
    delete(): boolean {
      const token = get("currentToken");
      return map.delete(token);
    }
  };
}

export function checkBox(text: string): HTMLInputElement {
  const container = document.createElement("div");
  container.classList.add("checkbox-container");
  const label = document.createTextNode(text);
  container.appendChild(label);

  const input = document.createElement("input");
  input.type = "checkbox";
  container.appendChild(input);

  const checkmark = document.createElement("span");
  checkmark.classList.add("checkmark");
  container.appendChild(checkmark);
  return input;
}

export interface sumCharterTicketsResult {
  totalReceived: number;
  totalPaid: number;
}

export function sumCharterTickets(
  tickets: t.CharterTicket[]
): sumCharterTicketsResult {
  let totalReceived = 0;
  let totalPaid = 0;
  for (let i = 0; i < tickets.length; ++i) {
    const received = Number(tickets[i].received);
    const paid = Number(tickets[i].paid);
    if (!isNaN(received)) {
      totalReceived += received;
    }
    if (!isNaN(paid)) {
      totalPaid += paid;
    }
  }
  return { totalReceived, totalPaid };
}

export interface sumSystemicTicketsResult {
  totalReceived: number;
}

export function sumSystemicTickets(
  tickets: t.SystemicTicket[]
): sumSystemicTicketsResult {
  let totalReceived = 0;
  for (let i = 0; i < tickets.length; ++i) {
    const received = Number(tickets[i].received);
    if (!isNaN(received)) {
      totalReceived += received;
    }
  }
  return { totalReceived };
}
