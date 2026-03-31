export async function enterPlayerMode() {
  try {
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
  } catch (_) {}
  const isMobile = window.innerWidth <= 1024 || "ontouchstart" in window;
  if (isMobile) {
    try {
      await (screen.orientation as any).lock("landscape-primary");
    } catch (_) {}
  }
}

export async function exitPlayerMode() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch (_) {}
  try {
    (screen.orientation as any).unlock();
  } catch (_) {}
}
