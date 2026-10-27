import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROUM TRANSIT — Fret Maritime, Aérien & Sourcing International",
  description:
    "Plateforme officielle de ROUM TRANSIT (Wholesale & Boutique) : suivi de colis en temps réel, fret maritime et aérien Chine, Dubaï, Maroc vers l'Afrique.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Anti-extension Sanitizer & Hydration Shield (Bitdefender / Chrome extensions) */}
        <script
          id="anti-extension-sanitizer"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 1. Filtrer console.error & console.warn pour neutraliser les erreurs d'hydratation causées par les extensions
                  function shouldFilter(args) {
                    try {
                      var fullText = "";
                      for (var i = 0; i < args.length; i++) {
                        var a = args[i];
                        if (typeof a === "string") {
                          fullText += " " + a;
                        } else if (a && typeof a === "object") {
                          fullText += " " + (a.message || "") + " " + (a.stack || "");
                          try { fullText += " " + JSON.stringify(a); } catch(e) {}
                        }
                      }
                      if (
                        fullText.indexOf("bis_skin_checked") !== -1 ||
                        fullText.indexOf("bis_register") !== -1 ||
                        fullText.indexOf("__processed_") !== -1 ||
                        fullText.indexOf("cz-shortcut-listen") !== -1 ||
                        (fullText.indexOf("hydrat") !== -1 && fullText.indexOf("didn't match") !== -1 && fullText.indexOf("bis_") !== -1)
                      ) {
                        return true;
                      }
                    } catch(e) {}
                    return false;
                  }

                  var origError = console.error;
                  console.error = function() {
                    if (shouldFilter(arguments)) return;
                    origError.apply(console, arguments);
                  };

                  var origWarn = console.warn;
                  console.warn = function() {
                    if (shouldFilter(arguments)) return;
                    origWarn.apply(console, arguments);
                  };

                  // 2. Intercepter les erreurs non capturées au niveau de window
                  window.addEventListener("error", function(e) {
                    if (
                      e &&
                      e.message &&
                      (e.message.indexOf("bis_skin_checked") !== -1 || e.message.indexOf("bis_register") !== -1)
                    ) {
                      e.preventDefault();
                      e.stopImmediatePropagation();
                    }
                  }, true);

                  // 3. Empêcher l'extension d'injecter bis_skin_checked via setAttribute
                  var origSet = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, val) {
                    if (
                      name === "bis_skin_checked" ||
                      name === "bis_register" ||
                      name === "cz-shortcut-listen" ||
                      (typeof name === "string" && (name.indexOf("bis_") === 0 || name.indexOf("__processed_") === 0))
                    ) {
                      return;
                    }
                    return origSet.apply(this, arguments);
                  };

                  // 4. Nettoyeur d'attributs récursif
                  function sanitizeNode(el) {
                    if (!el || el.nodeType !== 1) return;
                    var attrs = el.attributes;
                    if (attrs) {
                      for (var i = attrs.length - 1; i >= 0; i--) {
                        var n = attrs[i].name;
                        if (
                          n === "bis_skin_checked" ||
                          n === "bis_register" ||
                          n === "cz-shortcut-listen" ||
                          n.indexOf("bis_") === 0 ||
                          n.indexOf("__processed_") === 0
                        ) {
                          el.removeAttribute(n);
                        }
                      }
                    }
                  }

                  // 5. MutationObserver temps réel pour nettoyer dès l'insertion
                  if (typeof MutationObserver !== "undefined") {
                    var observer = new MutationObserver(function(mutations) {
                      for (var i = 0; i < mutations.length; i++) {
                        var m = mutations[i];
                        if (m.type === "attributes") {
                          sanitizeNode(m.target);
                        } else if (m.type === "childList") {
                          for (var j = 0; j < m.addedNodes.length; j++) {
                            sanitizeNode(m.addedNodes[j]);
                          }
                        }
                      }
                    });
                    if (document.documentElement) {
                      observer.observe(document.documentElement, {
                        attributes: true,
                        childList: true,
                        subtree: true,
                      });
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
