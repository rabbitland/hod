/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { formatDate } from "./datepicker";
import { print as local } from "./local";
import * as lng from "./local";
import { numberMaskString } from "./mask";
import { dataview } from "./table";
import * as t from "./types";

interface Page extends HTMLElement {
  title: string;
  subtitle: string;
  date: string;
  number: string;

  content: HTMLElement;
}

function newPage(): Promise<Page> {
  let resolve;
  const promise = new Promise<Page>(r => (resolve = r));

  const page = document.createElement("div");
  page.className = "sheet padding-5mm";

  const pageHead = document.createElement("div");
  pageHead.className = "header";
  page.appendChild(pageHead);

  // Metadata (right)
  const metadataWrapper = document.createElement("div");
  metadataWrapper.className = "metadata-container";
  pageHead.appendChild(metadataWrapper);

  const numberWrapper = document.createElement("div");
  numberWrapper.className = "field-wrapper";
  const numberLabel = document.createElement("label");
  numberLabel.innerText = local.number;
  const num = document.createElement("span");
  numberWrapper.appendChild(numberLabel);
  numberWrapper.appendChild(num);
  metadataWrapper.appendChild(numberWrapper);

  const dateWrapper = document.createElement("div");
  dateWrapper.className = "field-wrapper";
  const dateLabel = document.createElement("label");
  dateLabel.innerText = local.date;
  const date = document.createElement("span");
  dateWrapper.appendChild(dateLabel);
  dateWrapper.appendChild(date);
  metadataWrapper.appendChild(dateWrapper);

  // Middle section
  const titleContainer = document.createElement("div");
  titleContainer.className = "title-container";
  pageHead.appendChild(titleContainer);

  const title = document.createElement("h1");
  titleContainer.appendChild(title);

  const subtitle = document.createElement("h3");
  titleContainer.appendChild(subtitle);

  // Logo section
  const logoContainer = document.createElement("div");
  logoContainer.className = "logo-container";
  pageHead.appendChild(logoContainer);

  const logo = document.createElement("img");
  logo.src = require("./assets/logo-black.png");
  logoContainer.appendChild(logo);

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "content";
  page.appendChild(contentWrapper);

  const defineGetterSetter = (name: string, element: HTMLElement) => {
    Object.defineProperty(page, name, {
      get(): string {
        return element.innerText;
      },
      set(value: string): void {
        if (name === "title") {
          document.title = local.title + " - " + value;
        }
        element.innerText = value;
      }
    });
  };

  defineGetterSetter("title", title);
  defineGetterSetter("subtitle", subtitle);
  defineGetterSetter("date", date);
  defineGetterSetter("number", num);
  Object.defineProperty(page, "content", { value: contentWrapper });

  logo.onload = () => resolve(page);

  return promise;
}

function row(
  wrapper: HTMLElement,
  childs: HTMLElement[],
  className?: string
): void {
  const tmp = document.createElement("div");
  tmp.className = className || "";
  tmp.classList.add("simple-row");
  for (const child of childs) {
    if (child) {
      tmp.appendChild(child);
    }
  }
  wrapper.appendChild(tmp);
}

function text(labelText: string, value: string, size?: number): HTMLElement {
  const tmp = document.createElement("div");
  if (size !== undefined) {
    tmp.style.width = `${size * 100}%`;
  }
  labelText = labelText.replace(/\.+$/g, "");
  if (!labelText.endsWith(":")) {
    labelText += ":";
  }
  tmp.className = "text-wrapper";
  const label = document.createElement("label");
  label.innerText = labelText;
  const span = document.createElement("span");
  span.innerText = value || "";
  if (value.length > 20) {
    span.style.fontSize = "12px";
  }
  tmp.appendChild(label);
  tmp.appendChild(span);
  return tmp;
}

export async function charter(doc: t.CharterDoc, wrapper: HTMLElement) {
  const page = await newPage();
  page.title = "گردش کار ارائه خدمات مسافرتی";
  page.subtitle = `صدور بلیط "چارتر"`;
  page.date = formatDate(doc.createdAt, true);
  page.number = doc._id.substr(7);

  const { content } = page;

  row(content, [
    text(lng.newCharter.serviceKind, lng.newCharter[doc.kind]),
    text(lng.newCharter.providedBy, lng.listCharter[doc.providedBy]),
    text(lng.listCharter.providerAgency, doc.providerAgency, 2),
  ]);

  row(content, [
    text(lng.newCharter.payer, doc.payer),
    text(lng.newCharter.nameOfPayer, doc.payerName),
    text(lng.newCharter.nationalCode, doc.nationalCode)
  ]);

  let paid = 0;
  let received = 0;

  content.appendChild(
    dataview(doc.tickets, {
      _num_: {
        label: "R",
        map(_, index: number) {
          return `${index + 1}`;
        }
      },
      id: "شماره بلیط",
      date: {
        label: "تاریخ",
        map(date: number) {
          return formatDate(date, true);
        }
      },
      route: {
        label: "مسیر",
        map(route: t.DBCity[]) {
          const src = route[0];
          const dest = route[route.length - 1];
          if (route.length === 0) {
            return "-";
          }
          if (route.length === 1) {
            return src.displayName + " - نامعلوم";
          }
          return src.displayName + " - " + dest.displayName;
        }
      },
      passengerName: {
        label: "مسافر",
        map(name: string, _, data: t.CharterTicket) {
          return name + " " + data.passengerLastname;
        },
        footer() {
          return "جمع کل - ریال";
        }
      },
      paid: {
        label: "بهاء پرداخت",
        map: x => ((paid += Number(x)), numberMaskString(x)),
        footer() {
          return numberMaskString(paid);
        }
      },
      received: {
        label: "بهاء دریافت",
        map: x => ((received += Number(x)), numberMaskString(x)),
        footer() {
          return numberMaskString(received);
        }
      },
      airline: "ایرلاین"
    })
  );

  console.log(doc);
  wrapper.appendChild(page);
}
