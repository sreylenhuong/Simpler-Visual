/*
  Folder state is kept separate from card navigation.

  Stability approach:
  - Cards are present as soon as the folder starts opening.
  - Card transitions are frozen until the covers finish opening.
  - We do not rely on transitionend from the covers.
    Safari/iPhone can be unreliable with 3D transform transition events.
*/

function initFolder({ stage, openButton }) {
  const OPEN_PRESS_DELAY = 80;
  const CARD_READY_DELAY = 40;

  // Match this with folder.css:
  // .cover { transition: transform 1.58s var(--ease-fold); }
  const OPEN_COVER_DURATION = 1580;

  // Match this with:
  // .stage.is-closing .cover { transition-duration: .82s; }
  const CLOSE_COVER_DURATION = 820;

  const CLOSE_CLEANUP_DELAY = 280;

  function nextFrame() {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }

  async function twoPaints() {
    await nextFrame();
    await nextFrame();
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  async function openInvitation() {
    if (
      stage.classList.contains("is-closing") ||
      stage.classList.contains("is-opening") ||
      stage.classList.contains("is-open")
    ) {
      return;
    }

    stage.classList.add("is-opening");
    stage.classList.remove("is-ready", "is-closing");

    // Cards are already inside the folder before the covers move.
    stage.classList.add("is-revealed");

    await wait(OPEN_PRESS_DELAY);
    await twoPaints();

    // This starts the cover animation.
    stage.classList.add("is-open");
    openButton.setAttribute("aria-expanded", "true");

    // Do not listen to transitionend here.
    // Safari can stutter or misfire with 3D transform transition events.
    await wait(OPEN_COVER_DURATION);

    await twoPaints();
    await wait(CARD_READY_DELAY);

    stage.classList.add("is-ready");
    stage.classList.remove("is-opening");
  }

  async function closeInvitation() {
    if (
      !stage.classList.contains("is-open") ||
      stage.classList.contains("is-closing")
    ) {
      return;
    }

    openButton.setAttribute("aria-expanded", "false");

    // Freeze cards first. Keep is-open during closing so cards remain inside
    // until the covers have visually closed.
    stage.classList.remove("is-ready");
    stage.classList.add("is-closing");

    await twoPaints();

    // Do not listen to transitionend here either.
    await wait(CLOSE_COVER_DURATION);

    stage.classList.remove("is-revealed");
    stage.classList.remove("is-open");

    await wait(CLOSE_CLEANUP_DELAY);
    stage.classList.remove("is-closing");
  }

  openButton.addEventListener("click", openInvitation);

  return { openInvitation, closeInvitation };
}