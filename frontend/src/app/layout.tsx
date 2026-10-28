import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROUM TRANSIT — Voie Maritime, Aérienne & Sourcing International",
  description:
    "Plateforme officielle de ROUM TRANSIT (Wholesale & Boutique) : suivi de colis en temps réel, voie maritime et aérienne Chine, Dubaï, Maroc vers l'Afrique.",
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
        {/* Anti-extension Shield (Bitdefender / Chrome extensions error boundary protection) */}
        <script
          id="anti-extension-shield"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Vérificateur universel d'erreurs provenant d'extensions de navigateur
                  function isExtensionError(text) {
                    if (!text || typeof text !== "string") return false;
                    return (
                      text.indexOf("chrome-extension:") !== -1 ||
                      text.indexOf("moz-extension:") !== -1 ||
                      text.indexOf("safari-extension:") !== -1 ||
                      text.indexOf("eppiocemhmnlbhjplcgkofciiegomcon") !== -1 ||
                      text.indexOf("M_ID") !== -1 ||
                      text.indexOf("bis_skin_checked") !== -1 ||
                      text.indexOf("bis_register") !== -1 ||
                      text.indexOf("__processed_") !== -1 ||
                      text.indexOf("cz-shortcut-listen") !== -1 ||
                      (text.indexOf("hydrat") !== -1 && text.indexOf("didn't match") !== -1 && text.indexOf("bis_") !== -1)
                    );
                  }

                  // 1. Filtrer console.error & console.warn
                  function shouldFilterArgs(args) {
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
                      return isExtensionError(fullText);
                    } catch(e) {
                      return false;
                    }
                  }

                  var origError = console.error;
                  console.error = function() {
                    if (shouldFilterArgs(arguments)) return;
                    origError.apply(console, arguments);
                  };

                  var origWarn = console.warn;
                  console.warn = function() {
                    if (shouldFilterArgs(arguments)) return;
                    origWarn.apply(console, arguments);
                  };

                  // 2. Intercepter window.onerror
                  var origOnError = window.onerror;
                  window.onerror = function(msg, url, line, col, err) {
                    var str = (msg || "") + " " + (url || "") + " " + (err && err.stack ? err.stack : "");
                    if (isExtensionError(str)) {
                      return true; // Empêche l'affichage de l'overlay Next.js
                    }
                    if (origOnError) return origOnError.apply(this, arguments);
                  };

                  // 3. Intercepter window.addEventListener('error') en phase de capture prioritaire
                  window.addEventListener("error", function(e) {
                    try {
                      var fn = e && e.filename ? e.filename : "";
                      var msg = e && e.message ? e.message : "";
                      var stack = e && e.error && e.error.stack ? e.error.stack : "";
                      var total = fn + " " + msg + " " + stack;
                      if (isExtensionError(total)) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        return true;
                      }
                    } catch(err) {}
                  }, true);

                  // 4. Intercepter les promesses non gérées provenant d'extensions
                  window.addEventListener("unhandledrejection", function(e) {
                    try {
                      var reason = e && e.reason;
                      var str = (reason && (reason.stack || reason.message)) || String(reason || "");
                      if (isExtensionError(str)) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                      }
                    } catch(err) {}
                  }, true);

                  // 5. Empêcher l'extension d'injecter des attributs comme bis_skin_checked
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

                  // 6. Nettoyeur d'attributs récursif
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

                  // 7. MutationObserver en temps réel
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
