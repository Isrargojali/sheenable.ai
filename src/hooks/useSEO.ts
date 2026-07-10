import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  schema?: Record<string, any>;
}

export default function useSEO({ title, description, schema }: SEOProps) {
  useEffect(() => {
    // 1. Title Tag
    document.title = title;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    // 3. Open Graph & Twitter meta tags
    const currentUrl = window.location.href;
    const ogTags = [
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "SheEnableAI" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: "https://sheenableai.com/og-image.png" },
      { property: "og:url", content: currentUrl },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: "https://sheenableai.com/og-image.png" }
    ];

    ogTags.forEach(tag => {
      const selector = tag.property 
        ? `meta[property="${tag.property}"]` 
        : `meta[name="${tag.name}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        if (tag.property) element.setAttribute("property", tag.property);
        if (tag.name) element.setAttribute("name", tag.name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", tag.content || "");
    });

    // 4. Canonical Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", currentUrl);

    // 5. JSON-LD Structured Data
    let script = document.querySelector("#schema-jsonld") as HTMLScriptElement;
    if (schema) {
      if (!script) {
        script = document.createElement("script");
        script.setAttribute("type", "application/ld+json");
        script.setAttribute("id", "schema-jsonld");
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    } else if (script) {
      script.remove();
    }
  }, [title, description, schema]);
}
