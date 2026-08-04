<script setup lang="ts">
import { GAMES } from "~/data/games";

interface FeatureItem {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;
  desc: string;
  color: "cyan" | "yellow" | "magenta" | "green";
}

interface StatItem {
  n: string;
  unit: string;
  sub: string;
}

interface ActivityRow {
  player: string;
  game: string;
  score: number;
  time: string;
  color: "magenta" | "yellow" | "green" | "cyan";
}

interface TopPlayerRow {
  rank: number;
  player: string;
  score: number;
}

interface FaqItem {
  question: string;
  answer: string;
}

useReveal();

const router = useRouter();

const previewGames = computed(() => GAMES.slice(0, 6));

const features: FeatureItem[] = [
  {
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    desc: "Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    color: "cyan",
  },
  {
    icon: "FREE",
    title: "100% GRATIS",
    desc: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    color: "yellow",
  },
  {
    icon: "TROPHY",
    title: "LADDER BOARDS",
    desc: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    color: "magenta",
  },
  {
    icon: "ROCKET",
    title: "SIEMPRE CRECIENDO",
    desc: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    color: "green",
  },
];

const stats: StatItem[] = [
  { n: "12+", unit: "JUEGOS", sub: "Y CONTANDO" },
  { n: "MILES", unit: "DE PARTIDAS", sub: "JUGADAS CADA DÍA" },
  { n: "GLOBAL", unit: "RANKING", sub: "COMPITE CON EL MUNDO" },
];

const activity: ActivityRow[] = [
  { player: "NEONFOX", game: "Caída", score: 184220, time: "hace 2 min", color: "magenta" },
  { player: "PX_KAI", game: "Glotón", score: 96400, time: "hace 5 min", color: "yellow" },
  { player: "Z3R0COOL", game: "Invasores", score: 54190, time: "hace 8 min", color: "green" },
  { player: "VAULT_07", game: "Rocas", score: 41200, time: "hace 12 min", color: "cyan" },
  { player: "GLITCHA", game: "Bloque Buster", score: 28450, time: "hace 18 min", color: "cyan" },
  { player: "ARKADYA", game: "Serpentina", score: 7820, time: "hace 24 min", color: "green" },
  { player: "CYBER_LU", game: "Ranaria", score: 18900, time: "hace 31 min", color: "yellow" },
];

const topPlayers: TopPlayerRow[] = [
  { rank: 1, player: "NEONFOX", score: 312840 },
  { rank: 2, player: "PX_KAI", score: 248110 },
  { rank: 3, player: "M00NRYU", score: 196720 },
  { rank: 4, player: "VAULT_07", score: 154300 },
  { rank: 5, player: "GLITCHA", score: 138900 },
];

const faqs: FaqItem[] = [
  {
    question: "¿REALMENTE ES GRATIS?",
    answer:
      'Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor a los clásicos. No hay versión "premium" escondida.',
  },
  {
    question: "¿NECESITO CREAR CUENTA?",
    answer:
      "No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el ranking, regístrate en 10 segundos.",
  },
  {
    question: "¿CÓMO SOBREVIVEN SIN COBRAR?",
    answer: "Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que aceptamos.",
  },
];

const topRowClass = (i: number) => (i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : "");

const goToGames = () => router.push("/games");
const goToAuth = () => router.push("/auth");
const goToSalon = () => router.push("/salon-de-la-fama");
const goToGame = (id: string) => router.push(`/juego/${id}`);
</script>

<template>
  <div class="home fade-in">
    <!-- HERO -->
    <section class="home-hero">
      <div class="home-silos" aria-hidden="true">
        <svg class="silo s1" viewBox="0 0 40 32"><g fill="#00f5ff">
          <rect x="6" y="4" width="4" height="4" /><rect x="30" y="4" width="4" height="4" />
          <rect x="2" y="8" width="36" height="4" />
          <rect x="2" y="12" width="4" height="4" /><rect x="14" y="12" width="4" height="4" /><rect x="22" y="12" width="4" height="4" /><rect x="34" y="12" width="4" height="4" />
          <rect x="2" y="16" width="36" height="4" />
          <rect x="6" y="20" width="4" height="4" /><rect x="30" y="20" width="4" height="4" />
        </g></svg>
        <svg class="silo s2" viewBox="0 0 32 32"><g fill="#ff006e">
          <rect x="8" y="0" width="16" height="4" />
          <rect x="4" y="4" width="24" height="4" />
          <rect x="0" y="8" width="32" height="12" />
          <rect x="0" y="20" width="6" height="6" /><rect x="10" y="20" width="4" height="6" /><rect x="18" y="20" width="4" height="6" /><rect x="26" y="20" width="6" height="6" />
        </g></svg>
        <svg class="silo s3" viewBox="0 0 32 32"><g fill="#f5ff00">
          <rect x="10" y="0" width="12" height="4" />
          <rect x="6" y="4" width="20" height="4" />
          <rect x="4" y="8" width="6" height="6" /><rect x="22" y="8" width="6" height="6" />
          <rect x="2" y="14" width="28" height="10" />
          <rect x="6" y="24" width="4" height="4" /><rect x="14" y="24" width="4" height="4" /><rect x="22" y="24" width="4" height="4" />
        </g></svg>
        <svg class="silo s4" viewBox="0 0 24 24"><g fill="#00ff88">
          <rect x="10" y="0" width="4" height="24" />
          <rect x="0" y="10" width="24" height="4" />
          <rect x="6" y="6" width="12" height="12" fill="none" stroke="#00ff88" stroke-width="2" />
        </g></svg>
        <svg class="silo s5" viewBox="0 0 36 24"><g fill="#aa00ff">
          <rect x="14" y="2" width="8" height="4" />
          <rect x="10" y="6" width="16" height="4" />
          <rect x="4" y="10" width="28" height="4" />
          <rect x="0" y="14" width="36" height="4" />
          <rect x="6" y="18" width="4" height="2" /><rect x="16" y="18" width="4" height="2" /><rect x="26" y="18" width="4" height="2" />
        </g></svg>
        <svg class="silo s6" viewBox="0 0 20 20"><g fill="#ffcf3a">
          <rect x="6" y="0" width="8" height="2" />
          <rect x="2" y="2" width="16" height="2" />
          <rect x="0" y="4" width="20" height="12" />
          <rect x="2" y="16" width="16" height="2" />
          <rect x="6" y="18" width="8" height="2" />
          <rect x="8" y="4" width="4" height="12" fill="#0a0a0f" />
        </g></svg>
        <svg class="silo s7" viewBox="0 0 24 22"><g fill="#ff3060">
          <rect x="2" y="2" width="6" height="2" /><rect x="16" y="2" width="6" height="2" />
          <rect x="0" y="4" width="10" height="4" /><rect x="14" y="4" width="10" height="4" />
          <rect x="0" y="8" width="24" height="4" />
          <rect x="2" y="12" width="20" height="2" />
          <rect x="4" y="14" width="16" height="2" />
          <rect x="6" y="16" width="12" height="2" />
          <rect x="8" y="18" width="8" height="2" />
          <rect x="10" y="20" width="4" height="2" />
        </g></svg>
        <svg class="silo s8" viewBox="0 0 24 24"><g fill="#00d4ff">
          <rect x="8" y="2" width="8" height="6" />
          <rect x="2" y="8" width="20" height="8" />
          <rect x="8" y="16" width="8" height="6" />
          <rect x="11" y="6" width="2" height="2" fill="#0a0a0f" />
          <rect x="11" y="16" width="2" height="2" fill="#0a0a0f" />
          <rect x="4" y="11" width="2" height="2" fill="#0a0a0f" />
          <rect x="18" y="11" width="2" height="2" fill="#0a0a0f" />
        </g></svg>
      </div>
      <div class="home-hero-inner">
        <div class="hero-eyebrow pixel neon-yellow">▸ INSERTA UNA MONEDA<span class="blink">_</span></div>
        <h1 class="home-title">
          <span class="line-1">EL ARCADE</span>
          <span class="line-2">CLÁSICO ESTÁ</span>
          <span class="line-3">DE VUELTA</span>
        </h1>
        <p class="home-sub">
          Juega los mejores clásicos directamente en tu navegador.<br />
          Sin descargas. Sin costo. Solo diversión.
        </p>
        <div class="home-ctas">
          <button class="btn xl pulse" @click="goToGames">▶ EXPLORAR JUEGOS</button>
          <button class="btn xl magenta" @click="goToAuth">✦ CREAR CUENTA</button>
        </div>
        <div class="hero-scroll" aria-hidden="true">
          <span>DESLIZA</span>
          <span class="arrow">▼</span>
        </div>
      </div>
    </section>

    <!-- WHY -->
    <section class="home-section reveal">
      <div class="section-head">
        <div class="kicker pixel neon-magenta">// 01</div>
        <h2 class="section-title">¿POR QUÉ ARCADE VAULT?</h2>
        <div class="section-rule"></div>
      </div>
      <div class="feature-grid">
        <div
          v-for="(f, i) in features"
          :key="f.title"
          :class="['feature-card', f.color]"
          :style="{ transitionDelay: `${i * 80}ms` }"
        >
          <FeatureIcon :kind="f.icon" />
          <div class="ft-title pixel">{{ f.title }}</div>
          <div class="ft-desc">{{ f.desc }}</div>
        </div>
      </div>
    </section>

    <!-- GAMES PREVIEW -->
    <section class="home-section reveal">
      <div class="section-head">
        <div class="kicker pixel neon-cyan">// 02</div>
        <h2 class="section-title">JUEGOS DISPONIBLES AHORA</h2>
        <div class="section-rule"></div>
      </div>
      <div class="mini-rail">
        <MiniCard v-for="g in previewGames" :key="g.id" :game="g" @select="goToGame" />
      </div>
      <div style="text-align: center; margin-top: 24px">
        <button class="btn lg" @click="goToGames">VER TODOS LOS JUEGOS →</button>
      </div>
    </section>

    <!-- STATS -->
    <section class="home-stats reveal">
      <div class="stats-inner">
        <div
          v-for="(st, i) in stats"
          :key="st.unit"
          class="stat-block"
          :style="{ transitionDelay: `${i * 90}ms` }"
        >
          <div class="stat-n neon-yellow">{{ st.n }}</div>
          <div class="stat-u pixel">{{ st.unit }}</div>
          <div class="stat-s">{{ st.sub }}</div>
        </div>
      </div>
    </section>

    <!-- RECENT ACTIVITY / LEADERBOARD -->
    <section class="home-section reveal">
      <div class="section-head">
        <div class="kicker pixel neon-yellow">// 03</div>
        <h2 class="section-title">ACTIVIDAD EN VIVO</h2>
        <div class="section-rule"></div>
      </div>
      <div class="activity-grid">
        <div class="activity-card">
          <div class="ac-head">
            <div class="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
          </div>
          <div class="ticker">
            <div
              v-for="(row, i) in activity"
              :key="row.player + row.game"
              class="tick-row"
              :style="{ animationDelay: `${i * 60}ms` }"
            >
              <span :class="['tk-p', 'neon-' + row.color]">{{ row.player }}</span>
              <span class="tk-mid">▸ {{ row.game }}</span>
              <span class="tk-s">+{{ row.score.toLocaleString("es-ES") }}</span>
              <span class="tk-t">{{ row.time }}</span>
            </div>
          </div>
        </div>

        <div class="activity-card">
          <div class="ac-head">
            <div class="ac-title pixel neon-magenta">▸ TOP JUGADORES · HOY</div>
            <button class="lb-link" @click="goToSalon">VER SALÓN →</button>
          </div>
          <div class="top-list">
            <div v-for="(row, i) in topPlayers" :key="row.player" :class="['top-row', topRowClass(i)]">
              <span class="tp-rk">#{{ String(row.rank).padStart(2, "0") }}</span>
              <span class="tp-bar"><span class="tp-fill" :style="{ width: `${100 - i * 16}%` }"></span></span>
              <span class="tp-p">{{ row.player }}</span>
              <span class="tp-s">{{ row.score.toLocaleString("es-ES") }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PRICING -->
    <section class="home-section reveal">
      <div class="section-head">
        <div class="kicker pixel neon-green">// 04</div>
        <h2 class="section-title">PRECIOS</h2>
        <div class="section-rule"></div>
      </div>
      <div class="pricing-grid">
        <div class="price-card">
          <div class="pc-label pixel">PLAN ÚNICO</div>
          <div class="pc-name pixel">JUGADOR VAULT</div>
          <div class="pc-amount">
            <span class="pc-amount-n">$0</span>
            <span class="pc-amount-u">/ SIEMPRE</span>
          </div>
          <div class="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
          <ul class="pc-list">
            <li>✔ Acceso a todos los juegos</li>
            <li>✔ Ranking global y salón de la fama</li>
            <li>✔ Sin anuncios entre partidas</li>
            <li>✔ Guarda tus puntuaciones</li>
            <li>✔ Nuevos juegos cada mes</li>
            <li>✔ Funciona en cualquier navegador</li>
          </ul>
          <button class="btn xl pulse" style="width: 100%" @click="goToAuth">EMPEZAR GRATIS →</button>
          <div class="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
          <div class="pc-stamp pixel">FREE<br />PLAY</div>
        </div>

        <div class="pricing-faq">
          <div v-for="faq in faqs" :key="faq.question" class="faq-item">
            <div class="faq-q pixel">{{ faq.question }}</div>
            <div class="faq-a">{{ faq.answer }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- FINAL CTA -->
    <section class="home-final reveal">
      <h2 class="final-title pixel">¿LISTO PARA JUGAR?</h2>
      <button class="btn xl pulse final-cta" @click="goToGames">INSERTAR MONEDA →</button>
      <div class="final-tag">Gratis. Sin registro obligatorio. Empieza en segundos.</div>
    </section>
  </div>
</template>
