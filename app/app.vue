<template>
  <div>
    <div class="av-bg"></div>
    <div class="av-noise"></div>
    <div id="root">
      <NuxtRouteAnnouncer />
      <AppNav />
      <main class="av-main">
        <NuxtPage />
      </main>
      <footer
        style="
          border-top: 1px solid var(--line);
          padding: 20px 32px;
          text-align: center;
          color: var(--ink-faint);
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.16em;
        "
      >
        © 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0
      </footer>
    </div>
  </div>
</template>
