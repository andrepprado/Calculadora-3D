(function () {
  if (window.parent === window) return;

  let previous = 0;
  let scheduled = false;

  function publishHeight() {
    scheduled = false;

    const body = document.body;
    const html = document.documentElement;

    if (!body || !html) return;

    const height = Math.ceil(Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.scrollHeight
    ));

    if (Math.abs(height - previous) < 3) return;
    previous = height;

    window.parent.postMessage({
      type: "DUOLAB_STUDIO_HEIGHT",
      height
    }, window.location.origin);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(publishHeight);
  }

  window.addEventListener("load", schedule);
  window.addEventListener("resize", schedule);

  if (window.ResizeObserver) {
    const observer = new ResizeObserver(schedule);
    observer.observe(document.documentElement);
    observer.observe(document.body);
  }

  if (window.MutationObserver) {
    new MutationObserver(schedule).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });
  }

  schedule();
})();