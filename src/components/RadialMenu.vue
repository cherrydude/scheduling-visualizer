<template>
  <div class="radial-menu-fixed">
    <button
      class="radial-center"
      @click="toggleMenu"
      :class="{ 'is-open': isOpen }"
      aria-label="Schnellzugriff"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
        <circle cx="5" cy="12" r="1"></circle>
      </svg>
    </button>

    <transition name="radial-fade">
      <div v-if="isOpen" class="radial-items-container">
        <button
          v-for="(item, index) in menuItems"
          :key="item.id"
          :ref="(el) => setItemRef(index, el as HTMLElement)"
          class="radial-item"
          :title="item.label"
          @click="selectItem(item)"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94m-2.83-2.83l2.83-2.83a2 2 0 0 1 2.83 0l2.83 2.83a2 2 0 0 1 0 2.83l-2.83 2.83"/>
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import gsap from 'gsap';

interface MenuItem {
  id: string;
  label: string;
  action: () => void;
}

const isOpen = ref(false);
const itemRefs = ref<(HTMLElement | null)[]>([]);

const menuItems: MenuItem[] = [
  {
    id: 'create-scenario',
    label: 'Szenario erstellen',
    action: () => {
      window.dispatchEvent(new CustomEvent('radial-menu:create-scenario'));
      closeMenu();
    },
  },
  {
    id: 'start-demo',
    label: 'Demo starten',
    action: () => {
      window.dispatchEvent(new CustomEvent('radial-menu:start-demo'));
      closeMenu();
    },
  },
  {
    id: 'change-algorithm',
    label: 'Algorithmus ändern',
    action: () => {
      window.dispatchEvent(new CustomEvent('radial-menu:change-algorithm'));
      closeMenu();
    },
  },
  {
    id: 'toggle-metrics',
    label: 'Metriken anzeigen',
    action: () => {
      window.dispatchEvent(new CustomEvent('radial-menu:toggle-metrics'));
      closeMenu();
    },
  },
];

const setItemRef = (index: number, el: HTMLElement | null) => {
  itemRefs.value[index] = el;
};

function toggleMenu() {
  if (isOpen.value) {
    closeMenu();
  } else {
    openMenu();
  }
}

function openMenu() {
  isOpen.value = true;
  animateItemsIn();
}

function closeMenu() {
  animateItemsOut();
}

function selectItem(item: MenuItem) {
  item.action();
}

function animateItemsIn() {
  const radius = 90;
  const itemCount = menuItems.length;

  itemRefs.value.forEach((item, index) => {
    if (!item) return;

    const angle = (index / itemCount) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    gsap.set(item, {
      x: 0,
      y: 0,
      opacity: 0,
      scale: 0,
    });

    gsap.to(item, {
      x,
      y,
      opacity: 1,
      scale: 1,
      duration: 0.5,
      delay: index * 0.08,
      ease: 'back.out',
    });
  });
}

function animateItemsOut() {
  itemRefs.value.forEach((item, index) => {
    if (!item) return;

    gsap.to(item, {
      x: 0,
      y: 0,
      opacity: 0,
      scale: 0,
      duration: 0.4,
      delay: (itemRefs.value.length - index - 1) * 0.05,
      ease: 'back.in',
      onComplete: () => {
        if (index === itemRefs.value.length - 1) {
          isOpen.value = false;
        }
      },
    });
  });
}

onMounted(() => {
  itemRefs.value = new Array(menuItems.length);
});
</script>

<style scoped>
.radial-menu-fixed {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 9998;
  width: 64px;
  height: 64px;
}

.radial-center {
  position: absolute;
  width: 64px;
  height: 64px;
  bottom: 0;
  right: 0;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  z-index: 10;
  padding: 0;
}

.radial-center:hover {
  background: var(--bg-hover);
  border-color: var(--link);
  transform: scale(1.1);
}

.radial-center.is-open {
  transform: rotate(45deg);
  background: var(--bg-hover);
}

.radial-center svg {
  width: 28px;
  height: 28px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.radial-items-container {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 300px;
  height: 300px;
}

.radial-item {
  position: absolute;
  width: 56px;
  height: 56px;
  top: 50%;
  left: 50%;
  margin-left: -28px;
  margin-top: -28px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  padding: 0;
}

.radial-item:hover {
  background: var(--bg-hover);
  border-color: var(--link);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  transform: scale(1.2);
}

.radial-item:active {
  transform: scale(0.9);
}

.radial-item svg {
  width: 24px;
  height: 24px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.radial-fade-enter-active,
.radial-fade-leave-active {
  transition: opacity 0.2s ease;
}

.radial-fade-enter-from,
.radial-fade-leave-to {
  opacity: 0;
}
</style>


