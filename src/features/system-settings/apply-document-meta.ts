import { siteConfig } from "@/config/site";

let appliedSiteName: string = siteConfig.name;

function upsertIconLink(rel: string, href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.append(link);
  }
  link.href = href;
}

export function applyDocumentMeta(siteName: string, favicon?: string | null) {
  if (document.title === appliedSiteName || document.title === siteConfig.name || document.title === "") {
    document.title = siteName;
  } else if (document.title.endsWith(` | ${appliedSiteName}`) || document.title.endsWith(` | ${siteConfig.name}`)) {
    const suffix = document.title.endsWith(` | ${appliedSiteName}`) ? appliedSiteName : siteConfig.name;
    document.title = `${document.title.slice(0, -(suffix.length + 3))} | ${siteName}`;
  }
  appliedSiteName = siteName;

  if (favicon) {
    upsertIconLink("icon", favicon);
    upsertIconLink("shortcut icon", favicon);
  }
}
