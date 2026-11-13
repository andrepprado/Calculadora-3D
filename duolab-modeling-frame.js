(function () {
  const frame = document.querySelector(".duo-modeling-frame");

  if (!frame) return;

  frame.setAttribute("scrolling", "no");
  frame.style.overflow = "hidden";

  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    if (event.source !== frame.contentWindow) return;

    const data = event.data;

    if (!data || data.type !== "DUOLAB_STUDIO_HEIGHT") {
      return;
    }

    const height = Number(data.height);

    if (!Number.isFinite(height)) return;
    if (height < 350 || height > 20000) return;

    const adjusted = Math.ceil(height + 6);
    frame.style.height = adjusted + "px";
    frame.style.minHeight = "0";
  });

  frame.addEventListener("load", function () {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;

      const h = Math.ceil(
        doc.documentElement.scrollHeight + 6
      );

      if (h >= 350 && h <= 20000) {
        frame.style.height = h + "px";
      }
    } catch (error) {
      console.warn("[DUOLAB] Frame sizing:", error);
    }
  });
})();