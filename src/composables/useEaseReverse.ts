import gsap from "gsap";
import { onMounted, ref } from "vue";

/** Fügt interaktiven Buttons eine reversible GSAP-Hover-Animation hinzu. */
export function useEaseReverse(selector: string = "button") {
  const container = ref<HTMLElement | null>(null);

  onMounted(() => {
    const buttons = document.querySelectorAll(
      selector,
    ) as NodeListOf<HTMLElement>;

    buttons.forEach((button) => {
      let tl: gsap.core.Timeline | null = null;

      button.addEventListener("mouseenter", () => {
        if (tl) tl.kill();

        tl = gsap.timeline();
        tl.to(
          button,
          {
            scale: 1.08,
            rotation: 2,
            duration: 0.3,
            ease: "back.out",
          },
          0,
        );
      });

      button.addEventListener("mouseleave", () => {
        if (tl) tl.kill();

        tl = gsap.timeline();
        tl.to(
          button,
          {
            scale: 1,
            rotation: 0,
            duration: 0.3,
            ease: "back.out",
          },
          0,
        );
      });
    });
  });

  return { container };
}
